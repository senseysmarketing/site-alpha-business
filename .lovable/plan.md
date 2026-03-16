

## Ajuste Visual das Colunas Kanban

### Mudanças em `src/pages/admin/CRM.tsx`

**Coluna container** (linha 118-120):
- Trocar `rounded-xl` por `rounded-sm` (mais quadrado, consistente com `--radius: 0.25rem`)
- Trocar `bg-muted/30` por `bg-white` para fundo branco igual às outras telas
- Trocar `bg-primary/5` (dragover) por `bg-white border-primary/20`
- Adicionar `border border-border/40` para definição sutil

**Column header** (linha 127):
- Trocar `rounded-t-xl` por `rounded-t-sm`
- Trocar `bg-card/70` por `bg-white/90`

**Cards area** — manter como está, já usa `bg-card` nos cards individuais.

Resultado: colunas brancas, cantos mais retos, padrão visual consistente com as demais telas admin.

