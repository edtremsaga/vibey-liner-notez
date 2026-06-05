import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AlbumPage from '../AlbumPage'
import { HelpProvider } from '../../contexts/HelpContext'

const mockSearchReleaseGroups = vi.fn()
const mockSearchByProducer = vi.fn()
const mockFetchAlbumBasicInfo = vi.fn()
const mockFetchAlbumData = vi.fn()

vi.mock('../../services/musicbrainz', () => ({
  searchReleaseGroups: (...args) => mockSearchReleaseGroups(...args),
  searchByProducer: (...args) => mockSearchByProducer(...args),
  fetchAlbumData: (...args) => mockFetchAlbumData(...args),
  fetchAlbumBasicInfo: (...args) => mockFetchAlbumBasicInfo(...args),
  fetchCoverArt: vi.fn(),
  fetchAllAlbumArt: vi.fn(),
  fetchWikipediaContentFromMusicBrainz: vi.fn(),
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

async function searchAlbums({ artist = 'Test Artist', album = null } = {}) {
  const user = userEvent.setup()
  renderAlbumPage()

  await user.type(screen.getByLabelText(/Artist Name/i), artist)
  if (album) {
    await user.type(screen.getByLabelText(/Album Name/i), album)
  }
  await user.click(screen.getByRole('button', { name: /^Search$/i }))

  await waitFor(() => {
    expect(screen.getByText(/Studio Albums Found/i)).toBeInTheDocument()
  })

  return user
}

function getResultTitles() {
  return Array.from(screen.getByRole('list').querySelectorAll('.result-title')).map(title => title.textContent)
}

describe('Album results defaults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/')
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    })
  })

  it('defaults artist-only studio album browsing to oldest-first', async () => {
    mockSearchReleaseGroups.mockResolvedValueOnce({
      totalCount: 2,
      isArtistOnly: true,
      results: [
        { releaseGroupId: 'newer', title: 'Newer Album', artistName: 'Artist', releaseYear: 2021, isBootleg: false },
        { releaseGroupId: 'older', title: 'Older Album', artistName: 'Artist', releaseYear: 1971, isBootleg: false }
      ]
    })

    await searchAlbums()

    expect(screen.getByLabelText(/Sort by/i)).toHaveValue('oldest')
    expect(getResultTitles()).toEqual(['Older Album', 'Newer Album'])
  })

  it('preserves newest-first default for specific album searches', async () => {
    mockSearchReleaseGroups.mockResolvedValueOnce({
      totalCount: 2,
      isArtistOnly: false,
      results: [
        { releaseGroupId: 'older-match', title: 'Album Match 1971', artistName: 'Artist', releaseYear: 1971, isBootleg: false },
        { releaseGroupId: 'newer-match', title: 'Album Match 2021', artistName: 'Artist', releaseYear: 2021, isBootleg: false }
      ]
    })

    await searchAlbums({ album: 'Album Match' })

    expect(screen.getByLabelText(/Sort by/i)).toHaveValue('newest')
    expect(getResultTitles()).toEqual(['Album Match 2021', 'Album Match 1971'])
  })

  it('hides bootlegs by default and keeps the hidden-count label', async () => {
    mockSearchReleaseGroups.mockResolvedValueOnce({
      totalCount: 2,
      isArtistOnly: true,
      results: [
        { releaseGroupId: 'official', title: 'Official Album', artistName: 'Artist', releaseYear: 1971, isBootleg: false },
        { releaseGroupId: 'bootleg', title: 'Bootleg Album', artistName: 'Artist', releaseYear: 1972, isBootleg: true }
      ]
    })

    await searchAlbums()

    expect(screen.getByLabelText(/Hide bootlegs/i)).toBeChecked()
    expect(screen.getByText(/\(1 bootlegs hidden\)/i)).toBeInTheDocument()
    expect(screen.getByText('Official Album')).toBeInTheDocument()
    expect(screen.queryByText('Bootleg Album')).not.toBeInTheDocument()
  })

  it('preserves producer search bootleg visibility by default', async () => {
    const user = userEvent.setup()
    mockSearchByProducer.mockResolvedValueOnce({
      totalCount: 2,
      producerName: 'Test Producer',
      producerMBID: 'producer-1',
      releasesProcessed: 2,
      results: [
        { releaseGroupId: 'official', title: 'Official Produced Album', artistName: 'Artist', releaseYear: 1971, isBootleg: false },
        { releaseGroupId: 'bootleg', title: 'Bootleg Produced Album', artistName: 'Artist', releaseYear: 1972, isBootleg: true }
      ]
    })

    renderAlbumPage()

    await user.click(screen.getByRole('button', { name: /Search by Producer/i }))
    await user.type(screen.getByLabelText(/Producer Name/i), 'Test Producer')
    await user.click(screen.getByRole('button', { name: /^Search$/i }))

    await waitFor(() => {
      expect(screen.getByText(/Studio Albums Found - Test Producer/i)).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/Hide bootlegs/i)).not.toBeChecked()
    expect(screen.getByText('Official Produced Album')).toBeInTheDocument()
    expect(screen.getByText('Bootleg Produced Album')).toBeInTheDocument()
  })

  it('preserves user sort override behavior', async () => {
    mockSearchReleaseGroups.mockResolvedValueOnce({
      totalCount: 2,
      isArtistOnly: true,
      results: [
        { releaseGroupId: 'newer', title: 'Newer Album', artistName: 'Artist', releaseYear: 2021, isBootleg: false },
        { releaseGroupId: 'older', title: 'Older Album', artistName: 'Artist', releaseYear: 1971, isBootleg: false }
      ]
    })

    const user = await searchAlbums()

    await user.selectOptions(screen.getByLabelText(/Sort by/i), 'newest')

    expect(screen.getByLabelText(/Sort by/i)).toHaveValue('newest')
    expect(getResultTitles()).toEqual(['Newer Album', 'Older Album'])
  })

  it('shows safe user-facing copy for album search service errors', async () => {
    const user = userEvent.setup()
    mockSearchReleaseGroups.mockRejectedValueOnce(new Error('MusicBrainz API error: 503 Service Unavailable'))

    renderAlbumPage()

    await user.type(screen.getByLabelText(/Artist Name/i), 'Unavailable Artist')
    await user.click(screen.getByRole('button', { name: /^Search$/i }))

    await waitFor(() => {
      expect(screen.getByText('MusicBrainz is temporarily unavailable or busy. Try again in a minute.')).toBeInTheDocument()
    })
    expect(screen.queryByText(/MusicBrainz API error: 503/i)).not.toBeInTheDocument()
  })

  it('shows safe user-facing copy for album detail load errors', async () => {
    const user = userEvent.setup()
    mockSearchReleaseGroups.mockResolvedValueOnce({
      totalCount: 1,
      isArtistOnly: false,
      results: [
        { releaseGroupId: 'detail-error', title: 'Detail Error Album', artistName: 'Artist', releaseYear: 2021, isBootleg: false }
      ]
    })
    mockFetchAlbumBasicInfo.mockRejectedValueOnce(new SyntaxError('Unexpected token < in JSON at position 0'))

    renderAlbumPage()

    await user.type(screen.getByLabelText(/Artist Name/i), 'Detail Artist')
    await user.type(screen.getByLabelText(/Album Name/i), 'Detail Error Album')
    await user.click(screen.getByRole('button', { name: /^Search$/i }))

    await waitFor(() => {
      expect(screen.getByText('The music data service returned an unexpected response. Try again later.')).toBeInTheDocument()
    })
    expect(screen.queryByText(/Unexpected token/i)).not.toBeInTheDocument()
  })
})
