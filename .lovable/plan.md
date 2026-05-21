## Atualizar Logo Rafael / Alpha Business

Substituir o arquivo de logo pelo novo enviado (maior qualidade) mantendo o mesmo nome de import para não quebrar referências.

### Passos
1. Copiar `user-uploads://Logo-RafaelV2.png` para `src/assets/logo-rafael.png` (sobrescrevendo o atual). Como o arquivo novo é PNG transparente em alta resolução, todos os componentes que já importam `@/assets/logo-rafael.png` recebem automaticamente a versão atualizada.
2. Verificar visualmente nos três pontos de uso:
   - `src/components/Header.tsx` (desktop + mobile, alturas `h-8 md:h-11 lg:h-10`)
   - `src/components/Footer.tsx` (`h-8 md:h-10`)
   - `src/components/Preloader.tsx` (`h-10 md:h-14`)
3. Ajustar altura apenas se a nova proporção (mais larga, ~1920x150) deixar a marca pequena demais — provável aumento leve em Header/Footer (ex.: `h-10 md:h-12`) e Preloader (`h-12 md:h-16`). Confirmado após preview.
4. Atualizar `index.html` (`og:image`/`twitter:image`) NÃO será alterado — continua sendo screenshot do site, não a logo.

### Não será feito
- Não criar novo arquivo de logo com nome diferente.
- Não alterar cores/tokens de tema.
- Não mexer em favicon (não solicitado; me avise se quiser que eu gere também).
