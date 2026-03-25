
Diagnóstico provável:
- O botão “Recarregar Thumbnails” hoje só atualiza o estado local do admin (`setInstaForm(scraped)`), mas não salva em `site_settings`.
- Ao sair da página, o formulário recarrega do banco com os dados antigos, então as thumbnails “somem”.
- A homepage lê `instagram_posts` direto do banco, por isso também continua exibindo URLs antigas/quebradas.
- Há evidência adicional de dados antigos persistidos com `&amp;` no `thumbnail`, então mesmo quando a Edge Function já corrige isso, o frontend ainda pode estar lendo registros legados.

Plano de correção:

1. Ajustar persistência no admin
- Em `src/pages/admin/SiteSettings.tsx`, fazer o fluxo de “Recarregar Thumbnails” persistir o resultado no `site_settings` automaticamente.
- Manter feedback visual durante o processamento/salvamento para deixar claro que a atualização foi concluída.
- Ao upload manual, marcar o item como `success` para evitar voltar como pendente/falho.

2. Blindar contra dados antigos no banco
- Normalizar thumbnails carregadas do banco no admin e na homepage, decodificando entidades HTML (`&amp;` → `&`) antes de renderizar.
- Isso corrige imediatamente registros legados sem depender de nova raspagem.

3. Garantir consistência entre Admin e homepage
- Em `src/components/InstitutionalSection.tsx`, usar a URL normalizada ao renderizar `<img>`.
- Continuar exibindo placeholder apenas quando realmente não houver thumbnail válida.

4. Melhorar UX do bloco social
- Deixar explícito no admin que “Recarregar Thumbnails” atualiza e salva.
- Se a captura falhar, manter o estado visual de erro e o botão “Subir Imagem Manualmente” como fallback definitivo.

Arquivos a ajustar:
- `src/pages/admin/SiteSettings.tsx`
- `src/components/InstitutionalSection.tsx`

Resultado esperado:
- Após clicar em “Recarregar Thumbnails”, as imagens continuam corretas mesmo depois de sair e voltar.
- A seção de Instagram na página inicial passa a refletir exatamente o que foi atualizado no admin.
- Registros antigos com URLs HTML-encoded deixam de quebrar a renderização.
