

## Problem

The animation delays in Header (3.2s) and HeroSection search bar (3.9s) are counted from when the component mounts, which happens **after** the preloader finishes at 3.2s. So the user waits ~3.2s (preloader) + 3.2s (header delay) = ~6.4s total before seeing the header. The video also loads from scratch after the preloader, causing a blank gap.

## Solution

### 1. Reduce animation delays (Header + HeroSection)

**Header.tsx** (line 24): Change `delay: 3.2` to `delay: 0.3` -- header appears almost immediately after preloader.

**HeroSection.tsx**:
- Search bar (line 44): Change `delay: 3.9` to `delay: 0.8`
- Scroll indicator (line 89): Change `delay: 4.5` to `delay: 1.5`

### 2. Preload video with poster frame (HeroSection.tsx)

Add `preload="auto"` to both video elements so the browser starts loading during the preloader phase. Also add a `poster` attribute approach: set the video to initially show its first frame by using `preload="metadata"` -- actually simpler: just add `preload="auto"` so the video is ready when the component mounts.

**But wait** -- the videos only mount after `loaded=true`. To truly preload them during the preloader, we need to render the videos in the DOM earlier.

### 3. Render content immediately but hidden (Index.tsx)

Change `Index.tsx` so the main content is always rendered but visually hidden behind the preloader (which has `z-[100]`). This way videos start loading immediately while the preloader plays. Change from conditional rendering (`{loaded && (...)}`) to always rendering with an opacity/visibility wrapper.

### Files to change:

**`src/pages/Index.tsx`**: Remove conditional rendering. Always render Header + main + Footer. Wrap in a div that transitions opacity from 0 to 1 when `loaded` is true.

**`src/components/Header.tsx`** (line 24): `delay: 3.2` → `delay: 0.3`

**`src/components/HeroSection.tsx`**:
- Line 44: `delay: 3.9` → `delay: 0.8`
- Line 89: `delay: 4.5` → `delay: 1.5`

This way the video loads during the preloader, and header/search appear almost instantly after.

