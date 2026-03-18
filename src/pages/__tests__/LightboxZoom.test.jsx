import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
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

let originalResizeObserver

beforeAll(() => {
  originalResizeObserver = global.ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

afterAll(() => {
  if (originalResizeObserver) {
    global.ResizeObserver = originalResizeObserver
  } else {
    delete global.ResizeObserver
  }
})

function setupAlbumMocks() {
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
  mockFetchWikipediaContentFromMusicBrainz.mockResolvedValue(null)
  mockFetchAllAlbumArt.mockResolvedValue([
    {
      id: 'img-1',
      image: 'https://example.com/full-1.jpg',
      thumbnails: { '500': 'https://example.com/thumb-1.jpg' },
      types: ['Front'],
      front: true,
      back: false,
      approved: true
    },
    {
      id: 'img-2',
      image: 'https://example.com/full-2.jpg',
      thumbnails: { '500': 'https://example.com/thumb-2.jpg' },
      types: ['Back'],
      front: false,
      back: true,
      approved: true
    }
  ])
}

async function openFirstLightboxImage(user) {
  const galleryButton = await screen.findByRole('button', { name: /(View all album art|Hide gallery)/i })
  if (/view all album art/i.test(galleryButton.textContent || '')) {
    await user.click(galleryButton)
  }
  const thumbs = await screen.findAllByRole('img', { name: /Test Album/i })
  await user.click(thumbs[0])
}

describe('Album Art Lightbox Zoom', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupAlbumMocks()
  })

  it('renders zoom controls and keeps close/next/prev behavior', async () => {
    const user = userEvent.setup()
    renderAlbumPage()

    await openFirstLightboxImage(user)

    expect(await screen.findByRole('button', { name: /Zoom in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Zoom out/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reset view/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Next image/i }))
    await waitFor(() => {
      expect(screen.getByText(/Image 2 of 2/i)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Previous image/i }))
    await waitFor(() => {
      expect(screen.getByText(/Image 1 of 2/i)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /^Close$/i }))
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Zoom in/i })).not.toBeInTheDocument()
    })
  })

  it('resets zoom on next image and on close/reopen', async () => {
    const user = userEvent.setup()
    const { container } = renderAlbumPage()

    await openFirstLightboxImage(user)

    const getTransformString = () =>
      container.querySelector('.lightbox-transform-content')?.style.transform || ''

    const initialTransform = getTransformString()

    await user.click(screen.getByRole('button', { name: /Zoom in/i }))
    await waitFor(() => {
      expect(getTransformString()).not.toBe(initialTransform)
    })

    await user.click(screen.getByRole('button', { name: /Next image/i }))
    await waitFor(() => {
      expect(getTransformString()).toBe(initialTransform)
    })

    await user.click(screen.getByRole('button', { name: /Zoom in/i }))
    await waitFor(() => {
      expect(getTransformString()).not.toBe(initialTransform)
    })

    await user.click(screen.getByRole('button', { name: /^Close$/i }))
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Zoom in/i })).not.toBeInTheDocument()
    })

    await openFirstLightboxImage(user)
    await waitFor(() => {
      expect(getTransformString()).toBe(initialTransform)
    })
  })
})
