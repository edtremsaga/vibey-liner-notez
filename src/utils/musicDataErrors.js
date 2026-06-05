const CONNECTION_ERROR_MESSAGE = 'Couldn’t reach the music data service. Check your connection and try again.'
const TEMPORARY_UNAVAILABLE_MESSAGE = 'MusicBrainz is temporarily unavailable or busy. Try again in a minute.'
const SERVER_ERROR_MESSAGE = 'The music data service is having trouble right now. Try again later.'
const UNEXPECTED_RESPONSE_MESSAGE = 'The music data service returned an unexpected response. Try again later.'
const NOT_FOUND_MESSAGE = 'No matching music data was found. Check spelling or try a different search.'
const GENERIC_ERROR_MESSAGE = 'Something went wrong while loading music data. Try again.'

function getErrorText(error) {
  return String(error?.message ?? error ?? '').toLowerCase()
}

function hasStatus(errorText, status) {
  return new RegExp(`(^|\\D)${status}(\\D|$)`).test(errorText)
}

function hasServerStatus(errorText) {
  return /(^|\D)5\d\d(\D|$)/.test(errorText)
}

export function formatMusicDataError(error) {
  const errorText = getErrorText(error)

  if (
    errorText.includes('network request failed') ||
    errorText.includes('failed to fetch') ||
    errorText.includes('fetch failed') ||
    errorText.includes('networkerror') ||
    errorText.includes('offline') ||
    errorText.includes('internet connection') ||
    errorText.includes('load failed')
  ) {
    return CONNECTION_ERROR_MESSAGE
  }

  if (hasStatus(errorText, 429) || hasStatus(errorText, 503)) {
    return TEMPORARY_UNAVAILABLE_MESSAGE
  }

  if (hasServerStatus(errorText)) {
    return SERVER_ERROR_MESSAGE
  }

  if (
    error instanceof SyntaxError ||
    errorText.includes('unexpected token') ||
    errorText.includes('unexpected end') ||
    errorText.includes('invalid json') ||
    errorText.includes('json parse') ||
    errorText.includes('malformed') ||
    errorText.includes('invalid response format')
  ) {
    return UNEXPECTED_RESPONSE_MESSAGE
  }

  if (hasStatus(errorText, 404) || errorText.includes('not found')) {
    return NOT_FOUND_MESSAGE
  }

  return GENERIC_ERROR_MESSAGE
}
