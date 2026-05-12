export type FetchStatus = 'idle' | 'loading' | 'success' | 'error' | 'unavailable'

export interface AlbumSummary {
  albumId: string
  title: string
  artistName: string
  releaseYear: number | null
  coverArtUrl: string | null
  isBootleg?: boolean
}

export interface ContributorRef {
  personName: string
  role: string
  instrument?: string | null
  notes?: string | null
  trackCount?: number
}

export interface TrackCreditGroup {
  category: string
  contributors: ContributorRef[]
}

export interface TrackDetail {
  trackId: string
  position: string
  title: string
  durationMs: number | null
  creditGroups?: TrackCreditGroup[]
}

export interface EditionInfo {
  editionId: string
  status?: string | null
  country?: string | null
  date?: string | null
  label?: string | null
  catalogNumber?: string | null
  barcode?: string | null
  formatSummary?: string | null
  packaging?: string | null
}

export interface ExternalSourceAttribution {
  sourceName: 'MusicBrainz' | 'Wikidata' | 'Discogs' | 'Cover Art Archive'
  license: string
  retrievedAt: string
}

export interface AlbumDetail {
  albumId: string
  title: string
  artistName: string
  releaseYear: number | null
  albumType: 'album'
  coverArtUrl: string | null
  tracks: TrackDetail[]
  editions: EditionInfo[]
  albumCredits?: ContributorRef[] | null
  trackCredits?: Record<string, ContributorRef[]> | null
  externalLinks: {
    musicbrainzReleaseGroupUrl: string
    musicbrainzSelectedReleaseUrl: string
    wikidataUrl?: string | null
    discogsUrl?: string | null
  }
  sources: ExternalSourceAttribution[]
  dataNotes?: string | null
}
