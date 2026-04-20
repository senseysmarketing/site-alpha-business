

## Página de Detalhes do Imóvel — Alinhamento de Identidade Visual

Padronizar a página `/imovel/:id` com a mesma linguagem visual da home: botões arredondados (pill), tipografia editorial dos títulos e cards de imóveis idênticos aos da seção "Novidades".

### 1. Botões arredondados (pill)

Trocar todos os botões/CTAs da página para `rounded-full`:

| Local | Atual | Novo |
|-------|-------|------|
| WhatsApp (header do imóvel, desktop) | sem radius | `rounded-full` |
| "Agendar visita" (header desktop) | sem radius | `rounded-full` |
| WhatsApp (sticky bar mobile) | `rounded-sm` | `rounded-full` |
| "Agendar visita" (sticky bar mobile) | `rounded-sm` | `rounded-full` |
| Botões da `PropertySidebar` (Falar com / Agendar visita) | verificar e ajustar | `rounded-full` |
| Botões de controle da `PropertyGallery` ("Assistir tour", "Explorar todas as fotos") | verificar | `rounded-full` |
| Botões do `PhotoLightbox` (navegação/fechar) | verificar | `rounded-full` |
| Botões do `ScheduleVisitModal` e `VideoTourModal` (CTAs principais) | verificar | `rounded-full` |

Tags de metadados (CASA, ALPHAVILLE, CÓD) e chips de Diferenciais permanecem com `rounded-sm` — são chips, não botões.

### 2. Tipografia dos títulos

Alinhar com o padrão editorial da home (ex: `NewArrivalsSection`, `LifestyleSection`):

- **H1 do imóvel** (`Residência Altos de Alphaville`): manter `text-display` mas alinhar peso/tracking ao padrão da home — `text-3xl md:text-5xl font-light tracking-tight` (atual: `text-3xl md:text-4xl font-light tracking-wide`).
- **H2 das seções internas** (`Sobre o Imóvel`, `Diferenciais`, `Detalhes do Imóvel`, `Bairro`, `Imóveis que você também pode gostar`): unificar em `text-display text-2xl md:text-3xl font-light tracking-tight` (hoje variam entre `text-2xl` e `text-3xl`).
- **Preço**: manter `text-display` mas mudar `font-semibold` → `font-light` para combinar com a estética leve dos preços da home (cards usam `font-mono font-medium`; o preço hero do detalhe permanece display, só mais leve).

### 3. Cards de "Imóveis que você também pode gostar"

Substituir o card inline atual por **reutilização do componente `PropertyCard`** já usado nos resultados de busca/Bento (mesmo formato dos cards da home):

- Importar `PropertyCard` de `src/components/search/PropertyCard.tsx`.
- Mapear `similarProperties` para o shape esperado (já compatível com `mockProperties`).
- Ajustar o container: trocar carrossel horizontal `overflow-x-auto` por **grid responsivo** (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`), igual ao padrão da home.
- Se `PropertyCard` não estiver pronto para uso fora do contexto de busca, criar um wrapper mínimo que use o **mesmo markup** dos cards do `NewArrivalsSection` (badge de tag, título display, specs com ícones finos, preço em `font-mono`).

**Decisão**: priorizar reaproveitar exatamente o card do `NewArrivalsSection` (mais próximo visualmente da home) — verificar o componente exato em uso lá e replicar/extrair.

### 4. Sidebar do corretor

- Botão "Falar com {nome}" mantém o verde WhatsApp mas ganha `rounded-full`.
- Botão "Agendar visita" (outline) também `rounded-full`.
- Tipografia do nome do corretor: `text-display font-light` (já próxima, conferir).

### Arquivos a editar

| Ação | Arquivo |
|------|---------|
| Editar | `src/pages/PropertyDetail.tsx` (botões → pill, títulos → tracking-tight, grid de similares + uso do card padrão) |
| Editar | `src/components/property/PropertySidebar.tsx` (botões → `rounded-full`) |
| Editar | `src/components/property/PropertyGallery.tsx` (botões "Assistir tour" / "Explorar fotos" → `rounded-full`) |
| Verificar/Editar | `src/components/property/PhotoLightbox.tsx` (botões de controle) |
| Verificar/Editar | `src/components/property/ScheduleVisitModal.tsx` e `VideoTourModal.tsx` (CTAs principais) |
| Atualizar | `mem://features/property-detail/layout` (refletir botões pill, tipografia tracking-tight, cards similares = padrão home) |

### Observações

- Sem mudanças em tokens globais — apenas classes utilitárias por componente.
- Chips de metadados (tags pequenas) mantêm `rounded-sm` — são marcadores, não controles.
- A grid responsiva substitui o scroll horizontal nos similares; se o usuário preferir manter carrossel, ajustamos depois.

