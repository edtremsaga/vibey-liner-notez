# Debugging iPhone Chrome

## Method 1: Chrome DevTools Remote Debugging (Recommended)

### Prerequisites
- iPhone with Chrome installed
- Mac with Chrome browser installed
- USB cable to connect iPhone to Mac
- Both devices on the same network (or USB connection)

### Steps

1. **Enable Developer Mode on iPhone:**
   - Go to Settings → Privacy & Security → Developer Mode
   - Enable Developer Mode (may require restart)

2. **Enable Web Inspector on iPhone:**
   - Go to Settings → Safari → Advanced
   - Enable "Web Inspector" (Note: This is for Safari, but Chrome uses the same WebKit engine)

3. **Connect iPhone to Mac via USB**

4. **Open Chrome DevTools on Mac:**
   - Open Chrome browser on your Mac
   - Go to `chrome://inspect` in the address bar
   - You should see your iPhone listed under "Remote Target"
   - Click "inspect" next to your device

5. **Alternative: Use Safari Web Inspector (Works for Chrome too):**
   - On Mac: Safari → Develop → [Your iPhone Name] → [Your Website]
   - This works because Chrome on iOS uses WebKit (same engine as Safari)

## Method 2: On-Page Debug Panel (Easiest - NEW!)

**The app now includes a visible debug panel that automatically appears on Chrome mobile!**

1. **Open Chrome on iPhone**
2. **Navigate to your app**
3. **Look for the blue "Debug" button** in the bottom-right corner
4. **Click it to open the debug panel** - it will show all `[History]` logs directly on the page
5. **The panel automatically appears on Chrome mobile** - no setup needed!

The debug panel:
- ✅ Only shows on Chrome mobile (auto-detected)
- ✅ Captures all `[History]` console logs
- ✅ Shows logs in real-time as you navigate
- ✅ Can be toggled open/closed
- ✅ Has a "Clear" button to reset logs
- ✅ Auto-scrolls to show latest logs
- ✅ Color-coded by log level (log/warn/error)

**This is the easiest way to debug Chrome on iPhone!**

## Method 3: Safari Web Inspector (For Advanced Debugging)

If you need to see ALL console logs (not just History logs), you can use Safari Web Inspector:

1. **Enable Web Inspector on iPhone:**
   - Settings → Safari → Advanced → Enable "Web Inspector"

2. **Connect iPhone to Mac via USB**

3. **On Mac:**
   - Open Safari
   - Safari → Develop → [Your iPhone Name] → [Your Website]
   - This works because Chrome on iOS uses WebKit (same engine as Safari)

**Note:** Safari Web Inspector may not show Chrome's console logs reliably. The on-page debug panel (Method 2) is more reliable for Chrome-specific debugging.

## What to Look For in Logs

The enhanced logging will show:
- `[History] popstate event fired:` - Shows browser type, history state, and React state
- `[History] WARNING:` - Indicates potential Chrome-specific issues
- `[History] Error:` - Shows any errors during pushState/popState

### Common Chrome Issues to Check:

1. **History State is null:**
   - Look for: `historyState: null` when it should have a value
   - This might indicate Chrome isn't preserving history state properly

2. **pushState fails silently:**
   - Look for: `WARNING: pushState may have failed`
   - Check if `verifyState` doesn't match expected state

3. **popstate not firing:**
   - If you don't see `popstate event fired` when clicking back, Chrome may not be triggering the event

## Testing Checklist

1. ✅ Search for an artist → Check logs for `Pushed search results state`
2. ✅ Click an album → Check logs for `Pushed album details state`
3. ✅ Click browser back button → Check logs for `popstate event fired`
4. ✅ Verify history state structure matches expected format
5. ✅ Check if navigation actually works (does it go to the right page?)

## Reporting Issues

When reporting Chrome-specific issues, include:
- Browser version (Chrome on iOS version)
- iOS version
- Full console logs (especially `[History]` prefixed logs)
- Steps to reproduce
- Expected vs actual behavior
