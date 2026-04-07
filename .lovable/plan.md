

## Redesign do Rodapé — Conforme Layout de Referência

### Estrutura do novo footer (2 colunas sobre fundo bordô)

**Coluna esquerda:**
- "Alpha Business - Imobiliária Alphaville"
- "Centro Empresarial Alphaville"
- "Al. Rio Negro, 967 – 2º and. – Cj: 212"
- "Alphaville – Barueri – SP – 06455-000"
- Espaço
- "Rafael Albuquerque"
- "WHATSAPP: 11 99311-6849"
- "WHATSAPP: 11 94001-0287"

**Coluna direita:**
- "Nos siga nas redes sociais e acompanhe nossas novidades."
- Ícone Instagram + "@AlphavilleSP" + "@AlphavilleAB"
- Espaço
- "©2026 Rafael Albuquerque | Alpha Buoiness"
- Texto descritivo: "AlphaBusiness: Negócios Imobiliários em Alphaville São Paulo – Todos os direitos reservados. Imobiliária especializada em mansões e casas em Alphaville, Tamboré e Santana de Parnaíba. Casas e apartamentos a venda em Alphaville"
- "CRECI-PJ: 035836"

### Mudanças técnicas

**Arquivo: `src/components/Footer.tsx`**

- Fundo: `bg-[#2A070C]` (Midnight Bordeaux) com textos em branco/cinza claro
- Layout: grid 2 colunas (`md:grid-cols-2`) sem a estrutura atual de 4 colunas
- Remover logo (manter placeholder para futura atualização), remover nav "Navegação", remover rodapé inferior com "Privacidade/Termos"
- Todos os textos conforme o print — hardcoded por enquanto (dados que não vêm do settings como endereço completo, WhatsApp duplo, etc.)
- Manter `useSiteSettings` para dados dinâmicos onde aplicável (instagram handles)
- Ícone Instagram via `lucide-react` (`Instagram`)

Remover header com logo e nav do footer (esses ficam apenas no Header). O footer agora é puramente informativo.

