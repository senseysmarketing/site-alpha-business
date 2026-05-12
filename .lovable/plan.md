## Remover linha acima de "Condomínios" e padronizar espaçamento

No mobile, o wrapper do accordion tem `border-t border-white/5 mt-2`, criando a linha visível acima do item. Além disso, o `<nav>` usa `gap-4` mas o accordion adiciona `mt-2`, deixando o espaço entre Locação→Condomínios maior que entre os outros itens.

### Mudanças em `src/components/Header.tsx`

1. **Linha 257**: remover `border-t border-white/5 mt-2` do wrapper do accordion (deixar apenas `flex flex-col gap-0`, ou simplesmente sem classes extras).
2. **Garantir alinhamento vertical uniforme**: o `AccordionTrigger` do shadcn aplica `py-4` por padrão. Vou forçar `py-2` (igual aos outros links) sobrescrevendo via classe — já está com `py-2` mas a classe interna do shadcn pode prevalecer; usar `!py-2` para garantir.
3. Manter o `nav gap-4` global — assim Venda, Locação, Condomínios, Notícias e Fale Conosco terão o mesmo espaçamento vertical.

Apenas mobile é afetado.