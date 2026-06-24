## Objetivo
Fazer os carrosséis da home (Imóveis, Redes Sociais, Equipe) avançarem uma "página inteira" por clique nas setas, em vez de um card por vez.

## Mudança
Adicionar `slidesToScroll: "auto"` nas opções do Embla (`opts={{ align: "start", slidesToScroll: "auto" }}`) em:

- `src/components/PropertyCarouselSection.tsx` (Novidades / "Nossas propriedades especiais")
- `src/components/NewArrivalsSection.tsx` (se também usa carousel de imóveis)
- `src/components/InstitutionalSection.tsx` (Redes Sociais)
- `src/components/TeamSection.tsx` (Equipe)

`slidesToScroll: "auto"` faz o Embla avançar exatamente os slides visíveis no viewport atual, respeitando responsividade (1 no mobile, 3-4 no desktop). Dots de paginação (quando existirem) passam a refletir páginas inteiras automaticamente.

## Validação
Abrir a home no preview, clicar nas setas de cada carrossel e confirmar que avança o grupo inteiro visível, não um por um.

## Arquivos
Apenas os 4 componentes de seção acima. Sem alterações em `ui/carousel.tsx`, schema ou backend.
