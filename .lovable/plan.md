

## AI Co-pilot & Enhanced Editor for Blog

### Overview

Add an AI co-pilot sidebar to the blog editor that can generate titles, excerpts, improve content, and suggest SEO keywords. Also enhance the toolbar with a persistent formatting bar (not just bubble menu) with more options.

### 1. Edge Function: `blog-ai-assist`

New Supabase edge function that proxies requests to Lovable AI Gateway.

**Endpoints via action types:**
- `generate-titles` — Given content draft, returns 3 title suggestions
- `improve-content` — Rewrites/improves selected text or full content
- `generate-excerpt` — Creates SEO meta description from content
- `suggest-keywords` — Suggests hyperlocal SEO keywords based on content (Alphaville-focused)
- `expand-content` — Expands a brief outline into full paragraphs

System prompt focused on luxury real estate in Alphaville, Portuguese (BR), SEO best practices.

**File:** `supabase/functions/blog-ai-assist/index.ts`
**Config:** Add `[functions.blog-ai-assist]` to `supabase/config.toml`

### 2. AI Co-pilot Sidebar Component

**File:** `src/components/admin/blog/AICopilotSidebar.tsx`

A collapsible right-side panel (slides over or replaces MediaSidebar via tabs) with:

- **Gerar Títulos**: Button that sends current content → returns 3 clickable title options
- **Gerar Descrição SEO**: One-click to auto-fill the excerpt field
- **Sugerir Keywords**: Shows keyword chips based on content analysis
- **Melhorar Texto**: Takes selected text or full content and returns improved version
- **Expandir Rascunho**: Takes brief notes and generates full paragraphs

Each action shows a loading spinner, then results in cards that can be applied with one click.

### 3. Enhanced Editor Toolbar

**Update:** `src/components/admin/blog/EditorToolbar.tsx`

Replace the current bubble-only toolbar with a **persistent formatting bar** above the textarea, plus keep the bubble menu on selection. Add buttons for:

- H1 (`# `), H2 (`## `), H3 (`### `)
- Bold (`**`), Italic (`_`), Strikethrough (`~~`)
- Bullet list (`- `), Numbered list (`1. `)
- Quote (`> `), Code (`` ` ``), Link (`[](url)`)
- Horizontal rule (`---`)
- Image placeholder (`![alt](url)`)

Styled as a clean sticky bar with icon buttons and subtle separators.

### 4. BlogEditor.tsx Updates

- Add tab system in the sidebar area: "Mídia & SEO" | "AI Copilot"
- Pass content/title/category to AICopilotSidebar
- Wire AI callbacks (e.g., when AI generates a title, update title state; when AI generates excerpt, update excerpt state)
- Add "AI Assist" sparkle button in the top bar

### Files Summary

| File | Action |
|---|---|
| `supabase/functions/blog-ai-assist/index.ts` | Create — edge function |
| `supabase/config.toml` | Edit — add function config |
| `src/components/admin/blog/AICopilotSidebar.tsx` | Create — AI panel |
| `src/components/admin/blog/EditorToolbar.tsx` | Rewrite — persistent + bubble toolbar |
| `src/pages/admin/BlogEditor.tsx` | Edit — integrate sidebar tabs + AI |

### Data Flow

```text
BlogEditor (content/title state)
  ├── EditorToolbar (persistent bar + bubble menu)
  ├── MediaSidebar (tab 1: cover, SEO, categories)
  └── AICopilotSidebar (tab 2)
        └── supabase.functions.invoke("blog-ai-assist", { action, content })
              └── Lovable AI Gateway (gemini-3-flash-preview)
```

No database migrations needed. Uses existing `LOVABLE_API_KEY` secret.

