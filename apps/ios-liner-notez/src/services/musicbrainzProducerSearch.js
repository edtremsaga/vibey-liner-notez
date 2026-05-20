const MUSICBRAINZ_API_BASE = 'https://musicbrainz.org/ws/2'
const MUSICBRAINZ_USER_AGENT = 'liner-notez-ios/0.0.1 (https://github.com/edtremsaga/vibey-liner-notez)'
const HIGH_CONFIDENCE_SCORE = 95
const MIN_PLAUSIBLE_SCORE = 50
const MAX_CANDIDATES = 10
const MAX_ALIASES = 4
const DEFAULT_PRODUCER_RELEASE_LOOKUP_LIMIT = 10
const MIN_MUSICBRAINZ_REQUEST_INTERVAL_MS = 1100
const PRODUCER_RELATION_TYPE_IDS = new Set([
  '8bf377ba-8d71-4ecc-97f2-7bb2d8a2a75f'
])

let lastMusicBrainzRequestAt = 0

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function fetchMusicBrainzJson(path, params, metrics = null) {
  const elapsedSinceLastRequest = Date.now() - lastMusicBrainzRequestAt
  if (lastMusicBrainzRequestAt > 0 && elapsedSinceLastRequest < MIN_MUSICBRAINZ_REQUEST_INTERVAL_MS) {
    await sleep(MIN_MUSICBRAINZ_REQUEST_INTERVAL_MS - elapsedSinceLastRequest)
  }

  const url = new URL(`${MUSICBRAINZ_API_BASE}${path}`)
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value)
    }
  }

  lastMusicBrainzRequestAt = Date.now()
  if (metrics) {
    metrics.requestCount += 1
  }

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': MUSICBRAINZ_USER_AGENT
    }
  })

  if (!response.ok) {
    throw new Error(`MusicBrainz request failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

function normalizeCandidateValue(value) {
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
  const normalizedInput = normalizeCandidateValue(input)

  if (!normalizedInput || !artist?.id) {
    return false
  }

  return getCandidateNames(artist).some((name) => normalizeCandidateValue(name) === normalizedInput)
}

function mapAlias(alias) {
  return {
    name: alias?.name ?? null,
    sortName: alias?.['sort-name'] ?? null,
    type: alias?.type ?? null,
    locale: alias?.locale ?? null,
    primary: alias?.primary ?? false
  }
}

function mapProducerCandidate(artist, producerName) {
  const aliases = Array.isArray(artist?.aliases) ? artist.aliases.map(mapAlias).filter((alias) => alias.name) : []
  const score = Number(artist?.score ?? 0)

  return {
    id: artist?.id ?? null,
    mbid: artist?.id ?? null,
    name: artist?.name ?? producerName,
    sortName: artist?.['sort-name'] ?? null,
    type: artist?.type ?? null,
    disambiguation: artist?.disambiguation || null,
    country: artist?.country || null,
    lifeSpan: {
      begin: artist?.['life-span']?.begin ?? null,
      end: artist?.['life-span']?.end ?? null,
      ended: artist?.['life-span']?.ended ?? false
    },
    aliases: aliases.slice(0, MAX_ALIASES),
    score,
    isExactMatch: isExactNameOrAliasMatch(producerName, artist)
  }
}

function isPlausibleCandidate(candidate) {
  return candidate.id && (candidate.score >= MIN_PLAUSIBLE_SCORE || candidate.isExactMatch)
}

function selectAutoCandidate(candidates) {
  const exactMatches = candidates
    .filter((candidate) => candidate.isExactMatch)
    .sort((a, b) => b.score - a.score)

  if (exactMatches.length === 0) {
    return null
  }

  const [bestMatch, secondMatch] = exactMatches
  if (bestMatch.score < HIGH_CONFIDENCE_SCORE) {
    return null
  }

  if (secondMatch && secondMatch.score === bestMatch.score && secondMatch.id !== bestMatch.id) {
    return null
  }

  return bestMatch
}

export async function resolveMusicBrainzProducerCandidates(producerName) {
  const trimmedProducer = producerName.trim()

  if (!trimmedProducer) {
    throw new Error('Producer name is required')
  }

  const params = new URLSearchParams({
    query: `artist:"${trimmedProducer}" OR alias:"${trimmedProducer}"`,
    limit: String(MAX_CANDIDATES),
    inc: 'aliases',
    fmt: 'json'
  })
  const data = await fetchMusicBrainzJson('/artist', Object.fromEntries(params))
  const rawArtists = Array.isArray(data?.artists) ? data.artists : []
  const candidates = rawArtists
    .map((artist) => mapProducerCandidate(artist, trimmedProducer))
    .filter(isPlausibleCandidate)

  if (candidates.length === 0) {
    return {
      status: 'none',
      selectedCandidate: null,
      candidates: [],
      query: trimmedProducer
    }
  }

  const selectedCandidate = selectAutoCandidate(candidates)
  if (selectedCandidate) {
    return {
      status: 'auto',
      selectedCandidate,
      candidates,
      query: trimmedProducer
    }
  }

  return {
    status: 'select',
    selectedCandidate: null,
    candidates,
    query: trimmedProducer
  }
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

function getReleaseYear(firstReleaseDate) {
  if (!firstReleaseDate) {
    return null
  }

  const releaseYear = firstReleaseDate.slice(0, 4)
  return /^\d{4}$/.test(releaseYear) ? releaseYear : null
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

  return type === 'producer' || PRODUCER_RELATION_TYPE_IDS.has(typeId)
}

function getRelationshipAttributes(relation) {
  const attributes = Array.isArray(relation?.attributes) ? relation.attributes.filter(Boolean) : []
  const attributeValues = relation?.['attribute-values'] && typeof relation['attribute-values'] === 'object'
    ? relation['attribute-values']
    : {}
  const attributeCredits = relation?.['attribute-credits'] && typeof relation['attribute-credits'] === 'object'
    ? relation['attribute-credits']
    : {}

  return attributes.reduce((output, attribute) => {
    const key = String(attribute)
    return {
      ...output,
      [key]: attributeValues[key] ?? attributeCredits[key] ?? true
    }
  }, {})
}

function getEvidenceRoleLabel(relationshipType, relationshipAttributes) {
  const role = String(relationshipType ?? 'producer').toLowerCase()

  if (relationshipAttributes.executive) {
    return 'Executive producer'
  }

  if (relationshipAttributes.co) {
    return 'Co-producer'
  }

  if (relationshipAttributes.assistant) {
    return 'Assistant producer'
  }

  if (relationshipAttributes.associate) {
    return 'Associate producer'
  }

  if (relationshipAttributes.additional) {
    return 'Additional producer'
  }

  return role ? `${role[0].toUpperCase()}${role.slice(1)}` : 'Producer'
}

function mapProducerReleaseResult(relation, releaseData) {
  const releaseGroup = releaseData?.['release-group']
  if (!releaseGroup?.id) {
    return null
  }

  const firstReleaseDate = releaseGroup?.['first-release-date'] ?? null
  const relationshipType = relation?.type ?? 'producer'
  const relationshipAttributes = getRelationshipAttributes(relation)
  const sourceReleaseTitle = releaseData?.title || relation?.release?.title || 'Untitled release'
  const evidenceRoleLabel = getEvidenceRoleLabel(relationshipType, relationshipAttributes)

  return {
    id: releaseGroup.id,
    releaseGroupId: releaseGroup.id,
    title: releaseGroup?.title || sourceReleaseTitle,
    releaseGroupTitle: releaseGroup?.title || sourceReleaseTitle,
    artistCredit: extractArtistCredit(releaseGroup?.['artist-credit']) ||
      extractArtistCredit(releaseData?.['artist-credit']) ||
      'Unknown artist',
    releaseGroupArtistCredit: extractArtistCredit(releaseGroup?.['artist-credit']) ||
      extractArtistCredit(releaseData?.['artist-credit']) ||
      'Unknown artist',
    firstReleaseDate,
    releaseYear: getReleaseYear(firstReleaseDate),
    primaryType: releaseGroup?.['primary-type'] ?? null,
    secondaryTypes: Array.isArray(releaseGroup?.['secondary-types']) ? releaseGroup['secondary-types'] : [],
    producerEvidence: {
      sourceEntityType: 'release',
      sourceReleaseId: releaseData?.id || relation?.release?.id || null,
      sourceReleaseTitle,
      relationshipType,
      relationshipTypeId: getRelationTypeId(relation),
      relationshipAttributes,
      targetCredit: relation?.['target-credit'] || null,
      creditedAs: relation?.['target-credit'] || null,
      evidenceLabel: `${evidenceRoleLabel} on release: ${sourceReleaseTitle}`
    }
  }
}

export async function searchMusicBrainzAlbumsByProducer({
  producerMbid,
  producerName,
  offset = 0,
  limit = DEFAULT_PRODUCER_RELEASE_LOOKUP_LIMIT,
  seenReleaseGroupIds = []
}) {
  if (!producerMbid) {
    throw new Error('MusicBrainz producer artist MBID is required')
  }

  const startedAt = Date.now()
  const metrics = {
    releaseRelationsInspected: 0,
    producerLikeRelationsFound: 0,
    releaseLookupsAttempted: 0,
    duplicateReleaseGroupsSkipped: 0,
    missingReleaseGroupCount: 0,
    elapsedMs: 0,
    requestCount: 0
  }
  const seenReleaseGroups = new Set(seenReleaseGroupIds)
  const artistData = await fetchMusicBrainzJson(`/artist/${producerMbid}`, {
    inc: 'release-rels',
    fmt: 'json'
  }, metrics)
  const releaseRelations = Array.isArray(artistData?.relations)
    ? artistData.relations.filter((relation) => relation?.['target-type'] === 'release')
    : []
  const producerLikeRelations = releaseRelations.filter(isProducerReleaseRelation)
  const producerRelationsBatch = producerLikeRelations.slice(offset, offset + limit)
  const results = []

  metrics.releaseRelationsInspected = releaseRelations.length
  metrics.producerLikeRelationsFound = producerLikeRelations.length

  for (const relation of producerRelationsBatch) {
    metrics.releaseLookupsAttempted += 1

    let releaseData = null
    try {
      releaseData = await fetchMusicBrainzJson(`/release/${relation.release.id}`, {
        inc: 'release-groups+artist-credits',
        fmt: 'json'
      }, metrics)
    } catch {
      metrics.missingReleaseGroupCount += 1
      continue
    }

    const result = mapProducerReleaseResult(relation, releaseData)
    if (!result?.releaseGroupId) {
      metrics.missingReleaseGroupCount += 1
      continue
    }

    if (seenReleaseGroups.has(result.releaseGroupId)) {
      metrics.duplicateReleaseGroupsSkipped += 1
      continue
    }

    seenReleaseGroups.add(result.releaseGroupId)
    results.push(result)
  }

  metrics.elapsedMs = Date.now() - startedAt

  return {
    producerMbid,
    producerName: producerName || artistData?.name || null,
    results,
    metrics,
    nextOffset: offset + producerRelationsBatch.length,
    hasMore: offset + producerRelationsBatch.length < producerLikeRelations.length,
    seenReleaseGroupIds: Array.from(seenReleaseGroups)
  }
}
