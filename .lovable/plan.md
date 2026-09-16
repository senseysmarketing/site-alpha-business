# Análise técnica — deploy automático após alterações no Supabase

## Conclusão executiva

**É viável automatizar a regeneração das páginas estáticas, mas não existe hoje um deploy hook/API server-to-server oficialmente documentado para republicar diretamente a hospedagem nativa do Lovable a partir de uma Supabase Edge Function.**

O Lovable oferece duas superfícies relacionadas, porém diferentes:

1. **Publicação nativa:** o site publicado é um snapshot. Mudanças posteriores só entram em produção por **Publish changes** ou por um pedido de publicação no chat. Não há webhook de rebuild documentado. [Publicação](https://docs.lovable.dev/features/publish) · [Hospedagem](https://docs.lovable.dev/features/hosting)
2. **Lovable MCP Server:** disponibiliza a ferramenta `deploy_project`, mas usa OAuth de usuário. Clientes hospedados precisam ter o endereço de retorno aprovado pelo Lovable. A documentação não oferece credencial de serviço, client credentials ou token pessoal para uma Edge Function atuar de forma autônoma. [Lovable MCP Server](https://docs.lovable.dev/integrations/lovable-mcp-server)

Portanto, o fluxo exato abaixo **não está disponível como integração nativa pronta**:

```text
Supabase → Edge Function → deploy hook Lovable → build → produção
```

## Respostas objetivas

### Existe API, webhook ou deploy hook oficial?

- **Deploy hook HTTP nativo:** não documentado.
- **API pública de publicação por token de serviço:** não documentada.
- **OAuth/MCP:** existe e permite `deploy_project`, mas foi desenhado para clientes/agentes autenticados por uma conta Lovable.
- **Cliente MCP hospedado:** requer aprovação do endereço OAuth pelo Lovable; não equivale a uma integração machine-to-machine pronta.

### Uma Supabase Edge Function pode disparar o deploy sem expor credenciais?

- **Com a hospedagem nativa do Lovable:** não por um endpoint server-to-server oficialmente documentado.
- **Via MCP:** seria uma integração customizada e experimental. Exigiria cliente MCP hospedado, OAuth, aprovação do callback, armazenamento e renovação segura dos tokens. Não há documentação garantindo operação totalmente autônoma em Edge Function.
- **Com hospedagem externa:** sim. A Edge Function pode chamar um deploy hook de Vercel, Netlify, Cloudflare Pages ou outro provedor. O hook/token fica em **Supabase Edge Function Secrets**, nunca no frontend.

### É possível publicar sem novo commit?

- **Lovable nativo:** o MCP `deploy_project` publica o estado atual, mas não é oferecido como deploy hook autônomo.
- **Hospedagem externa:** normalmente sim. Um build hook pode reconstruir o commit atual, consultando os dados atuais do Supabase durante o build. A confirmação final depende do provedor escolhido.

### O build executaria o script atual?

Em hospedagem externa configurada com `npm run build` ou `bun run build`, sim: o script atual do projeto executa a cadeia completa:

```text
vite build && node scripts/generate-og-pages.mjs
```

O diretório publicado é `dist`. Esse é o fluxo recomendado na documentação para projetos Vite hospedados externamente. [Hospedagem externa](https://docs.lovable.dev/tips-tricks/external-deployment-hosting)

Na publicação nativa, erros do build impedem a publicação, mas a documentação não detalha internamente etapas, cache ou garantias específicas para scripts pós-build.

### Frequência, fila, rate limit e custo

- O Lovable não publica limites específicos para frequência de `deploy_project`, tamanho de fila ou rebuild automático.
- Publicar pelo chat consome uso normal de chat; o MCP informa custos para determinadas ações, mas não apresenta uma tabela pública de rate limit de deploy.
- A hospedagem do site publicada não consome créditos por si só; funções e recursos usados em execução podem consumir créditos.
- Em hospedagem externa, limites e custos pertencem ao provedor escolhido: minutos de build, concorrência, retenção e largura de banda.

### Deploy incremental ou completo?

Não há suporte documentado para regeneração incremental de páginas na hospedagem Lovable. Para este projeto, deve-se planejar um **build completo**, pois `generate-og-pages.mjs` recompõe páginas, Open Graph, canonical e sitemap.

## Arquitetura recomendada

### Opção A — recomendada para automação real

Manter o Lovable como ambiente de desenvolvimento e mover apenas a entrega do frontend de produção para um host com CI/CD e deploy hooks:

```text
Alteração relevante no Supabase
        ↓
Database Webhook / trigger controlado
        ↓
Supabase Edge Function
  - valida o evento
  - registra pedido de rebuild
  - aplica debounce
        ↓
Deploy hook do provedor externo
        ↓
Checkout do repositório sincronizado
        ↓
npm run build
  ├─ vite build
  └─ generate-og-pages.mjs consulta o Supabase atual
        ↓
Publicação atômica de dist/
        ↓
Domínio de produção
```

**Por que é a opção recomendada:** Git Sync e hospedagem externa são caminhos oficialmente documentados pelo Lovable; deploy hooks, filas e builds automáticos ficam sob um provedor que oferece essas garantias. [Git Sync](https://docs.lovable.dev/integrations/git-sync-overview) · [Hospedagem externa](https://docs.lovable.dev/tips-tricks/external-deployment-hosting)

### Debounce seguro

Não usar memória da Edge Function, pois execuções são efêmeras. O desenho recomendado é:

1. Cada mudança relevante atualiza um único pedido pendente com `last_change_at`.
2. Um processador executa após um período sem novas mudanças, por exemplo 2–5 minutos.
3. Apenas um deploy pode ficar em andamento.
4. Mudanças ocorridas durante o build geram exatamente mais um deploy posterior.
5. Falhas permanecem registradas para nova tentativa e auditoria.

Isso agrupa edições consecutivas de matéria, capa, fotos e imóvel sem criar uma tempestade de builds.

### Opção B — permanecer na hospedagem Lovable

Usar o Lovable MCP Server com `deploy_project` somente após validação formal com o suporte Lovable:

```text
Supabase → fila/debounce → serviço MCP hospedado → OAuth Lovable → deploy_project
```

Antes de adotar essa opção seria necessário confirmar com o Lovable:

- aprovação do callback OAuth do serviço hospedado;
- possibilidade de operação sem usuário presente;
- renovação e revogação dos tokens;
- limites e política de uso de `deploy_project`;
- comportamento de concorrência e idempotência;
- suporte oficial para automação de produção.

**Não recomendo implementar essa opção apenas por inferência da existência do MCP.** A documentação confirma deploy por agente, mas não confirma credenciais machine-to-machine para Supabase.

### Opção C — manter o processo atual

Continuar na hospedagem Lovable e publicar manualmente após alterações que afetam SEO ou previews. É a opção de menor risco operacional, porém não resolve a defasagem automaticamente.

## Credenciais e armazenamento

### Para hospedagem externa

Na Supabase Edge Function:

- `DEPLOY_HOOK_URL` ou token equivalente do provedor;
- segredo interno para validar chamadas ao endpoint, se ele for exposto;
- identificador do projeto/site no provedor, quando exigido.

No ambiente de build do provedor:

- `VITE_SUPABASE_URL`;
- `VITE_SUPABASE_PUBLISHABLE_KEY`;
- `VITE_SUPABASE_PROJECT_ID`;
- qualquer segredo estritamente necessário para o script de geração, apenas se ele não puder trabalhar com acesso público controlado.

Regras:

- deploy hook e tokens ficam em cofres de segredos do Supabase/provedor;
- nunca usar `VITE_` para credenciais privadas;
- nunca salvar tokens em tabela, frontend, repositório ou logs;
- aplicar menor privilégio e permitir rotação/revogação.

### Para MCP Lovable

Seriam necessários OAuth e armazenamento seguro dos tokens no serviço hospedado. Como não há credencial machine-to-machine documentada, **não existe hoje uma lista oficial de segredo Lovable que possa simplesmente ser adicionada à Edge Function**.

## Impacto sobre domínio e produção

- Criar webhooks e testes sem trocar DNS não afeta o site atual.
- Migrar a produção para outro host exige configurar domínio, certificados e variáveis; a troca de DNS deve ocorrer somente após homologação.
- O Supabase externo atual pode permanecer igual.
- URLs, canonical e sitemap permanecem iguais se o mesmo build e domínio forem usados.
- Builds devem ser publicados de forma atômica; falha no build não deve substituir a versão vigente.
- A publicação Lovable atual pode ser mantida como rollback até a nova hospedagem ser validada, evitando mudanças simultâneas de DNS e conteúdo.

## Recomendação final

Para automação confiável hoje, usar:

```text
Supabase → Edge Function com fila/debounce → deploy hook de host externo → build completo → dist → produção
```

Se a exigência for manter obrigatoriamente a hospedagem nativa do Lovable, permanecer com publicação manual ou abrir uma consulta ao suporte sobre uso unattended do `deploy_project` via MCP. Não criar token próprio, não reutilizar sessão de usuário e não guardar OAuth Lovable no frontend.

## Escopo desta análise

Nenhum arquivo, banco, função, segredo, domínio ou configuração de publicação foi alterado. A implementação deve ser planejada somente depois da escolha entre hospedagem externa e permanência no Lovable.
