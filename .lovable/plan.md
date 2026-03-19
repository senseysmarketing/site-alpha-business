

## Modulo de Importacao em Massa (Data Engine)

### Visao Geral

Wizard de 5 etapas: Upload → Parse → Mapear Colunas → Preview/Validar → Enviar ao Supabase. Pagina nova em `/admin/importar`.

### Passo 1 — Nova Pagina e Rota

| Arquivo | Acao |
|---|---|
| `src/pages/admin/DataImport.tsx` | **Criar** — Pagina principal com wizard |
| `src/components/admin/AdminSidebar.tsx` | **Editar** — Adicionar item "Importar" com icone `Upload` |
| `src/App.tsx` | **Editar** — Adicionar rota `<Route path="importar" element={<DataImport />} />` |

### Passo 2 — Dependencias

Adicionar `react-dropzone` e `papaparse` (+ `@types/papaparse`) ao projeto.

### Passo 3 — Componente DataImport.tsx

**Wizard com 5 steps, controlado por estado `step` (0-4):**

**Step 0 — Upload:**
- Drag-and-drop zone (react-dropzone) aceitando `.csv` e `.xml`
- Estilo Quiet Luxury: borda dashed 1px `border-border/50`, fundo `bg-white`, icone `Upload` centralizado
- Botao "Baixar CSV Exemplo" que gera download de um template com as colunas da tabela properties (code, title, property_type, transaction_type, price, bedrooms, bathrooms, parking_spots, area_total, area_built, condominium, address, city, neighborhood, description)
- Avatar do usuario logado indicando quem esta subindo

**Step 1 — Parse:**
- PapaParse processa o arquivo async com `worker: true`
- Barra de progresso animada (componente Progress do shadcn)
- Para XML: parser simples com DOMParser nativo
- Exibe contagem de linhas encontradas

**Step 2 — Mapeamento de Colunas:**
- Tabela com 2 colunas: "Coluna do Arquivo" | "Campo do Sistema"
- Cada linha tem um Select com os campos da tabela properties
- Funcao Auto-map: compara nomes normalizados (lowercase, sem acentos/underscores) e pre-seleciona matches (ex: `val_imovel` → `price`, `quartos` → `bedrooms`, `titulo` → `title`)
- Campos nao mapeados ficam como "Ignorar"

**Step 3 — Preview e Validacao:**
- Tabela preview com as primeiras 10 linhas ja mapeadas
- Validacao: campos obrigatorios (code, title, property_type) highlighted em vermelho se vazios
- Contagem de linhas validas vs invalidas
- Botao para baixar linhas com erro como CSV

**Step 4 — Envio:**
- Upsert em batch (50 por vez) na tabela `properties` via Supabase SDK
- Barra de progresso com contagem `X de Y inseridos`
- Ao finalizar: insere registro no `system_audit_logs` com action "importou", object_type "imovel", metadata com contagem
- Resumo final: total importados, erros, tempo

### Estetica

- Cards brancos `bg-white border-border/50 shadow-none rounded-sm`
- Fontes: Raleway para titulos, Inter para corpo
- Stepper horizontal no topo com circulos numerados, linha conectora, step ativo em `#2A070C`
- Muito espaco negativo, padding generoso
- Botoes "Proximo" e "Voltar" minimalistas no rodape de cada step

### Seguranca

- Rota protegida pelo `ProtectedRoute` (somente admin)
- Upsert usa sessao autenticada do Supabase (RLS ja configurado para admin INSERT na tabela properties)

