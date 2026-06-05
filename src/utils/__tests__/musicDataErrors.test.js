import { describe, expect, it } from 'vitest'
import { formatMusicDataError } from '../musicDataErrors'

describe('formatMusicDataError', () => {
  it.each([
    [
      new TypeError('Network request failed'),
      'Couldn’t reach the music data service. Check your connection and try again.'
    ],
    [
      new Error('MusicBrainz API error: 429 Too Many Requests'),
      'MusicBrainz is temporarily unavailable or busy. Try again in a minute.'
    ],
    [
      new Error('MusicBrainz API error: 503 Service Unavailable'),
      'MusicBrainz is temporarily unavailable or busy. Try again in a minute.'
    ],
    [
      new Error('MusicBrainz API error: 500 Internal Server Error'),
      'The music data service is having trouble right now. Try again later.'
    ],
    [
      new SyntaxError('Unexpected token < in JSON at position 0'),
      'The music data service returned an unexpected response. Try again later.'
    ],
    [
      new Error('Invalid response format from album art API'),
      'The music data service returned an unexpected response. Try again later.'
    ],
    [
      new Error('MusicBrainz API error: 404 Not Found'),
      'No matching music data was found. Check spelling or try a different search.'
    ],
    [
      new Error('Unknown music data issue'),
      'Something went wrong while loading music data. Try again.'
    ]
  ])('maps %s to stable user-facing copy', (error, expectedMessage) => {
    expect(formatMusicDataError(error)).toBe(expectedMessage)
  })
})
