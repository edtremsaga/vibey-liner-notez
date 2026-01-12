# Browser Memory Leak Test Plan

## Test Scenarios

### 1. Basic API Calls
- Make several album searches
- Check memory usage before/after
- Verify no accumulation of event listeners

### 2. Aborted Requests
- Start a producer search
- Immediately navigate away (abort)
- Check that cleanup is called
- Verify no memory leak

### 3. Concurrent Requests
- Make multiple rapid searches
- Check memory usage
- Verify cleanup happens for all requests

### 4. Long-Running Operations
- Start a long producer search (e.g., "George Martin")
- Monitor memory during operation
- Verify cleanup after completion/abort

## How to Test in Browser DevTools

### Chrome DevTools Memory Profiler:
1. Open DevTools (F12)
2. Go to "Memory" tab
3. Take heap snapshot before operations
4. Perform test operations
5. Take heap snapshot after
6. Compare snapshots - look for:
   - AbortController instances
   - Event listener references
   - Signal objects

### Console Verification:
- Check for React warnings about memory
- Monitor console for any errors
- Check network tab for aborted requests

## Expected Results
- No accumulation of AbortController instances
- Event listeners properly removed
- Memory usage stable over time
- No React warnings about memory leaks
