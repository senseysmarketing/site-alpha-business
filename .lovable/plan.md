

## Ajuste mobile da caixa de pesquisa

### Problemas
1. O título "Encontre seu imóvel com o Rafa IA" quebra em 2 linhas no mobile (390px)
2. O placeholder "Descreva o imóvel dos seus sonhos..." está cortando

### Mudanças no arquivo `src/components/SearchBarSection.tsx`

**Título (linha 171-173)**
- Reduzir fonte no mobile: `text-base md:text-xl` (de `text-lg md:text-xl`)
- Adicionar `whitespace-nowrap` para forçar linha única

**Padding do card (linha 165)**
- Reduzir padding mobile: `p-4 md:p-8` (de `p-6 md:p-8`)

**Input row (linha 190)**
- Reduzir gap e padding mobile: `gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3`

**Placeholder (linha 202)**
- Encurtar para mobile: `"Descreva..."` — usar atributo dinâmico ou simplesmente trocar para um texto mais curto como `"Descreva..."` que caiba no espaço

**Botão Buscar (linha 205-212)**
- Reduzir padding mobile: `px-4 md:px-6`

