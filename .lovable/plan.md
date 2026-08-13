# Documento de escopo template — Plataforma imobiliária

Objetivo: transformar a estrutura atual do site em um documento de escopo reutilizável, que sirva de base comercial e técnica para construir outros sites imobiliários semelhantes.

## O que será entregue

Um documento único (Word `.docx` + versão markdown) salvo em `/mnt/documents`, com sumário navegável, tabelas e linguagem acessível para cliente e para equipe técnica.

## Estrutura do documento

1. **Visão geral do produto** — o que a plataforma faz, público-alvo, diferenciais (busca com IA, CRM próprio, sincronização com feed do portal).
2. **Mapa do site público** — tabela rota a rota (Home, /busca, /imovel/:id, /blog, /blog/:slug, índice para crawlers, 404) com seções e componentes de cada tela.
3. **Busca e filtros** — busca tradicional (transação, tipo, dormitórios/suítes, faixa de preço venda e locação, área, condomínio e código com autocomplete), estado em URL, busca conversacional com IA, normalização de condomínio/bairro e aliases.
4. **Captação de leads** — pontos de captura (formulário no card do corretor, agendamento de visita, anuncie seu imóvel, contato da home, WhatsApp com mensagem contextual), origem, e regras de criação do lead.
5. **Painel administrativo** — tabela módulo a módulo (Dashboard, Imóveis, Condomínios, CRM/Leads, Agenda, Equipe, Relatórios, Financeiro, Marketing, Blog CMS, Importação, Configurações, Auditoria) com funcionalidades e papéis que acessam.
6. **Perfis e permissões** — matriz admin / gerente / corretor / assistente por módulo.
7. **Modelo de dados** — as 22 tabelas agrupadas por domínio (catálogo, CRM, conteúdo, equipe, financeiro, sistema), com finalidade de cada uma.
8. **Integrações e automações** — sincronização com feed XML em cron 3x ao dia com diff de campos, notificações de lead e agenda, IA (busca, geração de artigos, cadastro assistido de imóvel), Meta Pixel e GA4.
9. **SEO e indexação** — metadados por página, JSON-LD, sitemap automático, conteúdo estático injetado no build para crawlers e bots de IA.
10. **Identidade visual e temas** — tokens de design controlados pelo admin, tipografia, o que muda por cliente.
11. **Núcleo reutilizável vs. customizável** — tabela dividindo o que é padrão em todo projeto e o que é configurado por cliente (marca, seções da home, fonte de dados, pipeline, integrações).
12. **Escopo por pacote** — Essencial / Completo / Premium, com módulos incluídos em cada um, para facilitar proposta comercial.
13. **Premissas e dependências do cliente** — acesso ao feed do portal, domínio, contas de analytics, conteúdo institucional e fotos.

## Detalhes técnicos

- Documento gerado com a biblioteca `docx` (Node), fonte Arial, página A4, sumário com headings, tabelas com largura em DXA.
- Nenhum arquivo do projeto é alterado — a saída fica apenas em `/mnt/documents`.
- Conteúdo extraído do código atual: rotas em `src/App.tsx`, telas em `src/pages`, componentes de busca e imóvel, edge functions em `supabase/functions` e o schema do banco.
