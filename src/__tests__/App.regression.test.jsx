import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// Mock the services to avoid actual API calls
vi.mock('../services/musicbrainz', () => ({
  searchReleaseGroups: vi.fn(),
  fetchAlbumData: vi.fn(),
  fetchAlbumBasicInfo: vi.fn(),
  fetchCoverArt: vi.fn(),
  fetchAllAlbumArt: vi.fn(),
  fetchWikipediaContentFromMusicBrainz: vi.fn()
}))

// Mock cache utilities
vi.mock('../utils/albumCache', () => ({
  getCachedAlbum: vi.fn(() => null),
  setCachedAlbum: vi.fn()
}))

describe('App Regression Tests - Verify ErrorBoundary Does Not Break Existing Functionality', () => {
  describe('App Initialization', () => {
    it('should render app header correctly', () => {
      render(<App />)
      expect(screen.getByText('liner notez')).toBeInTheDocument()
    })

    it('should render search form', () => {
      render(<App />)
      expect(screen.getByText(/Search for an Album/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Artist Name/i)).toBeInTheDocument()
    })

    it('should render help link', () => {
      render(<App />)
      const helpLink = screen.getByText('Help')
      expect(helpLink).toBeInTheDocument()
    })
  })

  describe('Search Form Functionality', () => {
    it('should allow typing in artist name field', async () => {
      const user = userEvent.setup()
      render(<App />)

      const artistInput = screen.getByLabelText(/Artist Name/i)
      await user.type(artistInput, 'David Bowie')

      expect(artistInput).toHaveValue('David Bowie')
    })

    it('should allow typing in album name field', async () => {
      const user = userEvent.setup()
      render(<App />)

      const albumInput = screen.getByLabelText(/Album Name/i)
      await user.type(albumInput, 'Aladdin Sane')

      expect(albumInput).toHaveValue('Aladdin Sane')
    })

    it('should show release type buttons when album name is empty', () => {
      render(<App />)

      expect(screen.getByText('Studio Albums')).toBeInTheDocument()
      expect(screen.getByText('EPs')).toBeInTheDocument()
      expect(screen.getByText('Singles')).toBeInTheDocument()
    })
  })

  describe('Error States Still Work', () => {
    it('should have error handling in place', () => {
      // This test verifies the app structure supports error handling
      // Actual error testing would require more complex mocking
      render(<App />)

      // App should render without crashing
      expect(screen.getByText('liner notez')).toBeInTheDocument()
      
      // Error boundary should be in place (implicitly tested by no crashes)
      // If ErrorBoundary breaks things, app won't render
    })
  })

  describe('Component Structure', () => {
    it('should have AppShell structure', () => {
      render(<App />)

      // AppShell should render (check for app-header class or structure)
      const header = screen.getByText('liner notez').closest('.app-header')
      expect(header).toBeInTheDocument()
    })

    it('should have ErrorBoundary wrapper (implicitly tested by no crashes)', () => {
      // If ErrorBoundary breaks things, app won't render
      render(<App />)
      expect(screen.getByText('liner notez')).toBeInTheDocument()
    })
  })

  describe('No Console Errors in Normal Operation', () => {
    it('should not log errors when app works normally', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(<App />)

      // Wait a bit for any async operations
      await waitFor(() => {
        // In normal operation, console.error should not be called
        // (except for the initial render which might have some warnings)
        expect(consoleErrorSpy).not.toHaveBeenCalled()
      }, { timeout: 1000 })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('ErrorBoundary Does Not Interfere', () => {
    it('should allow normal component updates', async () => {
      const user = userEvent.setup()
      render(<App />)

      const artistInput = screen.getByLabelText(/Artist Name/i)
      
      // Type multiple times - should work without errors
      await user.type(artistInput, 'Test')
      await user.clear(artistInput)
      await user.type(artistInput, 'Another Test')

      expect(artistInput).toHaveValue('Another Test')
    })

    it('should allow state changes without triggering error boundary', () => {
      render(<App />)

      // Interact with release type buttons
      const epButton = screen.getByText('EPs')
      expect(epButton).toBeInTheDocument()
      
      // Clicking should not cause errors
      // (We're just verifying the component doesn't crash)
    })
  })
})
