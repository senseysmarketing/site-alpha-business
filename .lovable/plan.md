

## Lifestyle Section — Cards Clicáveis + Modelo de Categorias

Hoje a seção "Encontre propriedades que representam seu estilo de vida" tem 3 cards (configuráveis em `Admin → Identidade`) com **título + imagem apenas** — não há clique, não há vínculo com imóveis, e não existe campo "categoria de lifestyle" no cadastro de imóveis.

Vou tornar os cards clicáveis/arrastáveis e propor o modelo completo de categorização.

---

### Parte 1 — Tornar cards clicáveis e arrastáveis (rápido)

Em `src/components/LifestyleSection.tsx`:

1. **Adicionar campo `link`** em cada categoria do tipo `LifestyleCategory` (`title`, `image`, `link`).
2. **Envolver o card num `<Link to={cat.link}>`** com `draggable={false}` na imagem para não conflitar com o drag do Embla.
3. **Cursor**: já está `cursor-grab active:cursor-grabbing` — manter, mas adicionar `hover:shadow-md` e leve `group-hover:scale-[1.02]` no card todo (igual ao `NewArrivalsSection`).
4. **Embla**: já está configurado com `dragFree: true` — funciona em desktop e mobile. Não muda nada.
5. **Fallback**: se `cat.link` estiver vazio, link aponta para `/busca` sem filtro.

### Parte 2 — Modelo de Categorias de Lifestyle

**Hoje não existe** vínculo entre os cards de lifestyle e os imóveis. Os cards são puramente editoriais (texto + imagem). Para fazer o filtro funcionar, há duas estratégias:

#### Opção A — Categoria via TAG (recomendada, simples)

Imóveis já têm um campo `tags` (array de strings) usado para "Diferenciais" (ex: `Piscina`, `Vista`, `Smart Home`). Reutilizar:

- Cada card de Lifestyle no admin ganha um campo extra: **"Tag de filtro"** (ex: `refugio`, `assinado`, `familia`).
- O link gerado vira `/busca?tag=refugio`.
- Na página `/busca`, adicionar suporte ao query param `tag` que filtra `properties.tags @> [tag]`.
- **Como criar nova categoria**: admin adiciona/edita um card no painel de Identidade → escolhe um nome de tag → no cadastro do imóvel marca essa mesma tag em "Diferenciais/Tags".

**Vantagens**: zero migração SQL, reaproveita o que já existe, admin 100% no controle.
**Desvantagens**: tag é texto livre — risco de digitar errado (`refugio` vs `refúgio`). Mitigação: sugestões/autocomplete no admin baseado em tags já existentes.

#### Opção B — Campo dedicado `lifestyle_category` (estruturado)

- Nova coluna `lifestyle_categories text[]` na tabela `properties`.
- Nova tabela `lifestyle_categories` (id, slug, label, image) gerenciada no admin.
- Cadastro de imóvel ganha um multi-select de categorias.
- Cards do home leem direto da tabela `lifestyle_categories`.

**Vantagens**: dados estruturados, sem risco de typo, escalável.
**Desvantagens**: migração SQL, mais código, mais telas no admin.

---

### Recomendação

**Ir de Opção A agora** (rápida, sem migração) e migrar para B se a operação crescer. A estrutura do admin atual (`site_settings.lifestyle_categories`) já suporta adicionar o campo `tag` sem mudar schema.

### Escopo desta entrega (Opção A)

| Ação | Arquivo |
|------|---------|
| Editar | `src/components/LifestyleSection.tsx` — cards viram `<Link>`, leem `cat.link` ou montam `/busca?tag={cat.tag}` |
| Editar | `src/pages/admin/SiteSettings.tsx` (ou onde edita `lifestyle_categories`) — adicionar input "Tag de filtro" por card + sugestão "Como cadastrar: marque essa tag nos Diferenciais do imóvel" |
| Editar | `src/pages/SearchResults.tsx` — ler `?tag=` do `useSearchParams` e filtrar imóveis por tag |
| Editar | `src/pages/admin/PropertyForm.tsx` — no campo de tags/diferenciais, mostrar como sugestão as tags usadas pelos cards de lifestyle (autocomplete a partir de `site_settings.lifestyle_categories`) |
| Atualizar | `mem://features/lifestyle/layout-content` — refletir o novo comportamento clicável + modelo por tag |

### Como criar uma nova categoria (fluxo final)

1. **Admin → Identidade → Lifestyle**: adicionar/editar card (título, imagem, **tag**, ex: `praia`).
2. **Admin → Imóveis → Editar imóvel**: marcar a tag `praia` no campo Diferenciais.
3. **Home**: card aparece e leva para `/busca?tag=praia`, que mostra todos os imóveis com essa tag.

### Observações

- Mantém retrocompatibilidade: cards sem `tag` continuam funcionando (link cai em `/busca`).
- Drag do carrossel coexiste com o link: Embla intercepta o drag; clique simples navega.
- Sem migração SQL, sem nova dependência.

