# Quick 5-Minute Memory Leak Test Guide

## What We're Testing
Verify that event listeners in AbortController signal merging are properly cleaned up (memory leak fix).

## Step-by-Step Instructions

### 1. Open Chrome DevTools (2 minutes)
1. Open the app: http://localhost:3005
2. Press `F12` or `Cmd+Option+I` (Mac) to open DevTools
3. Go to **Memory** tab
4. Select **Heap snapshot** (not Allocation timeline)

### 2. Take Initial Snapshot (30 seconds)
1. Click **Take snapshot** button
2. Wait for snapshot to complete
3. Name it "Before" (optional)

### 3. Perform Test Operations (2 minutes)
Do these actions to trigger API calls with signal merging:

**Test 1: Album Searches**
- Search for "The Beatles" → wait for results
- Search for "Pink Floyd" → wait for results  
- Search for "Radiohead" → wait for results

**Test 2: Aborted Requests**
- Start typing a producer name (e.g., "Butch Vig")
- Click "Search by Producer" tab (aborts previous)
- Start another search, then immediately click back

**Test 3: Navigation**
- Click on an album from results
- Click browser back button
- Repeat 2-3 times

### 4. Take Final Snapshot (30 seconds)
1. Wait 10 seconds after last operation
2. Click **Take snapshot** button again
3. Name it "After" (optional)

### 5. Compare Snapshots (1 minute)
1. Select "After" snapshot
2. In dropdown, select "Comparison" → choose "Before"
3. Look for these objects (should NOT increase):
   - `AbortController`
   - `AbortSignal`
   - `EventTarget` (related to signals)

## What to Look For

### ✅ Good (No Leak)
- AbortController count stays same or decreases
- No accumulation of EventTarget objects
- Memory usage stable

### ❌ Bad (Leak Still Present)
- AbortController count increases significantly
- Many EventTarget objects accumulating
- Memory usage growing

## Expected Results

**If fix works:** You should see minimal or no increase in AbortController/EventTarget objects.

**If leak still present:** You'll see accumulation of these objects with each API call.

## Quick Check Alternative

If heap snapshots are too complex, you can also:
1. Open **Performance** tab
2. Click record
3. Perform test operations
4. Stop recording
5. Check for memory leaks warning (should be none)

## Report Back

After testing, report:
- ✅ Leak fixed (no accumulation)
- ❌ Leak still present (objects accumulating)
- ⚠️ Uncertain (need more investigation)
