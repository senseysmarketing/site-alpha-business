## O que ajustar

### 1. Rodapé (`src/components/Footer.tsx`)
- Remover o span estático `@AlphavilleAB`.
- Transformar `@AlphavilleSP` em um `<a>` clicável apontando para `https://instagram.com/alphaville.sp` (`target="_blank"`, `rel="noopener noreferrer"`, hover sublinhado/claro).
- Envolver o ícone do Instagram no mesmo link para consistência.

### 2. Configurações do banner não persistem (`src/hooks/useSiteSettings.ts`)
**Causa raiz:** consultei a tabela `site_settings` e não existe linha com `key='featured_banner'`. O `save()` atual usa `supabase.update().eq("key", key)` — quando a linha não existe, o update atinge 0 linhas, não retorna erro, mostra "Salvo com sucesso" mas nada é gravado. Por isso os botões somem ao recarregar.

**Correção:**
- Trocar o `update` por `upsert({ key, value, updated_at, updated_by }, { onConflict: "key" })` para criar a linha se ela ainda não existir e atualizá-la quando existir.
- Trocar `.single()` por `.maybeSingle()` na query de leitura para não derrubar o hook quando ainda não há registro (volta `data: null` em vez de erro).

### 3. Dropdown de condomínios não filtra ao digitar (`src/pages/admin/SiteSettings.tsx`)
**Causa raiz:** o `cmdk` filtra apenas pelo `value` literal do `CommandItem`, então digitar "tambore" (sem acento) ou "tamboré 1" às vezes não bate com "Tamboré I" / "Ed. Tamboré 1" porque a busca depende de substring acentuada e ignora variações comuns (acento, número romano vs arábico, prefixos "Ed.", etc.).

**Correção:**
- Passar um `filter` customizado para o componente `Command` do popover de seleção de condomínio que normaliza tanto a query quanto o `value` com o utilitário `normalizeCondoTokens` (já existente em `src/lib/condoMatching.ts`) e retorna `1` quando todos os tokens da query aparecem no candidato, `0` caso contrário. Isso faz o dropdown encontrar "Tamboré I" digitando "tambore 1", "tamboré", "tambore i" etc.
- Manter `CommandItem.value={name}` (não alterar o que é exibido).

### Fora de escopo
- Nenhuma mudança no `FeaturedPropertySection.tsx` (o render já está correto; basta o save persistir).
- Nenhuma alteração no schema do Supabase. A tabela `site_settings` já possui `key` único — o upsert vai funcionar com `onConflict: "key"`. Se por qualquer motivo a constraint não existir, criamos uma migration adicional, mas a verificação confirma a unicidade pelos registros existentes.
