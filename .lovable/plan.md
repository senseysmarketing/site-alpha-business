

## Ajuste de Tipografia e Organização do Rodapé

### Mudanças no `src/components/Footer.tsx`

**Tipografia e hierarquia visual:**
- Título "Alpha Business - Imobiliária Alphaville" → `uppercase tracking-wider text-xs font-bold text-white`
- Endereço e contatos → `text-xs text-white/70` com espaçamento consistente
- "Rafael Albuquerque" → `font-bold text-white uppercase tracking-wider text-xs`
- "WHATSAPP:" já está em maiúsculo, manter `text-xs text-white/70`
- Texto redes sociais → `text-xs text-white/70`
- Instagram handles → `text-xs text-white`
- Copyright e disclaimer → `text-[11px] text-white/50`
- CRECI → `text-xs text-white/60`

**Layout mobile (390px):**
- No mobile, o grid de 2 colunas vira 1 coluna (já funciona com `grid-cols-1 md:grid-cols-2`)
- A coluna direita (redes + legal) fica abaixo da coluna esquerda (endereço)
- Garantir que o conteúdo todo fique alinhado à esquerda no mobile, sem centralização

**Layout desktop:**
- Manter as 2 colunas lado a lado
- Nav bar superior centralizada

**Arquivo:** `src/components/Footer.tsx`

