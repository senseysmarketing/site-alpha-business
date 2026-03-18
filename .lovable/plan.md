

## Adicionar 5 Imoveis de Exemplo (Mock Data)

### Objetivo
Criar dados mockados de 5 imoveis de luxo que aparecem em todas as paginas relevantes: busca (`/busca`), detalhes (`/imovel/:id`), homepage (NewArrivals + Featured), permitindo visualizar o design completo do sistema.

### Arquivos

| Arquivo | Acao |
|---|---|
| `src/data/mockProperties.ts` | **Criar** — Array com 5 imoveis completos usando imagens ja existentes em `src/assets/` |
| `src/components/search/SearchHero.tsx` | **Editar** — Adicionar fallback: se a edge function falhar ou retornar vazio, usar mock data como resultados |
| `src/pages/SearchResults.tsx` | **Editar** — Inicializar com mock data quando nao ha query (pagina `/busca` sem parametros mostra os 5 imoveis) |
| `src/pages/PropertyDetail.tsx` | **Editar** — Ler `:id` da URL com `useParams`, buscar imovel correspondente no array de mock data, renderizar dados dinamicos em vez de hardcoded |
| `src/components/NewArrivalsSection.tsx` | **Editar** — Importar mock data, usar os 4 primeiros imoveis com links corretos para `/imovel/:id` |
| `src/components/FeaturedPropertySection.tsx` | **Editar** — Usar o 5o imovel (ou o mais caro) como destaque |

### Mock Data (5 imoveis)

Cada imovel tera: `id`, `code`, `title`, `condominium`, `neighborhood`, `city`, `price`, `rental_price`, `transaction_type`, `bedrooms`, `bathrooms`, `suites`, `parking`, `area_total`, `photo`, `images` (array), `relevance_reason`, `description`, `subtitle`, `type`, `amenities`.

1. **Residencia Altos de Alphaville** — R$ 12.500.000, 850m², 5 suites, Alphaville (property-1.jpg)
2. **Penthouse Sky Residence** — R$ 8.900.000, 420m², 4 suites, Barueri (property-2.jpg)
3. **Villa Pedra & Vidro** — R$ 9.200.000, 680m², 4 suites, Alphaville 11 (property-3.jpg)
4. **Casa Contemporanea Light** — R$ 7.800.000, 520m², 5 suites, Tambore (property-4.jpg)
5. **Mansao Jardim Europa** — R$ 15.200.000, 1200m², 6 suites, Alphaville 0 (mansion-modern.jpg)

### Fluxo
- `/busca` sem query → mostra os 5 imoveis no grid Bento
- `/busca?q=...` → tenta edge function, se falhar usa mock data filtrado
- `/imovel/1` a `/imovel/5` → PropertyDetail le o ID e renderiza o imovel correspondente
- Homepage → NewArrivals e Featured usam os mesmos dados

