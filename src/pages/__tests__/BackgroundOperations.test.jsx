import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AlbumPage from '../AlbumPage'
import { HelpProvider } from '../../contexts/HelpContext'

const mockFetchAlbumData = vi.fn()
const mockFetchAlbumBasicInfo = vi.fn()
const mockSearchReleaseGroups = vi.fn()
const mockSearchByProducer = vi.fn()
const mockFetchCoverArt = vi.fn()
const mockFetchAllAlbumArt = vi.fn()
const mockFetchWikipediaContentFromMusicBrainz = vi.fn()
const mockClearProducerSeenRgIds = vi.fn()

vi.mock('../../services/musicbrainz', () => ({
  fetchAlbumData: (...args) => mockFetchAlbumData(...args),
  fetchAlbumBasicInfo: (...args) => mockFetchAlbumBasicInfo(...args),
  searchReleaseGroups: (...args) => mockSearchReleaseGroups(...args),
  searchByProducer: (...args) => mockSearchByProducer(...args),
  fetchCoverArt: (...args) => mockFetchCoverArt(...args),
  fetchAllAlbumArt: (...args) => mockFetchAllAlbumArt(...args),
  fetchWikipediaContentFromMusicBrainz: (...args) => mockFetchWikipediaContentFromMusicBrainz(...args),
  clearProducerSeenRgIds: (...args) => mockClearProducerSeenRgIds(...args)
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

describe('Background Operations - Error Handling (Fix #2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    window.history.replaceState(
      { page: 'album', albumId: 'test-album-id', fromPage: 'results', searchType: 'album' },
      '',
      '/album/test-album-id'
    )

    mockFetchAlbumBasicInfo.mockResolvedValue({
      basicInfo: {
        albumId: 'test-album-id',
        title: 'Test Album',
        artistName: 'Test Artist',
        releaseYear: 2024,
        coverArtUrl: null
      },
      selectedReleaseId: 'test-release-id',
      releaseGroup: { id: 'test-album-id' },
      releases: []
    })

    mockFetchAlbumData.mockResolvedValue({
      albumId: 'test-album-id',
      title: 'Test Album',
      artistName: 'Test Artist',
      releaseYear: 2024,
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

    mockFetchCoverArt.mockResolvedValue(null)
    mockFetchAllAlbumArt.mockResolvedValue([])
    mockFetchWikipediaContentFromMusicBrainz.mockResolvedValue(null)
  })

  describe('Gallery Error Handling', () => {
    it('displays gallery error indicator and retry button when background art fetch fails', async () => {
      mockFetchAllAlbumArt.mockRejectedValueOnce(new Error('Network error'))

      renderAlbumPage()

      await waitFor(() => {
        expect(mockFetchAllAlbumArt).toHaveBeenCalledWith('test-album-id', expect.any(AbortSignal))
      })

      await waitFor(() => {
        expect(screen.getByText('⚠️')).toBeInTheDocument()
        expect(screen.getByText(/Network error/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
      })
    })

    it.todo('clears gallery error when user navigates to a different album')
    it.todo('shows gallery retry button when gallery load fails')

    it('retries gallery fetch and clears error state after retry succeeds', async () => {
      const user = userEvent.setup()

      mockFetchAllAlbumArt
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([
          {
            id: 'img-1',
            image: 'https://example.com/full.jpg',
            thumbnails: {
              '500': 'https://example.com/thumb-500.jpg'
            },
            front: true,
            back: false,
            types: ['Front'],
            approved: true
          }
        ])

      renderAlbumPage()

      const retryButton = await screen.findByRole('button', { name: /Retry/i })
      await user.click(retryButton)

      await waitFor(() => {
        expect(mockFetchAllAlbumArt).toHaveBeenCalledTimes(2)
        expect(screen.queryByText(/Network error/i)).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /Retry/i })).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: /View all album art \(1 image\)/i })).toBeInTheDocument()
      })
    })
  })

  describe('Wikipedia Error Handling', () => {
    it('displays Wikipedia error indicator and retry button when summary fetch fails', async () => {
      mockFetchWikipediaContentFromMusicBrainz
        .mockRejectedValueOnce(new Error('Wikipedia network error'))
        .mockRejectedValueOnce(new Error('Wikipedia network error'))

      renderAlbumPage()

      await waitFor(() => {
        expect(mockFetchWikipediaContentFromMusicBrainz).toHaveBeenCalledWith('test-album-id', expect.any(AbortSignal))
      })

      await waitFor(() => {
        expect(screen.getByText(/Wikipedia network error/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
      })
    })

    it.todo('clears Wikipedia error when user navigates to a different album')
    it.todo('shows Wikipedia retry button when summary load fails')

    it('retries Wikipedia fetch and clears error state after retry succeeds', async () => {
      const user = userEvent.setup()

      mockFetchWikipediaContentFromMusicBrainz
        .mockRejectedValueOnce(new Error('Wikipedia network error'))
        .mockRejectedValueOnce(new Error('Wikipedia network error'))
        .mockResolvedValueOnce({
          extract: 'Recovered Wikipedia summary text.',
          title: 'Test Album',
          url: 'https://en.wikipedia.org/wiki/Test_Album'
        })

      renderAlbumPage()

      const retryButton = await screen.findByRole('button', { name: /Retry/i })
      const wikipediaCallsBeforeRetry = mockFetchWikipediaContentFromMusicBrainz.mock.calls.length
      await user.click(retryButton)

      await waitFor(() => {
        expect(mockFetchWikipediaContentFromMusicBrainz.mock.calls.length).toBeGreaterThan(wikipediaCallsBeforeRetry)
        expect(screen.queryByText(/Wikipedia network error/i)).not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /Retry/i })).not.toBeInTheDocument()
        expect(screen.getByText(/Recovered Wikipedia summary text\./i)).toBeInTheDocument()
      })
    })
  })

  describe('Race Condition Prevention', () => {
    it.todo('cancels previous gallery request when album selection changes quickly')
    it.todo('cancels previous Wikipedia request when album selection changes quickly')
    it.todo('does not surface error UI for intentionally aborted background requests')
  })

  describe('Timeout Handling', () => {
    it.todo('handles background fetch timeout errors gracefully without breaking album page')
    it.todo('shows timeout-specific user message for failed background operations')
  })
})
