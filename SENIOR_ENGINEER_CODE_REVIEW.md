# Senior Engineer Code Review
**Date:** 2025-01-XX  
**Reviewer:** Senior Engineer Review  
**Scope:** Error Handling, Performance, Obvious Bugs

---

## 🔴 CRITICAL ISSUES

### 1. **Memory Leak: AbortController Signal Merging** (HIGH PRIORITY)
**Location:** `src/services/musicbrainz.js:19-28`, `src/utils/fetchWithTimeout.js:13-22`

**Problem:**
When merging AbortController signals, event listeners are added but never removed, causing memory leaks:

```javascript
const combinedController = new AbortController()
const abort = () => combinedController.abort()
controller.signal.addEventListener('abort', abort)  // ❌ Never removed
options.signal.addEventListener('abort', abort)      // ❌ Never removed
```

**Impact:** Memory leaks accumulate over time, especially during long producer searches with many API calls.

**Fix:**
```javascript
const combinedController = new AbortController()
const abort = () => combinedController.abort()
controller.signal.addEventListener('abort', abort)
options.signal.addEventListener('abort', abort)

// Store cleanup function
const cleanup = () => {
  controller.signal.removeEventListener('abort', abort)
  options.signal.removeEventListener('abort', abort)
}

// Clean up after fetch completes or aborts
// (Need to track and call cleanup appropriately)
```

---

### 2. **Race Condition: State Updates After Unmount** (HIGH PRIORITY)
**Location:** `src/pages/AlbumPage.jsx:2007-2050` (and similar patterns throughout)

**Problem:**
Checking `abortController.signal.aborted` before `setState` doesn't prevent state updates if component unmounts between the check and the setState call:

```javascript
if (!abortController.signal.aborted) {
  setGalleryImages(images)  // ❌ Component might be unmounted here
  setGalleryError(null)
}
```

**Impact:** React warnings about state updates on unmounted components, potential memory leaks, and unpredictable UI state.

**Fix:**
Use a ref to track mount status:
```javascript
const isMountedRef = useRef(true)

useEffect(() => {
  return () => {
    isMountedRef.current = false
  }
}, [])

// Then check before setState:
if (!abortController.signal.aborted && isMountedRef.current) {
  setGalleryImages(images)
}
```

---

### 3. **Unbounded Global Cache Growth** (MEDIUM PRIORITY)
**Location:** `src/services/musicbrainz.js:277-283`

**Problem:**
Global caches (`globalReleaseCache`, `fetchPromises`, `producerSeenRgIds`) grow unbounded and are never cleared:

```javascript
const globalReleaseCache = new Map()  // ❌ Never cleared
const fetchPromises = new Map()      // ❌ Never cleared
const producerSeenRgIds = new Map() // ❌ Never cleared
```

**Impact:** Memory usage grows indefinitely during long sessions, especially with producer searches processing hundreds of releases.

**Fix:**
- Implement LRU cache with size limits
- Clear caches on navigation/search changes
- Add periodic cleanup for stale entries

---

## ⚠️ ERROR HANDLING ISSUES

### 4. **Inconsistent Error Handling in Async Operations**
**Location:** Multiple locations in `src/pages/AlbumPage.jsx`

**Problem:**
Some async operations catch errors but don't always set error state, leaving UI in inconsistent states:

```javascript
.catch(err => {
  console.warn('Error loading gallery images:', err)
  // ❌ Sometimes sets error, sometimes doesn't
  // ❌ Doesn't always clear loading state
})
```

**Impact:** Users may see loading spinners that never resolve, or errors that aren't displayed.

**Recommendation:** Standardize error handling pattern:
- Always set error state on catch
- Always clear loading state in finally
- Provide user-friendly error messages

---

### 5. **Missing Error Boundaries for Async Operations**
**Location:** `src/pages/AlbumPage.jsx`

**Problem:**
Async operations in useEffect hooks can throw unhandled errors that crash the component, but ErrorBoundary only catches render errors.

**Impact:** Unhandled promise rejections can crash the app.

**Recommendation:** 
- Wrap all async operations in try-catch
- Consider using `react-error-boundary` library for async error handling
- Add global unhandled rejection handler

---

### 6. **Rate Limiter Doesn't Handle Concurrent Requests**
**Location:** `src/services/musicbrainz.js:9-69`

**Problem:**
The rate limiter uses a global `lastRequestTime` variable, which can cause issues with concurrent requests:

```javascript
let lastRequestTime = 0  // ❌ Shared mutable state
```

If multiple requests start simultaneously, they may all wait the same amount of time, then all fire at once, violating rate limits.

**Impact:** Potential rate limit violations, API errors.

**Fix:** Use a queue-based rate limiter or lock mechanism.

---

## 🐌 PERFORMANCE ISSUES

### 7. **Massive Component: AlbumPage.jsx (3,289 lines)**
**Location:** `src/pages/AlbumPage.jsx`

**Problem:**
Single component handles all search, pagination, album display, gallery, Wikipedia, credits, etc.

**Impact:**
- Difficult to maintain
- Unnecessary re-renders
- Hard to test
- Poor code organization

**Recommendation:** Split into smaller components:
- `SearchPage.jsx` - Search functionality
- `SearchResultsPage.jsx` - Results display and pagination
- `AlbumDetailPage.jsx` - Album details
- `AlbumGallery.jsx` - Gallery component
- `AlbumWikipedia.jsx` - Wikipedia component

