## Problema

Na página pública do imóvel (ex.: "CASA Varanda" no Condomínio Vintage / Granja Viana), a seção "Sobre o bairro" sempre mostra **Alphaville** — texto e ícones (Shopping Iguatemi Alphaville, etc.) — independente do condomínio cadastrado. Motivos:

1. `PropertyNeighborhood.tsx` tem 4 highlights **hardcoded** sobre Alphaville.
2. `PropertyDetail.tsx` monta `neighborhoodInfo` usando `dbProperty.neighborhood` (que vem como "Alphaville" por default em toda propriedade) e cai num fallback de descrição genérica de Alphaville.
3. Não existe nenhum lugar para cadastrar/gerenciar informações dos condomínios (descrição, região real, destaques, imagem, etc.) — então qualquer imóvel novo fora de Alphaville exibe conteúdo errado.

## Solução proposta

Criar uma entidade **Condomínios** gerenciável pelo admin, e fazer a página pública do imóvel ler as informações do condomínio vinculado.

### 1. Banco de dados

Nova tabela `condominiums` em Supabase:

- `name` (text, unique, normalizado p/ matching) — ex.: "Condomínio Vintage"
- `region` (text) — ex.: "Granja Viana" (usado como título da seção bairro)
- `city` (text) — ex.: "Cotia"
- `description` (text) — texto exibido em "Sobre o bairro"
- `highlights` (jsonb array) — lista `{ icon: string, label: string }` (4–6 itens), com `icon` sendo um nome do lucide-react (ex.: `Utensils`, `TreePine`, `ShoppingBag`, `GraduationCap`, `Trees`, `Dumbbell`, `Waves`)
- `cover_image` (text, opcional) — para uso futuro
- `is_active` (bool, default true)
- `created_at` / `updated_at`

RLS: leitura pública, escrita só para `admin`.

Vínculo com `properties`: **não** adiciona FK — fazemos match por nome normalizado (trim + lowercase + sem acento) entre `properties.condominium` e `condominiums.name`. Isso preserva o fluxo do sync Kenlo e cadastros manuais sem migrações destrutivas.

### 2. Admin — nova tela `/admin/condominios`

Página listando todos os condomínios em formato tabela (Quiet Luxury, mesmo padrão de `/admin/imoveis`):

- Colunas: Nome · Região · Cidade · Destaques (contagem) · Status · Ações
- Botão "Novo Condomínio"
- Botão **"Sincronizar com imóveis"**: varre `properties.condominium` distintos e cria entradas vazias (apenas `name`) para condomínios ainda não cadastrados — admin depois preenche região/descrição/destaques

Modal/drawer de edição (ou rota `/admin/condominios/:id`) com:

- Campos: Nome, Região, Cidade, Descrição (textarea longa), Cover image (upload), Status ativo
- Editor de Destaques: lista dinâmica com seletor de ícone (dropdown com os ícones lucide suportados) + input de label, botão adicionar/remover
- Botão Salvar com toast e audit log

Adicionar item "Condomínios" na `AdminSidebar.tsx` (entre Imóveis e Equipe).

### 3. Frontend público

**`PropertyDetail.tsx`**:
- Após carregar o imóvel, busca o condomínio correspondente em `condominiums` por nome normalizado.
- Monta `neighborhoodInfo` priorizando dados do condomínio:
  - `name` = `condo.region` (ex.: "Granja Viana") em vez de `neighborhood`
  - `description` = `condo.description`
  - `highlights` = `condo.highlights`
- Atualiza também o `subtitle` do hero para usar `condo.region` em vez do `neighborhood` genérico, quando disponível.

**`PropertyNeighborhood.tsx`**:
- Remove os 4 highlights hardcoded.
- Recebe `highlights: { iconName: string, label: string }[]` por prop e renderiza dinamicamente usando um mapa `iconName → componente lucide`.
- Se o condomínio não tiver highlights cadastrados, esconde o grid (mantém apenas título + descrição).

### 4. Comportamento de fallback

- Imóvel sem condomínio cadastrado na tabela `condominiums` → mostra `neighborhood` + `city` do próprio imóvel como título; descrição e highlights ocultos (sem texto de Alphaville).
- Texto genérico de Alphaville do `fallback` é removido para evitar conteúdo enganoso.

### 5. Memórias a atualizar

- `features/property-detail/layout` — registrar que a seção de bairro agora é dirigida por `condominiums` e fallback é vazio.
- Nova memória `features/admin/condominium-management` documentando a tela de CRUD e o matching por nome normalizado.

## Fora de escopo

- Não altera o sync do Kenlo nem a estrutura da tabela `properties`.
- Não cria página pública "/condominios/:slug" (pode ser próxima fase).
- Não toca no mega menu de condomínios (já automatizado).
