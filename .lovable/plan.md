## Instalar Meta Pixel + Conversions API (CAPI)

Rastreamento duplo (browser via Pixel + servidor via CAPI) para maximizar qualidade de sinal e resistir a bloqueadores.

### 1. Meta Pixel (browser) — `index.html`
Inserir snippet oficial no `<head>` com ID `967163625325337`, e fallback `<noscript>` no `<body>`. Dispara `PageView` automaticamente em toda navegação (SPA já rerrenderiza em rota, então também vamos disparar `PageView` em mudanças de rota — ver item 3).

### 2. Helper de tracking — `src/lib/metaPixel.ts` (novo)
Wrapper tipado sobre `window.fbq` com funções:
- `trackPageView()`
- `trackLead(params)` — para leads (formulários enviados)
- `trackContact()` — cliques em WhatsApp / telefone
- `trackSchedule(params)` — agendamento de visita
- `trackViewContent(params)` — visualização de ficha de imóvel
- `trackSearch(params)` — busca (tradicional e IA)
- `trackSubmitApplication()` — "Anuncie seu imóvel"

Cada função também chama um `sendCapiEvent(eventName, params)` que faz `POST` para a edge function `meta-capi` (item 4), enviando `event_id` único (deduplicação Pixel↔CAPI), `event_source_url`, e user_data disponível (email, phone, nome quando existir no formulário — hasheados no servidor).

### 3. Disparos nos pontos-chave
| Ação do usuário | Componente | Evento Pixel + CAPI |
|---|---|---|
| Mudança de rota | `App.tsx` (novo `RouteTracker`) | `PageView` |
| Ver ficha de imóvel | `pages/PropertyDetail.tsx` | `ViewContent` (content_ids, price, currency BRL) |
| Buscar (tradicional) | `SearchBarSection.tsx` submit | `Search` (search_string com filtros) |
| Buscar (IA) | `useAiSearchChat.ts` ao enviar prompt | `Search` |
| Clicar WhatsApp flutuante | `FloatingWhatsApp.tsx` | `Contact` |
| Clicar telefone/WhatsApp em card/sidebar | `PropertySidebar.tsx`, `ContactSection.tsx` | `Contact` |
| Enviar form de contato | `ContactSection.tsx` submit | `Lead` |
| Agendar visita (concluir) | `ScheduleVisitModal.tsx` submit final | `Schedule` |
| Enviar "Anuncie seu imóvel" | `AdvertisePropertyModal.tsx` submit | `SubmitApplication` |

Cada disparo gera um `event_id` (uuid) reutilizado no Pixel e no CAPI para deduplicação.

### 4. Conversions API — edge function `supabase/functions/meta-capi/index.ts` (nova)
- Público (verify_jwt = false), CORS liberado.
- Recebe `{ event_name, event_id, event_time, event_source_url, user_data, custom_data }`.
- Hash SHA-256 (server-side) em `email`, `phone`, `fn`, `ln` antes de enviar.
- Coleta `client_ip_address` (do header `x-forwarded-for`) e `client_user_agent`.
- Se houver cookies `_fbp` / `_fbc` no request body (lidos do `document.cookie` no client), inclui em `user_data`.
- POST para `https://graph.facebook.com/v21.0/{PIXEL_ID}/events?access_token={META_CAPI_TOKEN}`.
- Em dev, também envia `test_event_code` se `META_CAPI_TEST_CODE` estiver definido.
- Registra no `supabase/config.toml` como função pública.

### 5. Secrets necessários (Lovable Cloud)
- `META_PIXEL_ID` = `967163625325337` (também exposto no client via constante — é público)
- `META_CAPI_ACCESS_TOKEN` — **você precisa gerar em Meta Events Manager → seu Pixel → Configurações → API de Conversões → Gerar token de acesso**. Vou pedir via formulário seguro após você aprovar o plano.
- `META_CAPI_TEST_CODE` (opcional) — para validar eventos na aba "Testar eventos" do Events Manager antes de ir pra produção. Pode enviar depois.

### Fora do escopo
- Consent Mode / banner de cookies LGPD (não solicitado; podemos adicionar depois).
- Eventos de e-commerce avançados (Purchase, AddToCart) — não se aplicam ao fluxo atual.
- Catálogo de imóveis para Advantage+ (integração separada).
