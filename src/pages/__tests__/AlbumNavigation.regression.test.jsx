import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AlbumPage from '../AlbumPage'
import { HelpProvider } from '../../contexts/HelpContext'

const mockSearchReleaseGroups = vi.fn()
const mockFetchAlbumBasicInfo = vi.fn()
const mockFetchAlbumData = vi.fn()
const mockFetchCoverArt = vi.fn()
const mockFetchAllAlbumArt = vi.fn()
const mockFetchWikipediaContentFromMusicBrainz = vi.fn()

vi.mock('../../services/musicbrainz', () => ({
  searchReleaseGroups: (...args) => mockSearchReleaseGroups(...args),
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

describe('Album Navigation Regression', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/')

    mockFetchCoverArt.mockResolvedValue(null)
    mockFetchAllAlbumArt.mockResolvedValue([])
    mockFetchWikipediaContentFromMusicBrainz.mockResolvedValue(null)
  })

  it('restores results after navigating to album detail and receiving popstate for results', async () => {
    const user = userEvent.setup()

    mockSearchReleaseGroups.mockResolvedValueOnce({
      results: [
        {
          releaseGroupId: 'rg-nav-1',
          title: 'Navigation Album One',
          artistName: 'Navigation Artist',
          releaseYear: 2001,
          isBootleg: false
        },
        {
          releaseGroupId: 'rg-nav-2',
          title: 'Navigation Album Two',
          artistName: 'Navigation Artist',
          releaseYear: 2003,
          isBootleg: false
        }
      ],
      totalCount: 2,
      isArtistOnly: true
    })

    mockFetchAlbumBasicInfo.mockResolvedValueOnce({
      basicInfo: {
        albumId: 'rg-nav-1',
        title: 'Navigation Album One',
        artistName: 'Navigation Artist',
        releaseYear: 2001,
        coverArtUrl: null
      },
      selectedReleaseId: 'release-nav-1',
      releaseGroup: { id: 'rg-nav-1' },
      releases: []
    })

    mockFetchAlbumData.mockResolvedValueOnce({
      albumId: 'rg-nav-1',
      title: 'Navigation Album One',
      artistName: 'Navigation Artist',
      releaseYear: 2001,
      albumType: 'album',
      coverArtUrl: null,
      editions: [],
      tracks: [],
      credits: { albumCredits: null, trackCredits: null },
      recordingInfo: null,
      externalLinks: null,
      sources: [],
      dataNotes: null
    })

    renderAlbumPage()

    await user.type(screen.getByLabelText(/Artist Name/i), 'Navigation Artist')
    await user.click(screen.getByRole('button', { name: /^Search$/ }))

    await waitFor(() => {
      expect(screen.getByText('Studio Albums Found')).toBeInTheDocument()
      expect(screen.getByText('Navigation Album One')).toBeInTheDocument()
      expect(screen.getByText('Navigation Album Two')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Navigation Album One/i }))

    await waitFor(() => {
      expect(screen.getByText('← Back')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Credits' })).toBeInTheDocument()
    })

    window.history.replaceState(
      { page: 'results', searchType: 'album', pageNumber: 1 },
      '',
      '/results?type=album&artist=Navigation%2520Artist'
    )

    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate', {
        state: {
          page: 'results',
          searchType: 'album',
          pageNumber: 1
        }
      }))
    })

    await waitFor(() => {
      expect(screen.getByText('Studio Albums Found')).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Credits' })).not.toBeInTheDocument()
    })
  })
})
