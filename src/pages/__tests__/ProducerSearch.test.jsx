import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AlbumPage from '../AlbumPage'
import { HelpProvider } from '../../contexts/HelpContext'

// Mock the services
const mockSearchByProducer = vi.fn()
const mockSearchReleaseGroups = vi.fn()
const mockFetchAlbumData = vi.fn()
const mockFetchAlbumBasicInfo = vi.fn()
const mockFetchCoverArt = vi.fn()
const mockFetchAllAlbumArt = vi.fn()
const mockFetchWikipediaContentFromMusicBrainz = vi.fn()

vi.mock('../../services/musicbrainz', () => ({
  searchByProducer: (...args) => mockSearchByProducer(...args),
  searchReleaseGroups: (...args) => mockSearchReleaseGroups(...args),
  fetchAlbumData: (...args) => mockFetchAlbumData(...args),
  fetchAlbumBasicInfo: (...args) => mockFetchAlbumBasicInfo(...args),
  fetchCoverArt: (...args) => mockFetchCoverArt(...args),
  fetchAllAlbumArt: (...args) => mockFetchAllAlbumArt(...args),
  fetchWikipediaContentFromMusicBrainz: (...args) => mockFetchWikipediaContentFromMusicBrainz(...args)
}))

// Mock cache utilities
vi.mock('../../utils/albumCache', () => ({
  getCachedAlbum: vi.fn(() => null),
  setCachedAlbum: vi.fn()
}))

