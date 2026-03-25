

## Feed Instagram Estático com Scraping + Fallback Manual

### Arquitetura

```text
Admin salva URLs → Edge Function tenta extrair og:image → Sucesso: salva thumbnail / Falha: mostra botão upload manual
Frontend renderiza <img> estáticas com object-cover → clique abre post original
```

### 1. Edge Function: `scrape-instagram-thumbnail`

Novo arquivo `supabase/functions/scrape-instagram-thumbnail/index.ts`:
- Recebe `{ urls: string[] }` via POST
- Para cada URL, faz fetch com user-agent de bot e extrai `og:image` via regex nos meta tags
- Retorna `{ results: Array<{ url: string; thumbnail: string | null }> }`
- Se falhar (bloqueio, timeout), retorna `thumbnail: null` para aquele item
- CORS headers padrão

### 2. Alterar estrutura de dados do `instagram_posts`

Migrar de `{ urls: string[] }` para `{ posts: Array<{ url: string; thumbnail: string }> }`.

Isso permite armazenar URL original + thumbnail lado a lado.

### 3. Admin — `src/pages/admin/SiteSettings.tsx`

Reescrever o bloco "Destaques Social" (Block 7):

- **Estado**: mudar de `string[]` para `Array<{ url: string; thumbnail: string; status: 'pending' | 'success' | 'failed' }>`
- **Ao salvar**: chamar a edge function para URLs sem thumbnail, atualizar status de cada post
- **UI por post** (6 slots em grid 2 colunas):
  - Input da URL do Instagram
  - Preview da thumbnail ao lado (pequena, 48px)
  - Badge de status: verde "Capturado" / amarelo "Pendente" / vermelho "Falhou — envie manualmente"
  - Quando status = `failed`: mostrar `PhotoDrop` (já existente no componente) para upload manual
  - Botão "Recarregar Thumbnails" no topo do bloco para re-tentar todas

### 4. Frontend — `src/components/InstitutionalSection.tsx`

Substituir completamente o `InstagramEmbed` por imagens estáticas:

- Remover import de `InstagramEmbed` e `react-social-media-embed`
- Remover componente `InstagramEmbedWithSkeleton`
- Buscar dados como `{ posts: Array<{ url, thumbnail }> }` em vez de `{ urls: string[] }`
- Cada post renderizado como:

```tsx
<a href={post.url} target="_blank" rel="noopener noreferrer"
   className="group relative block overflow-hidden aspect-square border-[0.5px] border-border/40">
  <img src={post.thumbnail} alt="" 
       className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
  <div className="absolute inset-0 bg-[#2A070C]/10 opacity-0 group-hover:opacity-100 
       transition-opacity duration-300 flex items-center justify-center">
    <Instagram size={20} className="text-white" strokeWidth={1.5} />
  </div>
</a>
```

- Bordas retas (`rounded-none`), borda `0.5px`
- Hover: `scale-[1.03]` + overlay Bordeaux 10% + ícone Instagram
- Placeholder para slots sem thumbnail: gradient cashmere/greige (como atual)

### 5. Remover dependência

Remover `react-social-media-embed` do `package.json`.

### Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/functions/scrape-instagram-thumbnail/index.ts` | Criar |
| `src/pages/admin/SiteSettings.tsx` | Editar bloco Instagram + estado |
| `src/components/InstitutionalSection.tsx` | Reescrever grid |
| `package.json` | Remover `react-social-media-embed` |

