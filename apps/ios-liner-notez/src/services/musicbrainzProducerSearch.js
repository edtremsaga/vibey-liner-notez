const MUSICBRAINZ_API_BASE = 'https://musicbrainz.org/ws/2'
const MUSICBRAINZ_USER_AGENT = 'liner-notez-ios/0.0.1 (https://github.com/edtremsaga/vibey-liner-notez)'
const HIGH_CONFIDENCE_SCORE = 95
const MIN_PLAUSIBLE_SCORE = 50
const MAX_CANDIDATES = 10
const MAX_ALIASES = 4

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
  const url = `${MUSICBRAINZ_API_BASE}/artist?${params.toString()}`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': MUSICBRAINZ_USER_AGENT
    }
  })

  if (!response.ok) {
    throw new Error(`MusicBrainz producer lookup failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
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
