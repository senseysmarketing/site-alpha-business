

## Reduzir Espaçamento Vertical Entre Seções da Home

Atualmente as seções da home usam `py-20 md:py-32` (80px / 128px) — muito generoso, criando "buracos" entre blocos. Vou reduzir para um ritmo mais coeso, mantendo a respiração editorial mas aproximando os conteúdos.

### Novo padrão de padding vertical

Trocar em todas as seções da home:
- **De**: `py-20 md:py-32` (80px / 128px)
- **Para**: `py-12 md:py-20` (48px / 80px)

Isso reduz ~40% do espaço entre seções, mantendo respiração suficiente para hierarquia editorial.

### Arquivos a editar

| Arquivo | Padding atual | Novo padding |
|---------|---------------|--------------|
| `src/components/NewArrivalsSection.tsx` | `py-20 md:py-32` | `py-12 md:py-20` |
| `src/components/LifestyleSection.tsx` | `py-20 md:py-32` | `py-12 md:py-20` |
| `src/components/FeaturedPropertySection.tsx` | (verificar) | `py-12 md:py-20` |
| `src/components/InstitutionalSection.tsx` | (verificar) | `py-12 md:py-20` |
| `src/components/TeamSection.tsx` | (verificar) | `py-12 md:py-20` |
| `src/components/AlphavilleMapSection.tsx` | `py-20 md:py-32` | `py-12 md:py-20` |
| `src/components/ContactSection.tsx` | `py-20 md:py-32` | `py-12 md:py-20` |

Para seções com fundo destacado (Bordeaux/dark, ex: `FeaturedPropertySection`, `PrivateCollectionSection`) manter padding um pouco maior — `py-16 md:py-24` — para que o bloco escuro ainda tenha presença visual.

### `SearchBarSection`

A barra de busca flutuante já tem posicionamento próprio (negative margin sobre o Hero). Não alterar.

### Observações

- Sem mudanças em tokens globais ou em estrutura interna das seções.
- Apenas o `py-*` da tag `<section>` raiz de cada componente é ajustado.
- Headers internos (margin-bottom dos títulos) permanecem inalterados — o ritmo dentro de cada seção continua o mesmo, só o espaço **entre** seções diminui.
- Atualizar `mem://style/visual-identity` com o novo padrão de espaçamento entre seções (`py-12 md:py-20` padrão; `py-16 md:py-24` para seções com fundo escuro).

