

## Feed Instagram Manual — Admin + Frontend

### Passo 1 — Novo setting no Supabase

Criar migration inserindo nova chave `instagram_posts` na tabela `site_settings`:

```sql
INSERT INTO public.site_settings (key, value) VALUES
  ('instagram_posts', '{"urls": ["", "", "", "", "", ""]}'::jsonb)
ON CONFLICT (key) DO NOTHING;
```

### Passo 2 — Admin: Campos de URL no SiteSettings

**`src/pages/admin/SiteSettings.tsx`**

Adicionar novo bloco "Destaques Social" abaixo do bloco "Contato e Redes" (bloco 6):
- Novo hook `useSiteSettings<{urls: string[]}>('instagram_posts')`
- 6 campos de Input para URLs de posts do Instagram
- Layout: grid 2 colunas, labels "Post 1" a "Post 6"
- Placeholder: `https://www.instagram.com/p/...`
- Botao "Salvar" padrao do SettingsBlock

Adicionar interface e estado correspondentes.

### Passo 3 — Dependencia

Instalar `react-social-media-embed`.

### Passo 4 — Frontend: InstitutionalSection

**`src/components/InstitutionalSection.tsx`**

- Importar `useSiteSettings` com key `instagram_posts`
- Importar `InstagramEmbed` de `react-social-media-embed`
- Importar `Skeleton` de `@/components/ui/skeleton`
- Substituir o grid de 6 blocos cinza placeholder por:
  - Se URL preenchida: `<InstagramEmbed url={url} width="100%" captioned />` envolvido em container `aspect-square overflow-hidden`
  - Se URL vazia: manter o gradient placeholder atual
  - Skeleton de loading enquanto o embed carrega (state `loaded` por post)
- Manter grid `grid-cols-2 gap-2` e animacoes existentes

### Arquivos

| Arquivo | Acao |
|---|---|
| Migration SQL | Inserir key `instagram_posts` |
| `src/pages/admin/SiteSettings.tsx` | Adicionar bloco "Destaques Social" com 6 inputs |
| `src/components/InstitutionalSection.tsx` | Substituir placeholders por `InstagramEmbed` |

