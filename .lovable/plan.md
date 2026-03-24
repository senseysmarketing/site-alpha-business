

## Fix: Instagram Embeds Loading Infinitely

### Root Cause

The `InstagramEmbedWithSkeleton` component sets `opacity-0` until `onLoad` fires on `<InstagramEmbed>`. However, `react-social-media-embed`'s `InstagramEmbed` component does **not reliably fire** the `onLoad` callback — it renders an iframe internally and the load event doesn't propagate to the React prop.

Result: skeleton shows forever, embed is rendered but invisible (`opacity-0`).

### Fix

**`src/components/InstitutionalSection.tsx`**

Replace the `onLoad`-based approach with a **timer-based fallback**:
- Keep the skeleton initially
- Use a `setTimeout` (e.g., 3 seconds) to force `loaded = true` as a fallback
- Additionally, use an `IntersectionObserver` or simply always render the embed visible (remove the opacity toggle entirely)

Simplest reliable fix: **remove the opacity toggle entirely** and just show the skeleton underneath the embed. As the iframe loads naturally, it will cover the skeleton. No need for `onLoad`.

```typescript
function InstagramEmbedWithSkeleton({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Fallback: assume loaded after 4 seconds
    const timer = setTimeout(() => setLoaded(true), 4000);
    return () => clearTimeout(timer);
  }, [url]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {!loaded && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
      )}
      <div className="w-full h-full">
        <InstagramEmbed url={url} width="100%" captioned />
      </div>
    </div>
  );
}
```

Key changes:
- Remove `onLoad` prop (unreliable)
- Remove `opacity-0/opacity-100` toggle (was hiding the loaded content)
- Add `useEffect` timer as fallback to dismiss skeleton after 4s
- Embed is always visible, skeleton sits behind it and disappears after timeout

### Files

| Arquivo | Acao |
|---|---|
| `src/components/InstitutionalSection.tsx` | Fix `InstagramEmbedWithSkeleton` — remove opacity toggle, add timer fallback |

