

## Refatorar "Redes Sociais" + Persistência Permanente das Thumbnails

Dois objetivos: (1) alinhar visualmente a seção `InstitutionalSection` ao print enviado e (2) eliminar a perda de thumbnails do Instagram, baixando e guardando cada imagem em Supabase Storage (URL permanente) em vez de armazenar a URL temporária do CDN do Instagram.

---

### Parte 1 — Visual da seção (InstitutionalSection.tsx)

Conforme print:

- **Header em uma linha** (`flex items-center justify-between mb-6`):
  - Esquerda: `<h2>` em Noto Serif, `text-2xl font-normal`, texto `Redes Sociais` (sem o eyebrow/tagline atual nem o subtítulo "Siga-nos no Instagram").
  - Direita: bloco `Siga-nos:` seguido de **dois handles** lado a lado — `@AlphavilleSP` e `@AlphavilleAB` — cada um link clicável. Ícone Instagram à esquerda do "Siga-nos:". Tudo em Inter `text-sm`, cor `text-foreground/80`.
- **Grid de cards** (mantido `grid-cols-1 md:grid-cols-3 gap-6`):
  - Cards com cantos `rounded-lg`, sem overlay no hover (apenas leve `group-hover:scale-[1.02] transition-transform`), aspect `aspect-[4/5]`.
  - **Selo de vídeo** no canto superior direito de cada card: `<div className="absolute top-3 right-3 w-7 h-7 rounded-md bg-white/85 flex items-center justify-center"><Play className="w-3.5 h-3.5 text-foreground" /></div>` (mostrado em todos os cards conforme print; pode ficar permanente).
- **Remover** o link "Seguir no Instagram" abaixo do grid (não está no print) — o CTA agora vive no header.
- Conteúdo de handles: usar `contactData.instagram` como handle principal e adicionar suporte a um segundo handle. Para simplicidade, se settings só tiver um, exibir os dois fixos `@AlphavilleSP` e `@AlphavilleAB` como defaults; quando admin preencher, sobrescreve.

---

### Parte 2 — Persistência permanente das thumbnails

**Causa raiz**: o scraper guarda a URL `og:image` do Instagram (CDN `scontent-*.cdninstagram.com`), que expira em algumas horas/dias. Quando expira, o `<img>` quebra e o admin precisa "recarregar" no painel.

**Solução**: ao fazer scrape, baixar a imagem dentro da Edge Function e fazer upload em um **bucket público do Supabase Storage** (`instagram-thumbnails`). Retornar a URL pública do bucket — que nunca expira.

#### 2.1 Migration — bucket de storage
- Criar bucket público `instagram-thumbnails` (idempotente: `on conflict (id) do nothing`).
- Policies:
  - `select`: público (`true`).
  - `insert/update/delete`: apenas service_role (Edge Function usa service key, então não precisa policy adicional — mas deixar apenas admin via `has_role(auth.uid(),'admin')` para qualquer cliente).

#### 2.2 Edge Function `scrape-instagram-thumbnail` — atualizar
- Após extrair a URL do `og:image`, **baixar o binário** (`fetch(thumbUrl)`).
- Detectar `content-type` (default `image/jpeg`).
- Gerar nome determinístico baseado no hash do `url` do post (ex.: `crypto.subtle.digest("SHA-1", url)` → hex curto → `${hash}.jpg`). Determinístico = re-scrapes sobrescrevem o mesmo arquivo, sem lixo.
- Fazer `upload` no bucket usando o `SUPABASE_SERVICE_ROLE_KEY` (já disponível no ambiente das Edge Functions) com `{ upsert: true, contentType }`.
- Construir `publicUrl = ${SUPABASE_URL}/storage/v1/object/public/instagram-thumbnails/${filename}`.
- Retornar `{ url, thumbnail: publicUrl }` em vez da URL CDN.
- Se upload falhar, fallback: retornar a URL CDN original (degrade gracioso).

#### 2.3 Comportamento no painel admin
- Sem mudanças na UI. `handleSaveInsta` continua chamando a função, mas agora a URL salva em `site_settings.instagram_posts` é a permanente do bucket.
- `handleReloadThumbnails` (botão "recarregar") continua útil para forçar atualização caso o admin queira refletir uma nova capa do post.

#### 2.4 Migração das URLs já salvas
- Em `InstitutionalSection`, quando uma `<img>` falhar (`onError`), **não** fazer nada visualmente além de manter o gradient placeholder — evita layout quebrado. (Não vamos disparar re-scrape automático no front para não causar custos/loops; admin recarrega manualmente uma vez para migrar.)
- Opcionalmente: remover o `decodeHtmlEntities` (URLs do Supabase Storage não têm entities), mas mantê-lo é inócuo.

---

### Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `src/components/InstitutionalSection.tsx` (novo header de 1 linha, dois handles, badge de play, sem CTA inferior, fallback `onError`) |
| Editar | `supabase/functions/scrape-instagram-thumbnail/index.ts` (download + upload no bucket + retorno de URL permanente) |
| Criar | Migration SQL: bucket `instagram-thumbnails` público + policies |
| Atualizar | `mem://features/institutional/social-media-static-feed` (refletir novo visual + persistência via Storage) |

### Observações

- URLs antigas que ainda funcionam continuam renderizando; quando expirarem, o admin clica "Recarregar" uma vez e elas migram automaticamente para o bucket.
- Não há custo recorrente: imagens ficam no Storage do Supabase indefinidamente.
- Nenhuma alteração em tokens globais ou em outras seções.