---

### 8. **Excessive State Variables (334 setState calls)**
**Location:** `src/pages/AlbumPage.jsx`

**Problem:**
Component has 20+ useState hooks, leading to:
- Many re-renders
- Complex state management
- Difficult debugging

**Impact:** Performance degradation, especially on lower-end devices.

**Recommendation:**
- Use `useReducer` for related state
- Combine related state into objects
- Use context for shared state

---

### 9. **No Memoization for Expensive Operations**
**Location:** `src/pages/AlbumPage.jsx`

**Problem:**
Functions like `sortResults`, `filterBootlegs` are recreated on every render and called during render.

**Impact:** Unnecessary recalculations on every render.

**Fix:**
```javascript
const sortedResults = useMemo(
  () => sortResults(results, sortOption),
  [results, sortOption]
)
```

---

### 10. **Inefficient Array Operations**
**Location:** Multiple locations

**Problem:**
Multiple `.filter()`, `.map()`, `.slice()` operations chained without optimization.

**Example:**
```javascript
const filteredResults = filterBootlegs(sortedResults)
setDisplayedResults(filteredResults.slice(0, RESULTS_PER_PAGE))
```

**Impact:** O(n) operations repeated unnecessarily.

**Recommendation:** Memoize filtered/sorted results.

---

## 🐛 OBVIOUS BUGS

### 11. **Unused Utility: fetchWithTimeout**
**Location:** `src/utils/fetchWithTimeout.js`

**Problem:**
`fetchWithTimeout` utility exists but is never imported or used. The codebase uses `rateLimitedFetch` instead, which has similar but different timeout logic.

**Impact:** Code duplication, confusion about which to use.

**Recommendation:** Either use `fetchWithTimeout` or remove it.

---

### 12. **validateAlbumData References Undefined Variable**
**Location:** `src/utils/validateAlbum.js:26`

**Problem:**
Function references `album` variable that's imported from `../data/album.js`, but this appears to be test/example data, not runtime data.

**Impact:** Function may not work as intended if `album` is undefined or not the current album.

**Recommendation:** Pass album as parameter instead of importing static data.

---

### 13. **Missing Cleanup in Some useEffect Hooks**
**Location:** Multiple locations in `src/pages/AlbumPage.jsx`

**Problem:**
Some useEffect hooks that start async operations don't have proper cleanup, or cleanup doesn't prevent all state updates.

**Example:** Lines 2002-2050 - cleanup exists but state updates can still happen after unmount.

**Impact:** Memory leaks, React warnings.

---

### 14. **Duplicate Prefetch Cancellation Logic**
**Location:** `src/pages/AlbumPage.jsx:435-467`

**Problem:**
Prefetch cancellation logic is duplicated in multiple places (handleProducerSearch, handleProducerSelection, etc.).

**Impact:** Code duplication, maintenance burden, potential inconsistencies.

**Recommendation:** Extract to a single cleanup function.

---

## 📊 CODE QUALITY ISSUES

### 15. **Excessive Console Logging in Production**
**Location:** Throughout codebase

**Problem:**
Hundreds of `console.log` statements, especially debug logs like `[Gallery Debug]`, `[History]`, `[Prefetch]`.

**Impact:** 
- Performance overhead
- Cluttered console
- Potential information leakage

**Recommendation:**
- Use environment-based logging
- Remove or gate debug logs
- Consider logging library (e.g., `pino`, `winston`)

---

### 16. **Magic Numbers**
**Location:** Multiple locations

**Problem:**
Hardcoded values without constants:
- `1000` (rate limit delay)
- `15000` (timeout)
- `50` (max releases)
- `20` (results per page)

**Recommendation:** Extract to named constants.

---

### 17. **Inconsistent Error Messages**
**Location:** Throughout

**Problem:**
Error messages vary in tone and detail level. Some are user-friendly, others are technical.

**Recommendation:** Standardize error message format and tone.

---

## ✅ POSITIVE FINDINGS

1. **Good use of AbortController** for request cancellation
2. **Proper cleanup in most useEffect hooks** (though some improvements needed)
3. **Good error boundary implementation** (though could handle async errors)
4. **Comprehensive localStorage caching** with cleanup logic
5. **Rate limiting implementation** (though has concurrency issues)

---

## 📋 PRIORITY RECOMMENDATIONS

### Immediate (Fix Before Next Release):
1. Fix memory leak in signal merging (#1)
2. Fix race condition with unmounted components (#2)
3. Add mount status tracking for async operations

### High Priority (Next Sprint):
4. Implement cache size limits (#3)
5. Split AlbumPage into smaller components (#7)
6. Standardize error handling (#4, #5)
7. Fix rate limiter concurrency (#6)

### Medium Priority (Backlog):
8. Reduce state variables (#8)
9. Add memoization (#9)
10. Remove unused code (#11)
11. Clean up console logs (#15)

---

## 📝 SUMMARY

**Critical Issues:** 3  
**Error Handling Issues:** 3  
**Performance Issues:** 4  
**Bugs:** 4  
**Code Quality Issues:** 3  

**Overall Assessment:** The codebase is functional but has several critical issues that should be addressed, particularly around memory management and race conditions. The component architecture needs refactoring for maintainability and performance.

**Risk Level:** **MEDIUM-HIGH** - App works but has memory leaks and potential crashes from race conditions.
