## Problema
No admin (`/admin/configuracoes` → "Banner de Destaque (Condomínios)") o link do botão é um campo de texto livre (`href`). Hoje os defaults usam `/busca?condominio=tambore-1` mas a `SearchResults` espera o parâmetro `condominium` com o **nome canônico** do condomínio (ex.: "Tamboré 1"). Resultado: clicar nos botões abre busca filtrada por um valor inexistente e a página mostra imóveis aleatórios. O admin permite digitar qualquer URL, então o erro se repete.

## Solução
Trocar o campo de URL livre por um **seletor de condomínio com busca** (alimentado por `useCondoList()`, a mesma fonte usada nos demais filtros). O label do botão continua livre/personalizável.

## Arquivos
- `src/pages/admin/SiteSettings.tsx`
- `src/components/FeaturedPropertySection.tsx`

## Mudanças

### 1) Modelo de dados (`FeaturedBannerSettings.buttons`)
Aceitar duas formas (compatível com dados antigos no Supabase):
```ts
buttons: { label: string; condominium?: string; href?: string }[]
```
- Novo campo preferido: `condominium` (nome canônico exato do DB).
- `href` mantido apenas para leitura/migração (entradas antigas).

### 2) Admin — `SiteSettings.tsx` (bloco "Banner de Destaque")
- Importar `useCondoList` e o `Combobox`/`Popover + Command` (shadcn já tem `Command` no projeto, usado em outros filtros com pesquisa).
- Substituir o segundo `<Input>` (placeholder `/busca?condominio=...`) por um **Combobox de condomínio com campo de busca**:
  - Trigger: botão exibindo o condomínio selecionado ou "Selecione o condomínio".
  - Popover com `<Command>` → `<CommandInput placeholder="Buscar condomínio..." />`, `<CommandEmpty>`, lista de `CommandItem` com todos os condomínios ativos (`useCondoList().condos`).
  - Selecionar grava `condominium` (nome canônico) e remove `href` antigo no mesmo item.
- Manter o `<Input>` de label do botão (texto livre, totalmente personalizável). Reforçar isso com placeholder "Texto do botão (ex.: Tamboré I)" e helper text curto: "O link é montado automaticamente a partir do condomínio selecionado."
- Migração no carregamento (`useEffect` que popula `featuredForm`): para cada botão antigo, se vier só `href`, extrair o valor do parâmetro `condominium` ou `condominio` da URL e resolver via `resolveCanonicalCondo(value, condos)`. Se resolver, gravar em `condominium`; senão, deixar vazio para o usuário escolher.
- Validação leve no `addFeaturedButton`/save: itens sem `condominium` ficam destacados com texto auxiliar "Selecione um condomínio para ativar este botão" (não bloqueia salvar, apenas avisa).
- Atualizar `DEFAULT_FEATURED.buttons` para 3 entradas com `label` preenchido e `condominium: ""` (forçando seleção consciente em projetos novos).

### 3) Renderização — `FeaturedPropertySection.tsx`
- Atualizar tipo de `buttons` para `{ label: string; condominium?: string; href?: string }`.
- Construir o `to` no map:
  - Se `c.condominium` existir → `to={`/busca?condominium=${encodeURIComponent(c.condominium)}`}`.
  - Senão, fallback para `c.href || "/busca"`.
- Esconder botões sem destino válido (sem `condominium` e sem `href`).
- Atualizar `DEFAULT_BUTTONS` para usar `condominium` com nomes que existam no DB (ou deixar lista vazia até o admin configurar — preferível **lista vazia** para não mostrar links quebrados).

## Fora do escopo
- Não alterar `SearchResults`, nem o esquema do Supabase.
- Não tocar nos outros blocos (Menu de Condomínios, Lifestyle, etc.) — apenas o "Banner de Destaque (Condomínios)".
- Não criar novo componente Combobox global; reaproveitar `Command` + `Popover` já presentes (padrão usado em filtros).