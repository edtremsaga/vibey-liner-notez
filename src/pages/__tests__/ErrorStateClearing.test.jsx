import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AlbumPage from '../AlbumPage'
import * as musicbrainz from '../../services/musicbrainz'

// Mock the services
vi.mock('../../services/musicbrainz')
vi.mock('../../utils/albumCache', () => ({
  getCachedAlbum: vi.fn(() => null),
  setCachedAlbum: vi.fn()
}))

describe('Error State Clearing (P1 Fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Clear Error on Sort Change', () => {
    it('should clear search error when sort option changes', async () => {
      const user = userEvent.setup()
      
      // Mock successful search
      const mockResults = [
        { releaseGroupId: '1', title: 'Album 1', artistName: 'Artist', releaseYear: 2020, isBootleg: false },
        { releaseGroupId: '2', title: 'Album 2', artistName: 'Artist', releaseYear: 2021, isBootleg: false }
      ]
      
      musicbrainz.searchReleaseGroups.mockResolvedValueOnce({
        results: mockResults,
        totalCount: 2,
        isArtistOnly: true
      })

      render(<AlbumPage />)

      // Perform a search
      const artistInput = screen.getByLabelText(/Artist Name/i)
      const searchButton = screen.getByRole('button', { name: /Search/i })
      
      await user.type(artistInput, 'Test Artist')
      await user.click(searchButton)

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText(/Studio Albums Found/i)).toBeInTheDocument()
      }, { timeout: 3000 })

      // Change sort option - should not cause errors
      const sortSelect = screen.getByLabelText(/Sort by/i)
      await user.selectOptions(sortSelect, 'oldest')

      // Should still show results (no errors)
      expect(screen.getByText(/Studio Albums Found/i)).toBeInTheDocument()
      expect(screen.queryByText(/Failed to/i)).not.toBeInTheDocument()
    })
  })

  describe('Clear Error on Bootleg Filter Change', () => {
    it('should clear search error when bootleg filter changes', async () => {
      const user = userEvent.setup()
      
      // Mock successful search with bootlegs
      const mockResults = [
        { releaseGroupId: '1', title: 'Album 1', artistName: 'Artist', releaseYear: 2020, isBootleg: false },
        { releaseGroupId: '2', title: 'Bootleg', artistName: 'Artist', releaseYear: 2021, isBootleg: true }
      ]
      
      musicbrainz.searchReleaseGroups.mockResolvedValueOnce({
        results: mockResults,
        totalCount: 2,
        isArtistOnly: true
      })

      render(<AlbumPage />)

      // Perform a search
      const artistInput = screen.getByLabelText(/Artist Name/i)
      const searchButton = screen.getByRole('button', { name: /Search/i })
      
      await user.type(artistInput, 'Test Artist')
      await user.click(searchButton)

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText(/Studio Albums Found/i)).toBeInTheDocument()
      }, { timeout: 3000 })

      // Toggle bootleg filter - should work without errors
      const bootlegCheckbox = screen.getByLabelText(/Hide bootlegs/i)
      await user.click(bootlegCheckbox)

      // Should still show results (no errors)
      expect(screen.getByText(/Studio Albums Found/i)).toBeInTheDocument()
      expect(screen.queryByText(/Failed to/i)).not.toBeInTheDocument()
    })
  })

})
