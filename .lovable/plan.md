

## Problema: URLs com Entidades HTML (`&amp;`)

As thumbnails estão com imagem quebrada porque as URLs extraídas do HTML do Instagram contêm `&amp;` em vez de `&`. Por exemplo:

```
...s640x640_tt6&amp;_nc_cat=106&amp;ccb=7-5...
```

O browser não consegue carregar a imagem porque a URL está malformada. Isso acontece porque o `og:image` no HTML do Instagram usa entidades HTML nos atributos, e o regex extrai o texto cru sem decodificar.

Também há um segundo problema: as URLs do CDN do Instagram expiram após algumas horas, então mesmo corrigindo a decodificação, as imagens podem parar de funcionar depois. A solução robusta seria fazer download da imagem e salvar no Supabase Storage, mas por ora vamos corrigir o problema imediato.

### Correção

**`supabase/functions/scrape-instagram-thumbnail/index.ts`** — Adicionar função `decodeHtmlEntities` que converte `&amp;` → `&`, `&lt;` → `<`, `&gt;` → `>`, `&quot;` → `"`, `&#39;` → `'`. Aplicar essa função em cada thumbnail extraída antes de retornar.

```typescript
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
```

Aplicar nos 3 pontos de retorno (ogMatch, twMatch, ogRev): `return { url, thumbnail: decodeHtmlEntities(ogMatch[1]) }`.

Após editar, fazer re-deploy da edge function.

### Nota sobre expiração

As URLs do CDN do Instagram expiram (geralmente em horas/dias). Se no futuro as imagens pararem de carregar novamente, será necessário implementar download + upload para Supabase Storage. Por agora, o admin pode clicar "Recarregar Thumbnails" para obter URLs frescas.

### Arquivo
`supabase/functions/scrape-instagram-thumbnail/index.ts` — edição única + re-deploy

