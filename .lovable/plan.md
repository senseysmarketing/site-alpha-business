

## Ajuste de Centralização Horizontal dos Embeds do Instagram

### Problema

O conteúdo interno do iframe (ícone de play, imagem) não está centralizado horizontalmente. O wrapper de 160% está sendo alinhado pelo flex, mas o próprio conteúdo do iframe dentro dele não se centraliza porque o embed do Instagram tem largura fixa interna.

### Solução

**`src/components/InstitutionalSection.tsx`** — linha 25: adicionar centralização no wrapper interno do embed e forçar o conteúdo do iframe a se centralizar via CSS overrides:

```tsx
<div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
  <div className="w-[160%] h-[160%] flex items-center justify-center [&_iframe]:!max-w-none [&_iframe]:!border-none [&_iframe]:!h-full [&_iframe]:!w-full [&>div]:!flex [&>div]:!items-center [&>div]:!justify-center">
    <InstagramEmbed url={url} width="100%" captioned={false} />
  </div>
</div>
```

Mudanças:
- Adicionar `flex items-center justify-center` também no div de 160% (não só no pai)
- Forçar o div filho direto do embed (`[&>div]`) a usar flex centering
- Isso garante que o iframe e seu conteúdo (play icon, imagem) fiquem centrados em ambos os eixos

### Arquivo único
`src/components/InstitutionalSection.tsx` — linhas 24-27

