#!/usr/bin/env node

const MUSICBRAINZ_API_BASE = 'https://musicbrainz.org/ws/2'
const MUSICBRAINZ_USER_AGENT = 'liner-notez-ios/0.0.1 (https://github.com/edtremsaga/vibey-liner-notez)'
const DEFAULT_PRODUCERS = [
  'Brian Eno',
  'Tony Visconti',
  'Quincy Jones',
  'Daniel Lanois',
  'Steve Albini',
  'Rick Rubin',
  'George Martin'
]
const DEFAULT_RELEASE_LIMIT = 25
const MIN_REQUEST_INTERVAL_MS = 1100
const HIGH_CONFIDENCE_SCORE = 95
const PRODUCER_RELATION_TYPE_IDS = new Set([
  '8bf377ba-8d71-4ecc-97f2-7bb2d8a2a75f'
])
const PRODUCER_RELATION_TYPES = new Set([
  'producer'
])
const PRODUCER_ATTRIBUTES = new Set([
  'additional',
  'assistant',
  'associate',
  'co',
  'executive',
  'task'
])

let requestCount = 0
let lastRequestAt = 0

function parseArgs(argv) {
  const args = {
    producers: [],
    limit: DEFAULT_RELEASE_LIMIT,
    json: false
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--limit' || arg === '-l') {
      const next = Number(argv[index + 1])
      if (Number.isInteger(next) && next > 0) {
        args.limit = next
        index += 1
      }
      continue
    }

    if (arg === '--json') {
      args.json = true
      continue
    }

    args.producers.push(arg)
  }

  if (args.producers.length === 0) {
    args.producers = DEFAULT_PRODUCERS
  }

  return args
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function musicBrainzFetch(path, params = {}) {
  const elapsedSinceLastRequest = Date.now() - lastRequestAt
  if (lastRequestAt > 0 && elapsedSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
    await sleep(MIN_REQUEST_INTERVAL_MS - elapsedSinceLastRequest)
  }

  const url = new URL(`${MUSICBRAINZ_API_BASE}${path}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value)
    }
  }

  requestCount += 1
  lastRequestAt = Date.now()

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': MUSICBRAINZ_USER_AGENT
    }
  })

  if (!response.ok) {
    throw new Error(`MusicBrainz request failed: ${response.status} ${response.statusText} ${url.href}`)
  }

  return response.json()
}

function normalizeName(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[.\s']/g, '')
}

function getCandidateNames(artist) {
  const aliases = Array.isArray(artist?.aliases) ? artist.aliases : []
  return [
    artist?.name,
    artist?.['sort-name'],
    ...aliases.flatMap((alias) => [alias?.name, alias?.['sort-name']])
  ].filter(Boolean)
}

function isExactNameOrAliasMatch(input, artist) {
  const normalizedInput = normalizeName(input)
  return getCandidateNames(artist).some((name) => normalizeName(name) === normalizedInput)
}

function formatCandidate(artist) {
  return {
    id: artist?.id ?? null,
    name: artist?.name ?? null,
    sortName: artist?.['sort-name'] ?? null,
    disambiguation: artist?.disambiguation || null,
    type: artist?.type || null,
    score: Number(artist?.score ?? 0),
    country: artist?.country || null
  }
}

function selectHighConfidenceCandidate(producerName, candidates) {
  const exactMatches = candidates
    .filter((candidate) => candidate.id && isExactNameOrAliasMatch(producerName, candidate))
    .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))

  if (exactMatches.length === 0) {
    return {
      selected: null,
      reason: 'No exact name or alias match among returned artists.'
    }
  }

  const [best, second] = exactMatches
  const bestScore = Number(best.score ?? 0)
  const secondScore = Number(second?.score ?? 0)
  const tiedDifferentArtist = second && secondScore === bestScore && second.id !== best.id

  if (bestScore < HIGH_CONFIDENCE_SCORE) {
    return {
      selected: null,
      reason: `Best exact match score ${bestScore} is below ${HIGH_CONFIDENCE_SCORE}.`
    }
  }

  if (tiedDifferentArtist) {
    return {
      selected: null,
      reason: `Top exact matches are tied at score ${bestScore}.`
    }
  }

  return {
    selected: best,
    reason: `Selected highest exact name/alias match with score ${bestScore}.`
  }
}

async function resolveProducerCandidates(producerName) {
  const data = await musicBrainzFetch('/artist', {
    query: `artist:"${producerName}" OR alias:"${producerName}"`,
    limit: '10',
    fmt: 'json'
  })

  return Array.isArray(data?.artists) ? data.artists : []
}

function getRelations(artistData) {
  return Array.isArray(artistData?.relations) ? artistData.relations : []
}

function getRelationTypeId(relation) {
  return relation?.['type-id'] ?? relation?.typeId ?? null
}

function isProducerReleaseRelation(relation) {
  if (relation?.['target-type'] !== 'release' || !relation?.release?.id) {
    return false
  }

  const type = String(relation?.type ?? '').toLowerCase()
  const typeId = getRelationTypeId(relation)

  return PRODUCER_RELATION_TYPES.has(type) || PRODUCER_RELATION_TYPE_IDS.has(typeId)
}

function getRelationAttributes(relation) {
  const attributes = Array.isArray(relation?.attributes) ? relation.attributes.filter(Boolean) : []
  const attributeValues = relation?.['attribute-values'] && typeof relation['attribute-values'] === 'object'
    ? relation['attribute-values']
    : {}
  const attributeCredits = relation?.['attribute-credits'] && typeof relation['attribute-credits'] === 'object'
    ? relation['attribute-credits']
    : {}

  const output = {}
  for (const attribute of attributes) {
    const key = String(attribute)
    if (!PRODUCER_ATTRIBUTES.has(key)) {
      output[key] = attributeValues[key] ?? attributeCredits[key] ?? true
      continue
    }

    output[key] = attributeValues[key] ?? attributeCredits[key] ?? true
  }

  return output
}

function formatAttributes(attributes) {
  const entries = Object.entries(attributes)
  if (entries.length === 0) {
    return 'none'
  }

  return entries
    .map(([key, value]) => value === true ? key : `${key}: ${value}`)
    .join(', ')
}

function extractArtistCredit(artistCredit) {
  if (!Array.isArray(artistCredit)) {
    return null
  }

  const names = artistCredit.map((credit) => {
    const name = credit?.name || credit?.artist?.name
    if (!name) {
      return ''
    }

    return `${name}${credit?.joinphrase || ''}`
  })

  const artistCreditText = names.join('').trim()
  return artistCreditText || null
}

function mapReleaseEvidence(relation, releaseData) {
  const releaseGroup = releaseData?.['release-group']
  if (!releaseGroup?.id) {
    return null
  }

  const relationshipAttributes = getRelationAttributes(relation)
  const relationshipType = relation?.type ?? 'producer'
  const sourceReleaseTitle = releaseData?.title || relation?.release?.title || 'Untitled release'

  return {
    releaseGroupTitle: releaseGroup?.title || sourceReleaseTitle,
    releaseGroupArtistCredit: extractArtistCredit(releaseGroup?.['artist-credit']) ||
      extractArtistCredit(releaseData?.['artist-credit']) ||
      'Unknown artist',
    firstReleaseDate: releaseGroup?.['first-release-date'] || null,
    releaseGroupType: releaseGroup?.['primary-type'] || null,
    secondaryTypes: Array.isArray(releaseGroup?.['secondary-types']) ? releaseGroup['secondary-types'] : [],
    sourceReleaseTitle,
    sourceReleaseMbid: releaseData?.id || relation?.release?.id || null,
    releaseGroupMbid: releaseGroup.id,
    relationshipType,
    relationshipTypeId: getRelationTypeId(relation),
    relationshipAttributes,
    targetCredit: relation?.['target-credit'] || null,
    evidenceLabel: `${relationshipType[0]?.toUpperCase() ?? 'P'}${relationshipType.slice(1)} on release: ${sourceReleaseTitle}`
  }
}

function classifyStrategy(metrics, results) {
  if (metrics.releaseGroupsReturned >= 8 && metrics.totalMusicBrainzRequests <= 35) {
    return 'promising'
  }

  if (metrics.releaseGroupsReturned >= 3) {
    return 'weak'
  }

  if (metrics.producerLikeReleaseRelationsFound > 0 && results.length === 0) {
    return 'weak'
  }

  return 'unusable'
}

async function diagnoseProducer(producerName, limit) {
  const startedAt = Date.now()
  const requestCountAtStart = requestCount
  const metrics = {
    totalReleaseRelationsInspected: 0,
    producerLikeReleaseRelationsFound: 0,
    releaseLookupsAttempted: 0,
    releaseGroupsReturned: 0,
    duplicateReleaseGroupsSkipped: 0,
    missingReleaseGroupCount: 0,
    nonAlbumCount: 0,
    elapsedMs: 0,
    totalMusicBrainzRequests: 0,
    strategyAssessment: 'unusable'
  }

  try {
    const candidates = await resolveProducerCandidates(producerName)
    const selection = selectHighConfidenceCandidate(producerName, candidates)
    const formattedCandidates = candidates.map(formatCandidate)

    if (!selection.selected) {
      metrics.elapsedMs = Date.now() - startedAt
      metrics.totalMusicBrainzRequests = requestCount - requestCountAtStart
      return {
        producerName,
        status: 'ambiguous-or-low-confidence',
        selectionReason: selection.reason,
        candidates: formattedCandidates,
        selectedProducer: null,
        metrics,
        results: []
      }
    }

    const artistData = await musicBrainzFetch(`/artist/${selection.selected.id}`, {
      inc: 'release-rels',
      fmt: 'json'
    })
    const releaseRelations = getRelations(artistData).filter((relation) => relation?.['target-type'] === 'release')
    const producerLikeRelations = releaseRelations.filter(isProducerReleaseRelation)
    const releaseGroupIds = new Set()
    const results = []

    metrics.totalReleaseRelationsInspected = releaseRelations.length
    metrics.producerLikeReleaseRelationsFound = producerLikeRelations.length

    for (const relation of producerLikeRelations.slice(0, limit)) {
      metrics.releaseLookupsAttempted += 1

      let releaseData = null
      try {
        releaseData = await musicBrainzFetch(`/release/${relation.release.id}`, {
          inc: 'release-groups+artist-credits',
          fmt: 'json'
        })
      } catch (error) {
        metrics.missingReleaseGroupCount += 1
        continue
      }

      const evidence = mapReleaseEvidence(relation, releaseData)
      if (!evidence) {
        metrics.missingReleaseGroupCount += 1
        continue
      }

      if (evidence.releaseGroupType && evidence.releaseGroupType !== 'Album') {
        metrics.nonAlbumCount += 1
      }

      if (releaseGroupIds.has(evidence.releaseGroupMbid)) {
        metrics.duplicateReleaseGroupsSkipped += 1
        continue
      }

      releaseGroupIds.add(evidence.releaseGroupMbid)
      results.push(evidence)
    }

    metrics.releaseGroupsReturned = results.length
    metrics.elapsedMs = Date.now() - startedAt
    metrics.totalMusicBrainzRequests = requestCount - requestCountAtStart
    metrics.strategyAssessment = classifyStrategy(metrics, results)

    return {
      producerName,
      status: 'ok',
      selectionReason: selection.reason,
      candidates: formattedCandidates,
      selectedProducer: formatCandidate(selection.selected),
      metrics,
      results
    }
  } catch (error) {
    metrics.elapsedMs = Date.now() - startedAt
    metrics.totalMusicBrainzRequests = requestCount - requestCountAtStart
    return {
      producerName,
      status: 'failed',
      error: error?.message || String(error),
      candidates: [],
      selectedProducer: null,
      metrics,
      results: []
    }
  }
}

function printProducerReport(report) {
  console.log('')
  console.log(`## ${report.producerName}`)
  console.log(`Status: ${report.status}`)

  if (report.selectionReason) {
    console.log(`Selection: ${report.selectionReason}`)
  }

  if (report.error) {
    console.log(`Error: ${report.error}`)
  }

  console.log('Candidates:')
  if (report.candidates.length === 0) {
    console.log('  - none')
  } else {
    for (const candidate of report.candidates) {
      const details = [
        candidate.type,
        candidate.disambiguation,
        candidate.country,
        `score ${candidate.score}`
      ].filter(Boolean).join(', ')
      console.log(`  - ${candidate.name} | ${candidate.id} | ${details}`)
    }
  }

  if (report.selectedProducer) {
    console.log(`Selected producer MBID: ${report.selectedProducer.id}`)
  }

  console.log('Metrics:')
  console.log(`  release relations inspected: ${report.metrics.totalReleaseRelationsInspected}`)
  console.log(`  producer-like release relations found: ${report.metrics.producerLikeReleaseRelationsFound}`)
  console.log(`  release lookups attempted: ${report.metrics.releaseLookupsAttempted}`)
  console.log(`  release groups returned: ${report.metrics.releaseGroupsReturned}`)
  console.log(`  duplicate release groups skipped: ${report.metrics.duplicateReleaseGroupsSkipped}`)
  console.log(`  non-album count: ${report.metrics.nonAlbumCount}`)
  console.log(`  missing release-group count: ${report.metrics.missingReleaseGroupCount}`)
  console.log(`  elapsed: ${(report.metrics.elapsedMs / 1000).toFixed(1)}s`)
  console.log(`  MusicBrainz requests: ${report.metrics.totalMusicBrainzRequests}`)
  console.log(`  release-level-only assessment: ${report.metrics.strategyAssessment}`)

  console.log('Results:')
  if (report.results.length === 0) {
    console.log('  - none')
  } else {
    report.results.forEach((result, index) => {
      const secondaryTypes = result.secondaryTypes.length > 0 ? result.secondaryTypes.join(', ') : 'none'
      console.log(`  ${index + 1}. ${result.releaseGroupTitle} - ${result.releaseGroupArtistCredit}`)
      console.log(`     first release date: ${result.firstReleaseDate || 'unknown'}`)
      console.log(`     release group type: ${result.releaseGroupType || 'unknown'} | secondary: ${secondaryTypes}`)
      console.log(`     source release: ${result.sourceReleaseTitle}`)
      console.log(`     source release MBID: ${result.sourceReleaseMbid}`)
      console.log(`     release group MBID: ${result.releaseGroupMbid}`)
      console.log(`     relationship: ${result.relationshipType} (${result.relationshipTypeId || 'no type id'})`)
      console.log(`     attributes: ${formatAttributes(result.relationshipAttributes)}`)
      console.log(`     evidence: ${result.evidenceLabel}`)
    })
  }

  console.log('JSON:')
  console.log(JSON.stringify({
    producerName: report.producerName,
    status: report.status,
    selectedProducer: report.selectedProducer,
    metrics: report.metrics,
    results: report.results
  }))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const startedAt = Date.now()
  const reports = []

  console.log('Liner Notez Producer Search POC')
  console.log(`Release-level-only MusicBrainz relationship diagnosis. Limit: ${args.limit} release relations per producer.`)
  console.log(`Producers: ${args.producers.join(', ')}`)
  console.log('')

  for (const producerName of args.producers) {
    const report = await diagnoseProducer(producerName, args.limit)
    reports.push(report)

    if (!args.json) {
      printProducerReport(report)
    }
  }

  const elapsedMs = Date.now() - startedAt
  const failed = reports.filter((report) => report.status === 'failed')
  const ambiguous = reports.filter((report) => report.status === 'ambiguous-or-low-confidence')

  console.log('')
  console.log('## Overall Summary')
  console.log(`Total elapsed: ${(elapsedMs / 1000).toFixed(1)}s`)
  console.log(`Total MusicBrainz requests: ${requestCount}`)
  console.log(`Failed producers: ${failed.length ? failed.map((report) => report.producerName).join(', ') : 'none'}`)
  console.log(`Ambiguous/low-confidence producers: ${ambiguous.length ? ambiguous.map((report) => report.producerName).join(', ') : 'none'}`)
  console.log(`Assessments: ${reports.map((report) => `${report.producerName}=${report.metrics.strategyAssessment}`).join('; ')}`)

  if (args.json) {
    console.log(JSON.stringify({
      elapsedMs,
      requestCount,
      reports
    }, null, 2))
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
