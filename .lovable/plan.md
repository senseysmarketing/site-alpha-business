## Padronizar tipografia do menu mobile (seção Condomínios)

No mobile, o item "Condomínios" usa o `AccordionTrigger` do shadcn, que aplica fonte/peso padrão diferente dos outros itens. Os textos internos (Destaques, regiões, links) também variam entre tamanhos. Vou padronizar tudo seguindo o mesmo `mobileClass` de Venda/Locação e harmonizar a hierarquia interna.

### Mudanças em `src/components/Header.tsx`

1. **Trigger "Condomínios"** (linha 260): aplicar exatamente as mesmas classes de Venda/Locação (`font-normal text-sm tracking-[0.1em] uppercase text-white/70`), mantendo só o chevron do accordion. Garantir `text-left` e remover qualquer peso/tamanho herdado.

2. **Labels de seção interna** ("Destaques" e nomes de região, linhas 267 e 287): unificar no mesmo estilo discreto — `text-[10px] tracking-[0.2em] uppercase text-white/40 font-semibold` (já é o caso de "Destaques"; alinhar regiões ao mesmo padrão, removendo divergências).

3. **Links de condomínios por região** (linha 290): padronizar para `text-sm tracking-[0.05em] text-white/60` para combinar com a escala dos itens principais sem competir com eles.

4. **Cards de Destaque** (linha 276): manter `text-xs uppercase tracking-wider` (já consistente).

5. **CTA "Ver todos os condomínios"** (linha 299): já está padronizado com os botões — manter.

### Resultado

- "Venda", "Locação", "Condomínios", "Notícias", "Fale Conosco" ficam visualmente idênticos no mobile (mesma fonte, tamanho, tracking, peso e cor).
- Subitens dentro do accordion seguem hierarquia clara: rótulos de seção minúsculos/destaque, links em peso normal.
- Apenas mobile é afetado; desktop permanece inalterado.
