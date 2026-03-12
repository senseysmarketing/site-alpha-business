

## Problem

On mobile (390px viewport), the LifestyleSection uses scroll-linked horizontal translation (`useTransform` with `x` going from `0%` to `-45%`). With 3 cards at `80vw` each plus gaps and padding, the total scrollable content is ~240vw wide, but `-45%` translation isn't enough to reveal the last cards fully.

## Solution

1. **Increase scroll container height** from `h-[200vh]` to `h-[300vh]` to give more vertical scroll distance, making the horizontal movement feel smoother and less abrupt.

2. **Use responsive transform values** via `useIsMobile` hook:
   - **Mobile**: translate from `0%` to `-65%` (enough to fully reveal all 3 cards at 80vw each)
   - **Desktop**: keep current `-45%` which works for the smaller card widths (45vw/35vw)

3. **Add right padding** to the flex container so the last card has breathing room when fully scrolled into view.

### Files to modify
- `src/components/LifestyleSection.tsx`: Import `useIsMobile`, compute responsive transform end value, increase container height on mobile, add trailing padding.

