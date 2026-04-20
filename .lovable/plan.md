

## Ajuste de Layout — Hero Cinematográfica

Reposicionar controles e conteúdo do Hero conforme solicitado.

### Mudanças

**1. Controles inferiores (barras de progresso + Play/Pause) — centralizados**
- Remover `left-12 lg:left-24` do container dos controles desktop.
- Aplicar `left-1/2 -translate-x-1/2` para centralizar horizontalmente no rodapé.
- Mantém `bottom-8`, glassmorphism e estética atuais.

**2. Conteúdo textual — centralizado verticalmente, mantido à esquerda**
- Trocar `flex flex-col justify-end pb-24 md:pb-28` por `flex items-center` (centralização vertical).
- Manter `px-6 md:px-12 lg:px-24` (alinhamento à esquerda).
- Remover o padding inferior que empurrava o texto para baixo.
- O `max-w-3xl` do bloco de texto continua igual.

### Resultado visual
```text
┌─────────────────────────────────────────────┐
│ ←                                         → │
│                                             │
│  TAGLINE                                    │
│  Título Editorial      ← centralizado vert. │
│  Descrição                                  │
│  [Saiba Mais]                               │
│                                             │
│            ▬▬ ▬▬ ▬▬  ▶  ← centralizado horiz│
└─────────────────────────────────────────────┘
```

### Arquivos
| Ação | Arquivo |
|------|---------|
| Editar | `src/components/HeroSection.tsx` (2 ajustes de classe) |

