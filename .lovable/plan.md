

## Problem

The Instagram grid (4 cards in 2x2) doesn't align vertically with the bottom of the blog cards, and the two CTAs ("Ver todas as matérias" / "Seguir no Instagram") aren't on the same line. The Instagram button also uses a smaller font size (`text-[10px]`) compared to the blog button (`text-xs`).

## Solution

In `src/components/InstitutionalSection.tsx`:

1. **Add 2 more Instagram cards** (from 4 to 6), making a 2x3 grid — this extends the Instagram column downward to align with the blog cards.

2. **Use `flex flex-col justify-between`** on both the blog (left) and Instagram (right) columns so the CTAs naturally align at the bottom.

3. **Match the Instagram button style** to the blog button: change from `text-[10px] text-muted-foreground` to `text-xs text-foreground`, and `ArrowUpRight size={14}`.

### Changes in `InstitutionalSection.tsx`:
- Line 33: Add `flex flex-col` to left column div
- Line 101: Wrap CTA in `mt-auto` container  
- Line 118: Add `flex flex-col` to right column div
- Line 129-142: Change array from `[1,2,3,4]` to `[1,2,3,4,5,6]`
- Line 144-155: Update Instagram link classes to match blog CTA style (`text-xs text-foreground`, `ArrowUpRight size={14}`, add `mt-auto`)