// Mock formatDuration
vi.mock('../../utils/formatDuration', () => ({
  formatDuration: vi.fn((ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`)
}))

// Helper to render AlbumPage with HelpProvider
const renderAlbumPage = () => {
  return render(
    <HelpProvider>
      <AlbumPage />
    </HelpProvider>
  )
}

describe('Producer Search Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset URL params
    window.history.replaceState({}, '', '/')
    // Reset window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    })
  })

  describe('Tab Navigation', () => {
    it('should render tab navigation with both search types', () => {
      renderAlbumPage()
      
      expect(screen.getByText('Search Albums')).toBeInTheDocument()
      expect(screen.getByText('Search by Producer')).toBeInTheDocument()
    })

    it('should show album search form by default', () => {
      renderAlbumPage()
      
      expect(screen.getByLabelText(/Artist Name/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/Producer Name/i)).not.toBeInTheDocument()
    })

    it('should switch to producer search when producer tab is clicked', async () => {
      const user = userEvent.setup()
      renderAlbumPage()
      
      const producerTab = screen.getByText('Search by Producer')
      await user.click(producerTab)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Producer Name/i)).toBeInTheDocument()
        expect(screen.queryByLabelText(/Artist Name/i)).not.toBeInTheDocument()
      })
    })

    it('should switch back to album search when album tab is clicked', async () => {
      const user = userEvent.setup()
      renderAlbumPage()
      
      // Switch to producer search first
      const producerTab = screen.getByText('Search by Producer')
      await user.click(producerTab)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Producer Name/i)).toBeInTheDocument()
      })
      
      // Switch back to album search
      const albumTab = screen.getByText('Search Albums')
      await user.click(albumTab)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Artist Name/i)).toBeInTheDocument()
        expect(screen.queryByLabelText(/Producer Name/i)).not.toBeInTheDocument()
      })
    })

    it('should preserve form inputs when switching tabs', async () => {
      const user = userEvent.setup()
      renderAlbumPage()
      
      // Enter artist name
      const artistInput = screen.getByRole('textbox', { name: /Artist Name/i })
      await user.type(artistInput, 'David Bowie')
      
      // Switch to producer search
      const producerTab = screen.getByText('Search by Producer')
      await user.click(producerTab)
      
      // Enter producer name
      await waitFor(() => {
        const producerInput = screen.getByRole('textbox', { name: /Producer Name/i })
        expect(producerInput).toBeInTheDocument()
      })
      const producerInput = screen.getByRole('textbox', { name: /Producer Name/i })
      await user.type(producerInput, 'Tony Visconti')
      
      // Switch back to album search - artist name should still be there
      const albumTab = screen.getByText('Search Albums')
      await user.click(albumTab)
      
      await waitFor(() => {
        const artistInputAfter = screen.getByRole('textbox', { name: /Artist Name/i })
        expect(artistInputAfter).toHaveValue('David Bowie')
      })
    })
  })

  describe('Producer Search Form', () => {
    it('should render producer search form when producer tab is active', async () => {
      const user = userEvent.setup()
      renderAlbumPage()
      
      const producerTab = screen.getByText('Search by Producer')
      await user.click(producerTab)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Producer Name/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /^Search$/ })).toBeInTheDocument()
      })
    })

    it('should allow typing in producer name field', async () => {
      const user = userEvent.setup()
      renderAlbumPage()
      
      const producerTab = screen.getByText('Search by Producer')
      await user.click(producerTab)
      
      await waitFor(() => {
        const producerInput = screen.getByLabelText(/Producer Name/i)
        expect(producerInput).toBeInTheDocument()
      })
      
      const producerInput = screen.getByLabelText(/Producer Name/i)
      await user.type(producerInput, 'Quincy Jones')
      
      expect(producerInput).toHaveValue('Quincy Jones')
    })

    it('should require producer name to submit', async () => {
      const user = userEvent.setup()
      renderAlbumPage()
      
      const producerTab = screen.getByText('Search by Producer')
      await user.click(producerTab)
      
      await waitFor(() => {
        const producerInput = screen.getByLabelText(/Producer Name/i)
        expect(producerInput).toBeInTheDocument()
      })
      
      // Form validation should prevent submission when producer name is empty
      const searchButton = screen.getByRole('button', { name: /^Search$/ })
      expect(searchButton).toBeInTheDocument()
      
      // The form should have HTML5 validation, so clicking submit with empty required field
      // should trigger browser validation. In a test environment, we can check the form validity
      const form = searchButton.closest('form')
      expect(form).toBeTruthy()
      
      // HTML5 validation will prevent submit if field is required and empty
      // We can't easily test this without mocking form submission, but we can verify
      // the input is required
      const producerInput = screen.getByLabelText(/Producer Name/i)
      expect(producerInput).toHaveAttribute('required')
    })
  })

  describe('Producer Search Execution', () => {
    const mockProducerSearchResults = {
      results: [
        {
          releaseGroupId: 'rg-1',
          title: 'Thriller',
          artistName: 'Michael Jackson',
          releaseYear: 1982,
          isBootleg: false
        },
        {
          releaseGroupId: 'rg-2',
          title: 'Off the Wall',
          artistName: 'Michael Jackson',
          releaseYear: 1979,
          isBootleg: false
        }
      ],
      totalCount: 2,
      isProducerSearch: true,
      producerName: 'Quincy Jones',
      producerMBID: 'producer-mbid-1'
    }

    it('should execute producer search on form submit', async () => {
      const user = userEvent.setup()
      mockSearchByProducer.mockResolvedValueOnce(mockProducerSearchResults)
      
      renderAlbumPage()
      
      const producerTab = screen.getByText('Search by Producer')
      await user.click(producerTab)
      
      await waitFor(() => {
        const producerInput = screen.getByLabelText(/Producer Name/i)
        expect(producerInput).toBeInTheDocument()
      })
      
      const producerInput = screen.getByLabelText(/Producer Name/i)
      await user.type(producerInput, 'Quincy Jones')
      
      const searchButton = screen.getByRole('button', { name: /^Search$/ })
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(mockSearchByProducer).toHaveBeenCalledWith('Quincy Jones', null, 0, expect.any(Function))
      })
    })

    it('should display producer search results', async () => {
      const user = userEvent.setup()
      mockSearchByProducer.mockResolvedValueOnce(mockProducerSearchResults)
      
      renderAlbumPage()
      
      const producerTab = screen.getByText('Search by Producer')
      await user.click(producerTab)
      
      await waitFor(() => {
        const producerInput = screen.getByLabelText(/Producer Name/i)
        expect(producerInput).toBeInTheDocument()
      })
      
      const producerInput = screen.getByLabelText(/Producer Name/i)
      await user.type(producerInput, 'Quincy Jones')
      
      const searchButton = screen.getByRole('button', { name: /^Search$/ })
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText('Thriller')).toBeInTheDocument()
        expect(screen.getByText('Off the Wall')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should show error when no producer found', async () => {
      const user = userEvent.setup()
      mockSearchByProducer.mockRejectedValueOnce(new Error('No producer found. Try a different name or check spelling.'))
      
      renderAlbumPage()
      
      const producerTab = screen.getByText('Search by Producer')
      await user.click(producerTab)
      
      await waitFor(() => {
        const producerInput = screen.getByLabelText(/Producer Name/i)
        expect(producerInput).toBeInTheDocument()
      })
      
      const producerInput = screen.getByLabelText(/Producer Name/i)
      await user.type(producerInput, 'Nonexistent Producer')
      
      const searchButton = screen.getByRole('button', { name: /^Search$/ })
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText(/No producer found/i)).toBeInTheDocument()
      })
    })

    it('should show error when producer found but no albums', async () => {
      const user = userEvent.setup()
      mockSearchByProducer.mockRejectedValueOnce(
        new Error('No albums found for this producer. The producer exists but no production credits are documented.')
      )
      
      renderAlbumPage()
      
      const producerTab = screen.getByText('Search by Producer')
      await user.click(producerTab)
      
      await waitFor(() => {
        const producerInput = screen.getByLabelText(/Producer Name/i)
        expect(producerInput).toBeInTheDocument()
      })
      
      const producerInput = screen.getByLabelText(/Producer Name/i)
      await user.type(producerInput, 'Producer With No Albums')
      
      const searchButton = screen.getByRole('button', { name: /^Search$/ })
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText(/No albums found for this producer/i)).toBeInTheDocument()
      })
    })
  })

  describe('Multiple Producer Matches', () => {
    const mockMultipleMatches = {
      multipleMatches: true,
      matches: [
        {
          mbid: 'producer-mbid-1',
          name: 'Quincy Jones',
          disambiguation: 'US producer',
          type: 'Person'
        },
        {
          mbid: 'producer-mbid-2',
          name: 'Quincy Jones',
          disambiguation: 'UK producer',
          type: 'Person'
        }
      ],
      results: [],
      totalCount: 0
    }

    const mockSelectedProducerResults = {
      results: [
        {
          releaseGroupId: 'rg-1',
          title: 'Thriller',
          artistName: 'Michael Jackson',
          releaseYear: 1982,
          isBootleg: false
        }
      ],
      totalCount: 1,
      isProducerSearch: true,
      producerName: 'Quincy Jones',
      producerMBID: 'producer-mbid-1'
    }

    it('should display multiple producer matches when found', async () => {
      const user = userEvent.setup()
      mockSearchByProducer.mockResolvedValueOnce(mockMultipleMatches)
      
      renderAlbumPage()
      
      const producerTab = screen.getByText('Search by Producer')
      await user.click(producerTab)
      
      await waitFor(() => {
        const producerInput = screen.getByLabelText(/Producer Name/i)
        expect(producerInput).toBeInTheDocument()
      })
      
      const producerInput = screen.getByLabelText(/Producer Name/i)
      await user.type(producerInput, 'Quincy Jones')
      
      const searchButton = screen.getByRole('button', { name: /^Search$/ })
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Multiple producers found/i)).toBeInTheDocument()
        expect(screen.getByText(/Quincy Jones \(US producer\)/i)).toBeInTheDocument()
        expect(screen.getByText(/Quincy Jones \(UK producer\)/i)).toBeInTheDocument()
      })
    })

    it('should allow selecting a producer from multiple matches', async () => {
      const user = userEvent.setup()
      mockSearchByProducer
        .mockResolvedValueOnce(mockMultipleMatches)
        .mockResolvedValueOnce(mockSelectedProducerResults)
      
      renderAlbumPage()
      
      const producerTab = screen.getByText('Search by Producer')
      await user.click(producerTab)
      
      await waitFor(() => {
        const producerInput = screen.getByLabelText(/Producer Name/i)
        expect(producerInput).toBeInTheDocument()
      })
      
      const producerInput = screen.getByLabelText(/Producer Name/i)
      await user.type(producerInput, 'Quincy Jones')
      
      const searchButton = screen.getByRole('button', { name: /^Search$/ })
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Multiple producers found/i)).toBeInTheDocument()
      })
      
      // Click on first producer match
      const firstMatch = screen.getByText(/Quincy Jones \(US producer\)/i)
      await user.click(firstMatch)
      
      // Should search with selected producer MBID
      await waitFor(() => {
        expect(mockSearchByProducer).toHaveBeenCalledWith('Quincy Jones', 'producer-mbid-1', 0, expect.any(Function))
      }, { timeout: 2000 })
      
      // Note: With 1 result, the component tries to load it as an album
      // We've verified the search was called correctly - the rest depends on album loading
      // which would require more complex mocking
    })

    it('should disable producer input when multiple matches are shown', async () => {
      const user = userEvent.setup()
      mockSearchByProducer.mockResolvedValueOnce(mockMultipleMatches)
      
      renderAlbumPage()
      
      const producerTab = screen.getByText('Search by Producer')
      await user.click(producerTab)
      
      await waitFor(() => {
        const producerInput = screen.getByLabelText(/Producer Name/i)
        expect(producerInput).toBeInTheDocument()
      })
      
      const producerInput = screen.getByLabelText(/Producer Name/i)
      await user.type(producerInput, 'Quincy Jones')
      
      const searchButton = screen.getByRole('button', { name: /^Search$/ })
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByText(/Multiple producers found/i)).toBeInTheDocument()
        const producerInputAfter = screen.getByRole('textbox', { name: /Producer Name/i })
        expect(producerInputAfter).toBeDisabled()
      })
    })
  })

  describe('URL Query Parameters', () => {
    it('should show producer search form when ?type=producer in URL', () => {
      window.history.replaceState({}, '', '/?type=producer')
      
      renderAlbumPage()
      
      expect(screen.getByLabelText(/Producer Name/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/Artist Name/i)).not.toBeInTheDocument()
    })

    it('should show album search form when ?type=album in URL', () => {
      window.history.replaceState({}, '', '/?type=album')
      
      renderAlbumPage()
      
      expect(screen.getByLabelText(/Artist Name/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/Producer Name/i)).not.toBeInTheDocument()
    })

    it('should update URL when switching tabs', async () => {
      const user = userEvent.setup()
      window.history.replaceState({ page: 'search' }, '', '/')
      renderAlbumPage()
      
      const producerTab = screen.getByText('Search by Producer')
      await user.click(producerTab)
      
      await waitFor(() => {
        expect(window.location.search).toContain('type=producer')
      })
    })

    it('should decode legacy double-encoded artist query params on restore', async () => {
      renderAlbumPage()

      window.history.replaceState(null, '', '/results?type=album&artist=The%2520Rolling%2520Stones&album=Aftermath')
      act(() => {
        window.dispatchEvent(new PopStateEvent('popstate', { state: null }))
      })

      await waitFor(() => {
        const artistInput = screen.getByRole('textbox', { name: /Artist Name/i })
        expect(artistInput).toHaveValue('The Rolling Stones')
      })
    })

    it('should not double-encode artist query params when writing results URL', async () => {
      const user = userEvent.setup()
      mockSearchReleaseGroups.mockResolvedValueOnce({
        results: [
          { releaseGroupId: 'rg-1', title: 'A', artistName: 'The Rolling Stones', releaseYear: 1966, isBootleg: false },
          { releaseGroupId: 'rg-2', title: 'B', artistName: 'The Rolling Stones', releaseYear: 1967, isBootleg: false }
        ],
        totalCount: 2,
        isArtistOnly: true
      })

      window.history.replaceState({ page: 'search' }, '', '/')
      renderAlbumPage()

      const artistInput = screen.getByRole('textbox', { name: /Artist Name/i })
      await user.type(artistInput, 'The Rolling Stones')
      await user.click(screen.getByRole('button', { name: /^Search$/ }))

      await waitFor(() => {
        expect(window.location.pathname).toBe('/results')
      })
      expect(window.location.search).toContain('artist=The+Rolling+Stones')
      expect(window.location.search).not.toContain('%2520')
    })
  })

  describe('Integration with Results Page', () => {
    const mockProducerSearchResults = {
      results: [
        {
          releaseGroupId: 'rg-1',
          title: 'Thriller',
          artistName: 'Michael Jackson',
          releaseYear: 1982,
          isBootleg: false
        },
        {
          releaseGroupId: 'rg-2',
          title: 'Off the Wall',
          artistName: 'Michael Jackson',
          releaseYear: 1979,
          isBootleg: false
        }
      ],
      totalCount: 2,
      isProducerSearch: true,
      producerName: 'Quincy Jones',
      producerMBID: 'producer-mbid-1'
    }

    it('should use same results display format for producer search', async () => {
      const user = userEvent.setup()
      mockSearchByProducer.mockResolvedValueOnce(mockProducerSearchResults)
      
      renderAlbumPage()
      
      const producerTab = screen.getByText('Search by Producer')
      await user.click(producerTab)
      
      await waitFor(() => {
        const producerInput = screen.getByLabelText(/Producer Name/i)
        expect(producerInput).toBeInTheDocument()
      })
      
      const producerInput = screen.getByLabelText(/Producer Name/i)
      await user.type(producerInput, 'Quincy Jones')
      
      const searchButton = screen.getByRole('button', { name: /^Search$/ })
      await user.click(searchButton)
      
      // Verify producer search was called correctly
      await waitFor(() => {
        expect(mockSearchByProducer).toHaveBeenCalledWith('Quincy Jones', null, 0, expect.any(Function))
      })
      
      // Wait for results to be displayed (results list should appear when > 1 result)
      await waitFor(() => {
        // Check for results list container (class-based since no accessible role)
        const resultsList = document.querySelector('.results-list')
        expect(resultsList).toBeInTheDocument()
        
        // Verify results are in the list (check for result items)
        const resultItems = document.querySelectorAll('.result-item')
        expect(resultItems.length).toBeGreaterThan(0)
      }, { timeout: 3000 })
      
      // Verify album titles are in the DOM (they're in span.result-title)
      const thrillerElement = screen.queryByText('Thriller', { selector: '.result-title' })
      const offTheWallElement = screen.queryByText('Off the Wall', { selector: '.result-title' })
      
      // At least one should be present
      expect(thrillerElement || offTheWallElement).toBeTruthy()
    })
  })
})
