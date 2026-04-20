

## Footer — Fundo Cinza, Botão Arredondado e Logo Atualizada

Três ajustes pontuais no `Footer.tsx` para alinhar à paleta clara do site, ao padrão de botões arredondados e à nova identidade visual da logo já usada no Header.

### 1. Fundo + inversão de contraste

Trocar `bg-[#2A070C]` por `bg-muted/50` (cinza arquitetônico padrão do site). Como o fundo agora é claro, todos os textos migram de branco para tons foreground/muted:

- Wrapper: `text-white/80` → `text-foreground/80`
- Links de navegação: `text-white/70 hover:text-white` → `text-foreground/70 hover:text-foreground`
- Títulos em negrito (Alpha Business, Rafael Albuquerque): `text-white` → `text-foreground`
- Endereço/telefones: `text-white/70` → `text-muted-foreground`
- Borda divisória: `border-white/10` → `border-border`
- Ícone Instagram + handles: `text-white` → `text-foreground`
- Copyright e texto institucional: `text-white/50` → `text-muted-foreground/70`
- CRECI: `text-white/60` → `text-muted-foreground`

### 2. Logo — usar a nova identidade do Header

Trocar o import e o `<img>`:
- De: `import logoAlpha from "@/assets/logo-alpha.png"` com classe `h-8 brightness-0 invert`
- Para: `import logoRafael from "@/assets/logo-rafael.png"` (mesma logo do Header), classe `h-8 md:h-10 w-auto` (sem filtro CSS — mantém cor original sobre fundo claro).
- Atualizar `alt` para `Rafael Albuquerque`.

### 3. Botão "Anuncie seu imóvel"

Atualmente: `bg-white text-[#2A070C] rounded-none` (quadrado, claro sobre fundo escuro).

Novo padrão dark/arredondado (mesmo de `ContactSection` e `FeaturedPropertySection`):
- `bg-foreground text-background hover:bg-foreground/90`
- `rounded-md`
- Manter `size="sm"`, `text-xs uppercase tracking-wider font-semibold`.

### Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `src/components/Footer.tsx` (fundo cinza, textos foreground/muted, logo nova, botão dark arredondado) |
| Atualizar | `mem://features/footer/footer-standard` (refletir nova paleta clara + logo Rafael) |

### Observações

- Sem mudanças em tokens globais ou em outras seções.
- Logo do rodapé fica idêntica à do Header — identidade unificada em ambos os extremos da página.
- Demais blocos de conteúdo (endereço, redes sociais, copyright) mantêm a mesma estrutura, apenas com cores invertidas para o fundo claro.

