

## Tornar as Configuracoes Funcionais — Conectar site_settings aos Componentes Publicos

### Diagnostico

A pagina admin `/admin/configuracoes` salva corretamente no Supabase, mas **nenhum componente publico consome esses dados**. Todos usam valores hardcoded:

| Componente | Status | Problema |
|---|---|---|
| `HeroSection.tsx` | Hardcoded | Video URLs fixas, sem titulo/subtitulo do DB |
| `LifestyleSection.tsx` | Hardcoded | Categorias importadas de assets locais |
| `FeaturedPropertySection.tsx` | Hardcoded | Usa `mockProperties` em vez do DB |
| `Footer.tsx` | Hardcoded | Telefone, email, copyright fixos |
| `Header.tsx` | Hardcoded | Instagram, telefone, WhatsApp fixos |
| `ContactSection.tsx` | Hardcoded | Nenhuma integracao |

### Plano de Implementacao

**1. HeroSection.tsx** — Consumir setting `hero`
- Importar `useSiteSettings`
- Usar `video_url` do DB (se preenchido) em vez de `/videos/hero-bg.mp4`
- Usar `fallback_image` como poster/fallback
- Exibir `title` e `subtitle` sobre o video (se preenchidos)
- Se campos vazios, manter comportamento atual (sem texto)

**2. LifestyleSection.tsx** — Consumir setting `lifestyle_categories`
- Carregar categorias do DB via `useSiteSettings`
- Manter as imagens locais como fallback se `image` estiver vazio
- Atualizar titulos e subtitulos conforme DB

**3. FeaturedPropertySection.tsx** — Consumir settings `featured_property`
- Buscar o imovel selecionado no DB (`property_id`) em vez de usar mockProperties
- Usar `custom_label` em vez de "Destaque" hardcoded
- Fallback: se nenhum imovel configurado, manter comportamento atual (mock)

**4. Footer.tsx** — Consumir settings `contact` e `footer`
- Telefone, email, endereco do DB
- Copyright e tagline do DB
- Fallback para valores atuais se vazio

**5. Header.tsx** — Consumir setting `contact`
- Instagram, telefone, WhatsApp do DB
- Fallback para valores atuais

**6. SiteSettings.tsx** — Fix titulo/subtitulo do Hero
- O formulario ja funciona, mas os campos `title` e `subtitle` inicializam como string vazia antes do DB carregar. Adicionar placeholder visual para indicar que "vazio = nao exibir".

### Arquivos a editar

| Arquivo | Acao |
|---|---|
| `src/components/HeroSection.tsx` | Integrar `useSiteSettings("hero")` |
| `src/components/LifestyleSection.tsx` | Integrar `useSiteSettings("lifestyle_categories")` |
| `src/components/FeaturedPropertySection.tsx` | Integrar `useSiteSettings("featured_property")` + query Supabase |
| `src/components/Footer.tsx` | Integrar `useSiteSettings("contact")` + `useSiteSettings("footer")` |
| `src/components/Header.tsx` | Integrar `useSiteSettings("contact")` |

### Sem mudancas no banco de dados
Tabela `site_settings` ja existe com os seeds corretos. Nenhuma migration necessaria.

