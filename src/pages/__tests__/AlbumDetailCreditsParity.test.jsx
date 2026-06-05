import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AlbumPage from '../AlbumPage'
import { HelpProvider } from '../../contexts/HelpContext'

const mockFetchAlbumBasicInfo = vi.fn()
const mockFetchAlbumData = vi.fn()
const mockFetchCoverArt = vi.fn()
const mockFetchAllAlbumArt = vi.fn()
const mockFetchWikipediaContentFromMusicBrainz = vi.fn()

vi.mock('../../services/musicbrainz', () => ({
  searchReleaseGroups: vi.fn(),
  searchByProducer: vi.fn(),
  fetchAlbumBasicInfo: (...args) => mockFetchAlbumBasicInfo(...args),
  fetchAlbumData: (...args) => mockFetchAlbumData(...args),
  fetchCoverArt: (...args) => mockFetchCoverArt(...args),
  fetchAllAlbumArt: (...args) => mockFetchAllAlbumArt(...args),
  fetchWikipediaContentFromMusicBrainz: (...args) => mockFetchWikipediaContentFromMusicBrainz(...args),
  clearProducerSeenRgIds: vi.fn()
}))

vi.mock('../../utils/albumCache', () => ({
  getCachedAlbum: vi.fn(() => null),
  setCachedAlbum: vi.fn()
}))

function renderAlbumPage() {
  return render(
    <HelpProvider>
      <AlbumPage />
    </HelpProvider>
  )
}

