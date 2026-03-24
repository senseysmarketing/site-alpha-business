

## Ajustes Visuais — Instagram Embeds (Galeria Limpa)

### Mudancas no `src/components/InstitutionalSection.tsx`

**1. InstagramEmbedWithSkeleton — Refinar**

- Remover `captioned` (usar `captioned={false}`) para esconder legendas e cabecalho
- Container pai: `aspect-square overflow-hidden rounded-xl border border-border/50 bg-transparent relative group`
- Embed interno: remover restricoes de max-width, garantir `width="100%"`
- Skeleton com `bg-muted` (cor do site) em vez de branco

**2. Hover overlay**

Adicionar div overlay absoluto sobre cada embed:
```
<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 z-10 pointer-events-none rounded-xl" />
```

**3. Grid container**

Atualizar as `motion.div` do grid para incluir `rounded-xl border border-border/50 bg-transparent` e mover `group` para esse nivel.

### Resumo das mudancas

| Antes | Depois |
|---|---|
| `captioned` (legendas visiveis) | `captioned={false}` (galeria limpa) |
| Sem rounded corners | `rounded-xl border border-border/50` |
| Fundo branco do iframe | `bg-transparent` no container |
| Sem hover | Overlay `bg-black/10` no hover |
| Skeleton padrao | Skeleton com `bg-muted` para harmonia |

### Arquivo unico

`src/components/InstitutionalSection.tsx`

