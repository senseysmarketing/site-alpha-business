

## Ajuste — Subir Controles do Hero (Desktop + Mobile)

A SearchBarSection flutuante está cobrindo os controles inferiores do Hero tanto no desktop quanto no mobile (a barra de 1px nem aparece).

### Mudanças em `src/components/HeroSection.tsx`

**1. Controles desktop (barras + Play/Pause)**
- Trocar `bottom-8` por `bottom-24 md:bottom-28` para subir acima da barra de busca flutuante.

**2. Barra de progresso mobile (1px)**
- Trocar `bottom-0` por `bottom-32` para subir acima do card de busca no mobile (que ocupa ~120px na base do Hero).
- Adicionar margem horizontal `left-6 right-6` para não colar nas bordas e ficar visualmente leve.

### Arquivos
| Ação | Arquivo |
|------|---------|
| Editar | `src/components/HeroSection.tsx` (2 ajustes de classe) |

