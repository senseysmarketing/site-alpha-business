

## Ajuste Fino — Centralização e Preenchimento dos Embeds do Instagram

### Problema

O iframe interno do Instagram está deslocado para cima dentro do container `aspect-square`, cortando o ícone de play na parte inferior. A técnica atual de `inset-[-30%] w-[160%] h-[160%]` expande o iframe mas não o centraliza perfeitamente — o conteúdo fica "empurrado" pelo cabeçalho invisível do widget.

### Mudança única

**`src/components/InstitutionalSection.tsx`** — Ajustar o wrapper interno do embed (linha 24):

- Adicionar `flex items-center justify-center` no container pai do embed para centralização
- Ajustar o posicionamento absoluto interno: usar `inset-[-25%]` com `w-[150%] h-[150%]` (menos agressivo, melhor centralização)
- Forçar iframe a ocupar 100% de altura e largura: adicionar `[&_iframe]:!h-full [&_iframe]:!w-full` ao seletor CSS
- Remover padding interno do widget: `[&_div]:!p-0` para eliminar espaçamento que empurra conteúdo

Estrutura resultante:
```
<div className="aspect-square overflow-hidden rounded-sm border border-border/40 bg-[#F8F8F8] relative group hover:scale-[1.02] transition-transform duration-500">
  {!loaded && <Skeleton ... />}
  <div className="absolute inset-0 w-full h-full flex items-center justify-center">
    <div className="w-[160%] h-[160%] [&_iframe]:!max-w-none [&_iframe]:!border-none [&_iframe]:!h-full [&_iframe]:!w-full">
      <InstagramEmbed url={url} width="100%" captioned={false} />
    </div>
  </div>
</div>
```

A camada intermediária com `flex items-center justify-center` centraliza o bloco expandido, garantindo que o crop seja simétrico (corta igualmente topo/base e laterais). O ícone de play ficará visível no centro.

### Preservação

- Handle `@alphaville.sp` no topo: sem alteração
- Link "SEGUIR NO INSTAGRAM" na base: sem alteração
- Grid `grid-cols-2 gap-2`: sem alteração
- Placeholders vazios: sem alteração

### Arquivo

`src/components/InstitutionalSection.tsx` — apenas linhas 19-28