describe('Album detail credits parity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState(
      { page: 'album', albumId: 'murmur-rg', fromPage: 'results', searchType: 'album' },
      '',
      '/album/murmur-rg'
    )

    mockFetchAlbumBasicInfo.mockResolvedValue({
      basicInfo: {
        albumId: 'murmur-rg',
        title: 'Murmur',
        artistName: 'R.E.M.',
        releaseYear: 1983,
        coverArtUrl: null
      },
      selectedReleaseId: 'murmur-release',
      releaseGroup: { id: 'murmur-rg' },
      releases: []
    })
    mockFetchCoverArt.mockResolvedValue(null)
    mockFetchAllAlbumArt.mockResolvedValue([])
    mockFetchWikipediaContentFromMusicBrainz.mockResolvedValue(null)
  })

  it('shows Radio Free Europe track details and grouped release credits', async () => {
    const user = userEvent.setup()

    mockFetchAlbumData.mockResolvedValue({
      albumId: 'murmur-rg',
      title: 'Murmur',
      artistName: 'R.E.M.',
      releaseYear: 1983,
      albumType: 'album',
      coverArtUrl: null,
      editions: [
        {
          editionId: 'murmur-release',
          date: '1983-04-12',
          country: 'US',
          status: 'Official',
          formatSummary: '12" Vinyl',
          packaging: null,
          label: 'I.R.S. Records',
          catalogNumber: 'SP 70604',
          barcode: '123456789'
        },
        {
          editionId: 'murmur-uk-release',
          date: '1983',
          country: 'GB',
          status: 'Official',
          formatSummary: null,
          packaging: null,
          label: null,
          catalogNumber: null,
          barcode: null
        }
      ],
      tracks: [
        {
          trackId: 'radio-free-europe',
          position: '1',
          title: 'Radio Free Europe',
          durationMs: 245000,
          songwriting: {
            writers: null,
            composers: ['Bill Berry', 'Peter Buck', 'Mike Mills', 'Michael Stipe'],
            lyricists: ['Bill Berry', 'Peter Buck', 'Mike Mills', 'Michael Stipe']
          },
          publishing: null
        }
      ],
      credits: {
        albumCredits: [
          { personName: 'Don Dixon', role: 'engineer', instrument: null, notes: null },
          { personName: 'Mitch Easter', role: 'engineer', instrument: null, notes: null },
          { personName: 'Mitch Easter', role: 'mix', instrument: null, notes: null },
          { personName: 'Don Dixon', role: 'producer', instrument: null, notes: null },
          { personName: 'Mitch Easter', role: 'producer', instrument: null, notes: null },
          { personName: 'Bill Berry', role: 'bass', instrument: null, notes: null },
          { personName: 'Bill Berry', role: 'drums (drum set)', instrument: null, notes: null },
          { personName: 'Bill Berry', role: 'piano', instrument: null, notes: null },
          { personName: 'Peter Buck', role: 'guitar', instrument: null, notes: null },
          { personName: 'Mike Mills', role: 'acoustic guitar', instrument: null, notes: null },
          { personName: 'Mike Mills', role: 'bass', instrument: null, notes: null },
          { personName: 'Mike Mills', role: 'piano', instrument: null, notes: null },
          { personName: 'Bill Berry', role: 'Vocals', instrument: null, notes: null },
          { personName: 'Mike Mills', role: 'Vocals', instrument: null, notes: null },
          { personName: 'Michael Stipe', role: 'Vocals', instrument: null, notes: null },
          { personName: 'Bill Berry', role: 'percussion', instrument: null, notes: null },
          { personName: 'Mike Mills', role: 'organ', instrument: null, notes: null }
        ],
        trackCredits: {
          'radio-free-europe': [
            { personName: 'R.E.M.', role: 'Performer', instrument: null, notes: null },
            { personName: 'Bill Berry', role: 'drums (drum set)', instrument: null, notes: null },
            { personName: 'Peter Buck', role: 'guitar', instrument: null, notes: null },
            { personName: 'Mike Mills', role: 'bass', instrument: null, notes: null },
            { personName: 'Michael Stipe', role: 'vocal', instrument: null, notes: null },
            { personName: 'Don Dixon', role: 'engineer', instrument: null, notes: null },
            { personName: 'Mitch Easter', role: 'engineer', instrument: null, notes: null },
            { personName: 'Mitch Easter', role: 'mix', instrument: null, notes: null },
            { personName: 'Don Dixon', role: 'producer', instrument: null, notes: null },
            { personName: 'Mitch Easter', role: 'producer', instrument: null, notes: null },
            { personName: 'R.E.M.', role: 'producer', instrument: null, notes: null }
          ]
        }
      },
      recordingInfo: null,
      externalLinks: null,
      sources: [
        { sourceName: 'MusicBrainz', license: 'CC0', retrievedAt: '2026-06-05T00:00:00.000Z' },
        { sourceName: 'Cover Art Archive', license: 'CC0', retrievedAt: '2026-06-05T00:00:00.000Z' }
      ],
      dataNotes: null
    })

    renderAlbumPage()

    expect(await screen.findByRole('heading', { name: 'Release Credits' })).toBeInTheDocument()
    const tracksHeading = screen.getByRole('heading', { name: 'Tracks' })
    const releaseCreditsHeading = screen.getByRole('heading', { name: 'Release Credits' })
    expect(tracksHeading.compareDocumentPosition(releaseCreditsHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    const releaseCreditsButton = screen.getByRole('button', { name: /^Release Credits$/i })
    expect(releaseCreditsButton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Credit Details')).not.toBeInTheDocument()
    expect(screen.queryByText('Credit Highlights')).not.toBeInTheDocument()
    expect(screen.queryByText('Additional Credits')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Album$/i })).not.toBeInTheDocument()

    const releaseCreditsSection = screen.getByRole('heading', { name: 'Release Credits' }).closest('section')
    expect(within(releaseCreditsSection).queryByText('Don Dixon')).not.toBeInTheDocument()

    await user.click(releaseCreditsButton)

    expect(releaseCreditsButton).toHaveAttribute('aria-expanded', 'true')
    expect(within(releaseCreditsSection).queryByText('Credit Highlights')).not.toBeInTheDocument()
    expect(within(releaseCreditsSection).queryByText('Producers')).not.toBeInTheDocument()
    expect(screen.getAllByText('Production & Technical').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Performers & Instruments').length).toBeGreaterThan(0)
    expect(screen.getByText('Additional Credits')).toBeInTheDocument()
    expect(within(releaseCreditsSection).getAllByText('Don Dixon').length).toBeGreaterThan(0)
    expect(within(releaseCreditsSection).getAllByText('engineer').length).toBeGreaterThan(0)
    expect(within(releaseCreditsSection).getAllByText('percussion').length).toBeGreaterThan(0)
    expect(within(releaseCreditsSection).getAllByText('organ').length).toBeGreaterThan(0)

    const editionsSourcesButton = screen.getByRole('button', { name: /Editions & Sources/i })
    expect(editionsSourcesButton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('heading', { name: /^Editions$/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Selected Edition')).not.toBeInTheDocument()
    expect(screen.getByText('Selected edition and sources')).toBeInTheDocument()

    const editionsSourcesHeading = screen.getByRole('heading', { name: /Editions & Sources/i })
    expect(releaseCreditsHeading.compareDocumentPosition(editionsSourcesHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    await user.click(editionsSourcesButton)

    expect(editionsSourcesButton).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Selected Edition')).toBeInTheDocument()
    expect(screen.getByText('1983-04-12 · US · Official')).toBeInTheDocument()
    expect(screen.getByText('12" Vinyl · I.R.S. Records · SP 70604')).toBeInTheDocument()
    expect(screen.getByText('Release-group editions')).toBeInTheDocument()
    expect(screen.queryByText('1983 - GB - Official')).not.toBeInTheDocument()
    expect(screen.getByText('Sources')).toBeInTheDocument()
    expect(screen.getByText('MusicBrainz')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Release-group editions$/i }))

    expect(screen.getByText('1983 - GB - Official')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Radio Free Europe/i }))

    expect(screen.getAllByText('Songwriting').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Composer', { selector: '.credit-role' }).length).toBeGreaterThanOrEqual(4)
    expect(screen.getAllByText('Lyricist', { selector: '.credit-role' }).length).toBeGreaterThanOrEqual(4)
    expect(screen.getAllByText('drums (drum set)').length).toBeGreaterThan(0)
    expect(screen.getAllByText('guitar').length).toBeGreaterThan(0)
    expect(screen.getAllByText('bass').length).toBeGreaterThan(0)
    expect(screen.getAllByText('vocal').length).toBeGreaterThan(0)
    expect(screen.getAllByText('producer').length).toBeGreaterThan(0)
  })

  it('expands a track with songwriting even when track credits are missing', async () => {
    const user = userEvent.setup()

    mockFetchAlbumData.mockResolvedValue({
      albumId: 'murmur-rg',
      title: 'Murmur',
      artistName: 'R.E.M.',
      releaseYear: 1983,
      albumType: 'album',
      coverArtUrl: null,
      editions: [],
      tracks: [
        {
          trackId: 'radio-free-europe',
          position: '1',
          title: 'Radio Free Europe',
          durationMs: 245000,
          songwriting: {
            writers: null,
            composers: ['Bill Berry', 'Peter Buck', 'Mike Mills', 'Michael Stipe'],
            lyricists: ['Bill Berry', 'Peter Buck', 'Mike Mills', 'Michael Stipe']
          },
          publishing: null
        }
      ],
      credits: {
        albumCredits: null,
        trackCredits: null
      },
      recordingInfo: null,
      externalLinks: null,
      sources: [],
      dataNotes: null
    })

    renderAlbumPage()

    await user.click(await screen.findByRole('button', { name: /Radio Free Europe/i }))

    expect(screen.getAllByText('Songwriting').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Composer', { selector: '.credit-role' }).length).toBe(4)
    expect(screen.getAllByText('Lyricist', { selector: '.credit-role' }).length).toBe(4)
    expect(screen.getAllByText('Bill Berry').length).toBe(2)
    expect(screen.getAllByText('Michael Stipe').length).toBe(2)
  })
})
