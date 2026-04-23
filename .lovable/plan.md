

## Sidebar do Imóvel — Indicador "Responde rapidamente"

Adicionar um micro-sinal de confiança no card do corretor (`PropertySidebar`), logo abaixo do título do corretor, indicando responsividade rápida.

### Mudança em `src/components/property/PropertySidebar.tsx`

Abaixo do bloco nome + título do corretor (e antes dos botões "Falar com X" / "Agendar visita"), inserir uma linha com:

- Ícone `Zap` (lucide-react), 12px, `strokeWidth={1.5}`, em verde discreto (`text-[#25D366]` — mesmo verde do WhatsApp já usado no projeto, mantendo coerência visual).
- Texto: **"Responde em até 15 minutos"** — mais concreto que "rapidamente", reforça expectativa clara.
- Tipografia: `text-body text-[11px] tracking-wide text-muted-foreground`.
- Pequeno "pulse dot" verde antes do ícone (um `<span>` 6px com `bg-[#25D366]` + `animate-pulse`) para sinalizar "ativo agora", padrão usado em apps de mensageria.

Layout final do micro-bloco:
```
● ⚡ Responde em até 15 minutos
```

Alinhamento: `flex items-center gap-2`, margin `mt-1.5 mb-4` para separar do nome acima e dos botões abaixo sem quebrar a densidade do card.

### Por que essa abordagem

- Reaproveita o verde WhatsApp já presente no projeto (sem nova cor).
- Mensagem específica ("15 minutos") cria mais confiança que "rapidamente" genérico.
- Pulse dot é padrão visual reconhecível de "online/ativo".
- Não altera estrutura nem hierarquia do card — adição puramente aditiva.

### Arquivos editados

- `src/components/property/PropertySidebar.tsx`

