

## Cabeçalho — Ajuste Responsivo para Tablet (iPad)

No tablet (768px–1024px), o menu desktop aparece todos os 6 itens + botão "Anuncie seu imóvel" + logo na mesma linha, ficando apertado e quebrando "FALE CONOSCO" em duas linhas dentro do botão pill.

### Estratégia

Reservar o menu horizontal completo apenas para telas grandes (`lg:` = 1024px+). Em tablets (768px–1023px), usar o menu hambúrguer (já existente) que abre o painel mobile.

### Mudanças em `src/components/Header.tsx`

| Elemento | Atual | Novo |
|---|---|---|
| Nav horizontal | `hidden md:flex` | `hidden lg:flex` |
| Botão "Anuncie seu imóvel" (desktop) | `hidden md:flex` | `hidden lg:flex` |
| Botão hambúrguer | `md:hidden` | `lg:hidden` |
| Painel mobile expandido | `md:hidden` | `lg:hidden` |
| Gap entre itens do nav | `gap-10` | `gap-6 xl:gap-10` (respiro extra em telas muito largas, mais compacto em laptops 1024–1279) |
| Botão "Anuncie": `whitespace-nowrap` | adicionar para garantir que nunca quebre |

### Resultado por breakpoint

- **Mobile (<768px)**: hambúrguer (igual hoje).
- **Tablet/iPad (768–1023px)**: hambúrguer + logo (limpo, sem aperto).
- **Laptop (1024–1279px)**: nav completo com `gap-6` (cabe confortavelmente).
- **Desktop grande (≥1280px)**: nav completo com `gap-10` (respiro generoso).

### Observações

- Sem mudança visual no mobile nem no desktop grande.
- Painel mobile já tem todos os itens + CTA — funciona idêntico em iPad.
- Atualizar `mem://features/header/navigation` para refletir o novo breakpoint `lg:` como ponto de virada.

