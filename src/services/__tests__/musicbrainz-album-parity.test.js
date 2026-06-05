import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchCoverArt,
  fetchAlbumData,
  searchReleaseGroups,
  sortReleasesForSelectedRelease
} from '../musicbrainz'

const mockFetch = vi.fn()
let nowBase = 100000

function jsonResponse(data, options = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
    headers: {
      get: () => options.contentType ?? 'application/json'
    },
    json: async () => data
  }
}

function requestedQuery(callIndex) {
  const url = new URL(mockFetch.mock.calls[callIndex][0])
  return url.searchParams.get('query')
}

describe('MusicBrainz album parity helpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockFetch.mockReset()
    global.fetch = mockFetch
    
    nowBase += 100000
    let now = nowBase
    vi.spyOn(Date, 'now').mockImplementation(() => {
      now += 2000
      return now
    })
    
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    })
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: 'Mozilla/5.0'
    })
  })
  
  it('resolves a confident artist match and searches release groups with arid', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({
        artists: [
          {
            id: 'artist-1',
            name: 'Prince',
            'sort-name': 'Prince',
            score: 100,
            aliases: [{ name: 'The Artist Formerly Known as Prince' }]
          }
        ]
      }))
      .mockResolvedValueOnce(jsonResponse({
        count: 1,
        'release-groups': [
          {
            id: 'rg-1',
            title: 'Purple Rain',
            'primary-type': 'Album',
            'first-release-date': '1984-06-25',
            'artist-credit': [{ name: 'Prince' }],
            releases: [{ id: 'release-1', status: 'Official' }]
          }
        ]
      }))
    
    const result = await searchReleaseGroups('Prince', null, 'Album')
    
    expect(requestedQuery(0)).toBe('artist:"Prince" OR alias:"Prince"')
    expect(requestedQuery(1)).toContain('arid:artist-1')
    expect(requestedQuery(1)).not.toContain('artist:"Prince"')
    expect(result.results).toHaveLength(1)
    expect(result.results[0]).toMatchObject({
      releaseGroupId: 'rg-1',
      title: 'Purple Rain',
      isBootleg: false
    })
  })
  
  it('falls back to text search for ambiguous tied artist matches', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({
        artists: [
          { id: 'artist-1', name: 'Phoenix', score: 100 },
          { id: 'artist-2', name: 'Phoenix', score: 100 }
        ]
      }))
      .mockResolvedValueOnce(jsonResponse({
        count: 0,
        'release-groups': []
      }))
    
    await searchReleaseGroups('Phoenix', null, 'Album')
    
    expect(requestedQuery(1)).toContain('artist:"Phoenix"')
    expect(requestedQuery(1)).not.toContain('arid:')
  })
  
  it('filters artist-only studio album results like iOS', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ artists: [] }))
      .mockResolvedValueOnce(jsonResponse({
        count: 5,
        'release-groups': [
          {
            id: 'official-studio',
            title: 'Official Studio',
            'primary-type': 'Album',
            'first-release-date': '2000-01-01',
            'artist-credit': [{ name: 'Artist' }],
            releases: [{ id: 'official-release', status: 'Official' }]
          },
          {
            id: 'demo-album',
            title: 'Demo Album',
            'primary-type': 'Album',
            'secondary-types': ['Demo'],
            'artist-credit': [{ name: 'Artist' }],
            releases: [{ id: 'demo-release', status: 'Official' }]
          },
          {
            id: 'bootleg-text',
            title: 'Bootleg Text',
            'primary-type': 'Album',
            'artist-credit': [{ name: 'Artist' }],
            releases: [{ id: 'bootleg-release', status: 'Bootleg' }]
          },
          {
            id: 'bootleg-status-id',
            title: 'Bootleg Status ID',
            'primary-type': 'Album',
            'artist-credit': [{ name: 'Artist' }],
            releases: [{ id: 'bootleg-id-release', 'status-id': '1156806e-d06a-38bd-83f0-cf2284a808b9' }]
          },
          {
            id: 'promotion-only',
            title: 'Promotion Only',
            'primary-type': 'Album',
            'artist-credit': [{ name: 'Artist' }],
            releases: [{ id: 'promo-release', status: 'Promotion' }]
          }
        ]
      }))
    
    const result = await searchReleaseGroups('Artist', null, 'Album')
    
    expect(result.results.map(album => album.releaseGroupId)).toEqual(['official-studio'])
    expect(result.totalCount).toBe(5)
  })
  
  it('marks all-bootleg non-album results by status text or status id', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ artists: [] }))
      .mockResolvedValueOnce(jsonResponse({
        count: 2,
        'release-groups': [
          {
            id: 'bootleg-text',
            title: 'Bootleg Text',
            'artist-credit': [{ name: 'Artist' }],
            releases: [{ id: 'bootleg-release', status: 'Bootleg' }]
          },
          {
            id: 'bootleg-status-id',
            title: 'Bootleg Status ID',
            'artist-credit': [{ name: 'Artist' }],
            releases: [{ id: 'bootleg-id-release', 'status-id': '1156806e-d06a-38bd-83f0-cf2284a808b9' }]
          }
        ]
      }))
    
    const result = await searchReleaseGroups('Artist', null, 'EP')
    
    expect(result.results).toEqual([
      expect.objectContaining({ releaseGroupId: 'bootleg-status-id', isBootleg: true }),
      expect.objectContaining({ releaseGroupId: 'bootleg-text', isBootleg: true })
    ])
  })
  
  it.each([
    ['exact full-date AU/US official tie prefers US', [
      { id: 'au-full-date', status: 'Official', date: '1991-09-24', country: 'AU' },
      { id: 'us-full-date', status: 'Official', date: '1991-09-24', country: 'US' }
    ], 'us-full-date'],
    ['earlier official non-US release beats later US release', [
      { id: 'gb-original', status: 'Official', date: '1971-12-03', country: 'GB' },
      { id: 'us-later', status: 'Official', date: '1972-03', country: 'US' }
    ], 'gb-original'],
    ['official beats earlier non-official release', [
      { id: 'bootleg-earlier', status: 'Bootleg', date: '1970-01-01', country: 'US' },
      { id: 'official-later', status: 'Official', date: '1971-01-01', country: 'GB' }
    ], 'official-later'],
    ['full date beats year-only within the same year', [
      { id: 'year-only', status: 'Official', date: '1991', country: 'US' },
      { id: 'full-date', status: 'Official', date: '1991-09-24', country: 'AU' }
    ], 'full-date'],
    ['month-only GB/US tie preserves original order', [
      { id: 'gb-month', status: 'Official', date: '1980-09', country: 'GB' },
      { id: 'us-month', status: 'Official', date: '1980-09', country: 'US' }
    ], 'gb-month']
  ])('sorts selected release: %s', (_fixtureName, releases, expectedReleaseId) => {
    expect(sortReleasesForSelectedRelease(releases)[0]?.id).toBe(expectedReleaseId)
  })
  
  it('tries selected-release cover art before release-group cover art', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 404, statusText: 'Not Found' }))
      .mockResolvedValueOnce(jsonResponse({
        images: [{ front: true, image: 'http://images.example/rg-front.jpg' }]
      }))
    
    const coverArtUrl = await fetchCoverArt('rg-1', 'release-1')
    
    expect(mockFetch.mock.calls[0][0]).toBe('https://coverartarchive.org/release/release-1')
    expect(mockFetch.mock.calls[1][0]).toBe('https://coverartarchive.org/release-group/rg-1')
    expect(coverArtUrl).toBe('https://images.example/rg-front.jpg')
  })
  
  it('uses specific track relationship attributes for instrument and vocal credits', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({
      id: 'release-1',
      media: [{
        tracks: [{
          number: '1',
          position: 1,
          recording: {
            id: 'recording-1',
            title: 'Radio Free Europe',
            relations: [
              {
                type: 'instrument',
                'target-type': 'artist',
                attributes: ['drums', 'guitar'],
                artist: { name: 'Bill Berry' }
              },
              {
                type: 'vocal',
                'target-type': 'artist',
                attributes: ['lead vocals'],
                artist: { name: 'Michael Stipe' }
              },
              {
                type: 'vocal',
                'target-type': 'artist',
                artist: { name: 'Backing Singer' }
              },
              {
                type: 'producer',
                'target-type': 'artist',
                artist: { name: 'Mitch Easter' }
              },
              {
                type: 'engineer',
                'target-type': 'artist',
                artist: { name: 'Don Dixon' }
              },
              {
                type: 'writer',
                'target-type': 'artist',
                artist: { name: 'Songwriter' }
              },
              {
                type: 'performance',
                'target-type': 'work',
                work: {
                  relations: [
                    {
                      type: 'composer',
                      'target-type': 'artist',
                      artist: { name: 'Bill Berry' }
                    },
                    {
                      type: 'composer',
                      'target-type': 'artist',
                      artist: { name: 'Peter Buck' }
                    },
                    {
                      type: 'composer',
                      'target-type': 'artist',
                      artist: { name: 'Mike Mills' }
                    },
                    {
                      type: 'composer',
                      'target-type': 'artist',
                      artist: { name: 'Michael Stipe' }
                    },
                    {
                      type: 'lyricist',
                      'target-type': 'artist',
                      artist: { name: 'Bill Berry' }
                    },
                    {
                      type: 'lyricist',
                      'target-type': 'artist',
                      artist: { name: 'Peter Buck' }
                    },
                    {
                      type: 'lyricist',
                      'target-type': 'artist',
                      artist: { name: 'Mike Mills' }
                    },
                    {
                      type: 'lyricist',
                      'target-type': 'artist',
                      artist: { name: 'Michael Stipe' }
                    }
                  ]
                }
              }
            ]
          }
        }]
      }]
    }))
    
    const album = await fetchAlbumData('rg-1', {
      releaseGroup: {
        id: 'rg-1',
        title: 'Murmur',
        'artist-credit': [{ name: 'R.E.M.' }],
        'first-release-date': '1983-04-12'
      },
      releases: [{ id: 'release-1', status: 'Official', date: '1983-04-12', country: 'US' }],
      sortedReleases: [{ id: 'release-1', status: 'Official', date: '1983-04-12', country: 'US' }],
      selectedReleaseId: 'release-1',
      basicInfo: {
        albumId: 'rg-1',
        title: 'Murmur',
        artistName: 'R.E.M.',
        releaseYear: 1983,
        coverArtUrl: null
      }
    })
    
    expect(mockFetch.mock.calls[0][0]).toContain('work-rels+work-level-rels')
    expect(album.tracks[0].songwriting).toEqual({
      writers: ['Songwriter'],
      composers: ['Bill Berry', 'Peter Buck', 'Mike Mills', 'Michael Stipe'],
      lyricists: ['Bill Berry', 'Peter Buck', 'Mike Mills', 'Michael Stipe']
    })
    expect(album.credits.trackCredits['recording-1']).toEqual([
      { personName: 'Bill Berry', role: 'drums', instrument: null, notes: null },
      { personName: 'Bill Berry', role: 'guitar', instrument: null, notes: null },
      { personName: 'Michael Stipe', role: 'lead vocals', instrument: null, notes: null },
      { personName: 'Backing Singer', role: 'Vocals', instrument: null, notes: null },
      { personName: 'Mitch Easter', role: 'producer', instrument: null, notes: null },
      { personName: 'Don Dixon', role: 'engineer', instrument: null, notes: null }
    ])
    expect(album.credits.trackCredits['recording-1']).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'instrument' }),
        expect.objectContaining({ role: 'vocal' }),
        expect.objectContaining({ role: 'writer' })
      ])
    )
  })
})
