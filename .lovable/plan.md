

## Reconfigurar Tela de Configurações para a Homepage Atualizada

### Contexto
A homepage mudou significativamente: o Hero agora é um **carrossel de imagens de imóveis** (não mais vídeo), com textos fixos ("Prepare-se para sonhar alto", "Se você está buscando imóveis de luxo..."). A tela de configurações ainda mostra campos de "URL do Vídeo 4K" e "Imagem Fallback" que não fazem mais sentido.

### Mudanças no bloco "Homepage Hero"
Substituir os campos atuais (video_url, fallback_image, title, subtitle) por:

- **Frase de apoio** (tagline): o texto pequeno em cima ("Prepare-se para sonhar alto") — editável
- **Título principal**: o texto grande ("Se você está buscando *imóveis de luxo*, aqui é o seu lugar") — editável, com nota indicando que texto entre `*asteriscos*` ficará em itálico
- **Seleção de imóveis do carrossel**: lista de até 5 imóveis selecionáveis via dropdown (busca na tabela `properties`), permitindo ao admin escolher quais imóveis aparecem no carrossel Hero

Atualizar o tipo `HeroSettings` para:
```text
tagline: string
headline: string
carousel_property_ids: string[]  (array de UUIDs)
```

### Mudanças no bloco "Imóvel de Destaque"
O `FeaturedPropertySection` atual mostra textos fixos ("Conheça os condomínios", "As propriedades mais que especiais em Alphaville") e botões de condomínios hardcoded. Adicionar campos:

- **Tagline** ("Conheça os condomínios")
- **Título** ("As propriedades mais que especiais em *Alphaville*")
- **Imagem de fundo** (upload)
- **Botões de condomínio**: lista editável (label + link), com add/remove

### Mudanças no bloco "Categorias de Lifestyle"
Já funciona, mas o `subtitle` não é mais usado no componente (foi removido nas atualizações recentes). Remover o campo de subtítulo do formulário.

### Mudanças no Mini Preview
Atualizar para refletir a nova estrutura: mostrar uma miniatura do carrossel Hero com as imagens dos imóveis selecionados, em vez da simulação de vídeo/imagem estática.

### Consumo no HeroSection
Atualizar `HeroSection.tsx` para ler as settings do banco:
- Usar `carousel_property_ids` para buscar imóveis específicos (em vez de `limit(5)` genérico)
- Usar `tagline` e `headline` do banco (com fallback para os textos atuais)
- Renderizar itálico para texto entre `*...*` no headline

### Consumo no FeaturedPropertySection
Atualizar para ler settings do banco (`featured_banner`):
- Tagline, título, imagem de fundo e botões de condomínio dinâmicos

### Arquivos a editar
1. **`src/pages/admin/SiteSettings.tsx`** — reescrever bloco Hero, ajustar Lifestyle (remover subtitle), adicionar bloco Featured Banner expandido, atualizar Mini Preview
2. **`src/components/HeroSection.tsx`** — consumir `hero` settings do banco para tagline, headline e IDs de imóveis do carrossel
3. **`src/components/FeaturedPropertySection.tsx`** — consumir `featured_banner` settings do banco
4. **`src/components/LifestyleSection.tsx`** — remover uso de `subtitle` (se ainda existir referência)

### Detalhes técnicos

**Novo tipo HeroSettings:**
```typescript
interface HeroSettings {
  tagline: string;           // "Prepare-se para sonhar alto"
  headline: string;          // "Se você está buscando *imóveis de luxo*, aqui é o seu lugar"
  carousel_property_ids: string[];
}
```

**Novo tipo FeaturedBannerSettings:**
```typescript
interface FeaturedBannerSettings {
  tagline: string;
  title: string;
  background_image: string;
  buttons: { label: string; href: string }[];
}
```

**Migração de dados**: Nenhuma migration SQL necessária — os dados são armazenados como JSON na coluna `value` da tabela `site_settings`. Os novos formatos serão gravados automaticamente ao salvar.

