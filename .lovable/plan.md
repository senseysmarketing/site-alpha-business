

## Hero Editorial — 5 Banners Customizáveis (Admin)

Transformar o Hero de "carrossel de propriedades existentes" para um sistema de **slides editoriais 100% configuráveis** no admin: até 5 banners, cada um com tagline, título, subtítulo, CTA (label + link) e mídia própria (imagem ou vídeo) com upload + validação de tamanho.

### 1. Nova estrutura de dados (`site_settings.hero`)

Estender o schema do `HeroSettings`:

```ts
interface HeroSlide {
  id: string;                  // uuid local
  tagline: string;             // ex: "Prepare-se para sonhar alto"
  title: string;               // suporta *itálico*
  subtitle: string;            // descrição curta (substitui o "endereço")
  cta_label: string;           // ex: "Saiba Mais"
  cta_href: string;            // link interno (/imovel/x) ou externo (https://)
  media_type: "image" | "video";
  media_url: string;           // URL no Supabase Storage
  poster_url?: string;         // opcional p/ vídeos
}

interface HeroSettings {
  slides: HeroSlide[];         // máx 5
  // legacy mantidos para retrocompat (opcionais):
  tagline?: string;
  headline?: string;
  carousel_property_ids?: string[];
}
```

**Migração defensiva**: ao carregar settings antigos sem `slides`, gerar 1 slide a partir de `tagline + headline` + a primeira propriedade do `carousel_property_ids` como fallback. O admin pode então editar livremente.

### 2. UI Admin — bloco "Homepage Hero" reformulado

Substituir o atual SettingsBlock por uma lista vertical de até 5 cards `HeroSlideEditor`:

- **Header do bloco**: título + contador `{n}/5` + botão `+ Adicionar banner` (desabilitado quando 5).
- Cada card de slide (collapsible/accordion):
  - Header: thumbnail mini + título + drag handle (`GripVertical`) + botão remover (`Trash2`).
  - Campos:
    - `Frase de apoio (tagline)` — Input
    - `Título principal` — Textarea (com nota "use *asteriscos* para itálico")
    - `Subtítulo / descrição curta` — Textarea (max 140 chars, contador)
    - `Texto do botão` + `Link do botão` — 2 Inputs em grid 2 col (link aceita `/rota` ou `https://...`)
    - **Mídia (imagem ou vídeo)** — novo componente `MediaDrop` (ver §3)
- **Reorder**: drag-and-drop com `@dnd-kit/sortable` (já presente no projeto se houver; se não, usar reorder simples por setas ↑↓ — verificar via lookup, mas para manter simples e sem nova dep, **usaremos botões ↑/↓** ao lado do `GripVertical`).

### 3. Componente `MediaDrop` — upload com validação

Estende o `PhotoDrop` existente, mas:

- Aceita `image/*` **e** `video/mp4, video/webm`.
- **Limites de tamanho**:
  - Imagem: **5 MB** máx
  - Vídeo: **15 MB** máx
- Validação client-side antes do upload: se exceder, exibir toast `destructive` "Arquivo muito grande. Limite: X MB".
- Detecta `media_type` automaticamente pelo MIME do arquivo enviado e atualiza o slide.
- Upload para bucket `property-photos` em `hero-slides/` (mesmo bucket já público).
- Preview: imagem renderizada inline; vídeo renderizado como `<video muted playsInline>` com controles desativados.
- **Aviso fixo abaixo do dropzone** (texto `text-xs text-muted-foreground`):
  > Recomendado: imagens 1920×1080 (JPG/WebP, até 5 MB) ou vídeos MP4 H.264 1080p (até 15 MB, ~10s). Arquivos maiores impactam o tempo de carregamento do site.

### 4. Atualizar `HeroSection.tsx` (público)

Refatorar a fonte de dados:

- Remover `useQuery` de `properties` baseado em `carousel_property_ids`.
- Ler `heroSettings.slides`. Se vazio, fallback ao bloco atual de mockProperties (mantém home funcional em projeto novo).
- Mapear cada slide diretamente:
  ```ts
  slides = heroSettings.slides.map(s => ({
    id: s.id,
    tagline: s.tagline,
    title: s.title,           // renderizar com parser de *itálico* (igual ao headline antigo)
    description: s.subtitle,
    image: s.media_type === "image" ? s.media_url : (s.poster_url || ""),
    videoUrl: s.media_type === "video" ? s.media_url : undefined,
    ctaLabel: s.cta_label,
    ctaHref: s.cta_href,
  }))
  ```
- O `tagline` passa a ser **por slide** (não mais global) — exibe `current.tagline`.
- Botão "Saiba Mais" passa a usar `current.ctaLabel` + `current.ctaHref`. Se `ctaHref` começa com `http`, renderizar `<a target="_blank">`; senão `<Link>` interno.
- Suporte a `*itálico*` no título: extrair o helper `renderHeadline` já usado no preview do admin para `src/lib/markdown.tsx` (ou inline) e aplicar.

### 5. Mini Preview (admin)

Atualizar o painel "Mini Preview" do admin para iterar sobre `heroForm.slides` (mostrar slide ativo via state local + dots clicáveis), refletindo tagline/título/subtítulo/CTA/mídia reais. Vídeos mostrados como thumbnail estático (poster) para leveza.

### 6. Memória

Atualizar `mem://features/hero/carousel-layout` para refletir:
- Hero agora é alimentado por `site_settings.hero.slides` (até 5), não mais por `properties.is_featured`.
- Cada slide tem CTA e mídia próprios; suporta imagem ou vídeo.
- Limites de upload: 5 MB (imagem) / 15 MB (vídeo).

### Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `src/pages/admin/SiteSettings.tsx` (novo bloco multi-slide, MediaDrop, validação) |
| Editar | `src/components/HeroSection.tsx` (consumir `slides`, CTA dinâmico, vídeo/imagem por slide) |
| Atualizar | `mem://features/hero/carousel-layout` |

### Observações

- Sem nova dependência: drag handle visual + botões ↑/↓ (sem `@dnd-kit`).
- Bucket `property-photos` já público — sem migração SQL.
- Retrocompatível: `tagline`/`headline`/`carousel_property_ids` antigos continuam no JSON e geram 1 slide automático na primeira carga; admin pode então salvar a nova estrutura.
- Limite de 15 MB para vídeo é conservador para Hero acima da dobra; se precisar mais, ajustamos depois.

