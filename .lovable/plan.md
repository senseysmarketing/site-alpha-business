

## Alterar AlphavilleMapSection para fundo claro

### Arquivo: `src/components/AlphavilleMapSection.tsx`

Inverter todo o esquema de cores de escuro para claro, mantendo a mesma estrutura e lógica.

#### Mudanças de cor

| Elemento | Atual (escuro) | Novo (claro) |
|----------|---------------|--------------|
| Section bg | `bg-[hsl(350,60%,5%)]` | `bg-[#F8F8F8]` |
| Subtítulo | `text-white/40` | `text-[#2A070C]/40` |
| Título | `text-white` | `text-[#2A070C]` |
| Mobile cards border | `border-white/15` | `border-[#2A070C]/10` |
| Mobile cards hover | `hover:bg-white/5` | `hover:bg-[#2A070C]/5` |
| Mobile card title | `text-white` | `text-[#2A070C]` |
| Mobile card texts | `text-white/50`, `text-white/80` | `text-[#2A070C]/50`, `text-[#2A070C]/80` |
| Mobile card link | `text-white/70 hover:text-white` | `text-[#2A070C]/70 hover:text-[#2A070C]` |
| SVG map container bg | `bg-white/5` border `border-white/10` | `bg-white` border `border-[#2A070C]/10` |
| SVG strokes | `rgba(255,255,255,0.1)` | `rgba(42,7,12,0.1)` |
| SVG ellipses | `rgba(255,255,255,0.05)` | `rgba(42,7,12,0.05)` |
| SVG text | `rgba(255,255,255,0.25)` | `rgba(42,7,12,0.25)` |
| Pin pulse | `bg-white/10` | `bg-[#2A070C]/10` |
| Pin circle | `bg-white/70`, `bg-white` | `bg-[#2A070C]`, `bg-[#2A070C]` (icon white) |
| Pin icon | `text-[hsl(350,60%,5%)]` | `text-white` |
| Pin label | `text-white/50` | `text-[#2A070C]/50` |
| Tooltip card | `bg-[hsl(350,60%,8%)]` border `border-white/15` | `bg-white` border `border-[#2A070C]/10` shadow-lg |
| Tooltip texts | `text-white`, `text-white/60`, `text-white/40` | `text-[#2A070C]`, `text-[#2A070C]/60`, `text-[#2A070C]/40` |
| Tooltip border-b | `border-white/10` | `border-[#2A070C]/10` |
| Tooltip link | `text-white/70 hover:text-white` | `text-[#2A070C]/70 hover:text-[#2A070C]` |
| Close button | `text-white/50 hover:text-white` | `text-[#2A070C]/50 hover:text-[#2A070C]` |

