

## Ajuste Visual dos Embeds do Instagram — Bordas Retas + Crop Centralizado

### Mudancas no `src/components/InstitutionalSection.tsx`

**1. InstagramEmbedWithSkeleton — Refatorar**

- Bordas: trocar `rounded-xl` por `rounded-sm` (2px) em todos os elementos (container, skeleton, overlay)
- Fundo: `bg-[#F8F8F8]` (off-white do site) no container e skeleton
- Crop centralizado do iframe: usar posicionamento absoluto no container do embed para simular `object-fit: cover` — iframe com `absolute inset-[-20%] w-[140%] h-[140%]` dentro de container `relative overflow-hidden`, forçando crop central e eliminando barras pretas/cabeçalhos brancos
- Manter `captioned={false}`
- Hover: remover overlay escuro, adicionar `hover:scale-[1.02] transition-transform duration-500` no container

**2. Placeholders vazios**

- Trocar `rounded-xl` por `rounded-sm` nos placeholders gradient
- Mesmo hover `scale-[1.02]`

**3. Estrutura do embed com crop**

```
<div className="aspect-square overflow-hidden rounded-sm border border-border/40 bg-[#F8F8F8] relative group hover:scale-[1.02] transition-transform duration-500">
  {!loaded && <Skeleton className="absolute inset-0 bg-[#F8F8F8] rounded-sm" />}
  <div className="absolute inset-[-30%] w-[160%] h-[160%] [&_iframe]:!max-w-none [&_iframe]:!border-none">
    <InstagramEmbed url={url} width="100%" captioned={false} />
  </div>
</div>
```

A tecnica de `inset-[-30%]` + `w-[160%] h-[160%]` faz o iframe "sangrar" para fora do container, e o `overflow-hidden` do pai corta tudo que excede o quadrado — eliminando cabeçalho do perfil, barras pretas e rodape.

### Resumo

| Antes | Depois |
|---|---|
| `rounded-xl` (12px) | `rounded-sm` (2px) |
| Overlay escuro no hover | `scale-[1.02]` sutil no hover |
| Iframe tamanho natural (barras pretas) | Iframe expandido + crop central |
| Skeleton `bg-muted` | Skeleton `bg-[#F8F8F8]` (off-white) |

### Arquivo unico

`src/components/InstitutionalSection.tsx`

