

## Refatorar Layout da Página Inicial (com Mapa SVG mantido)

Baseado no print de referência, reorganizando toda a homepage.

### Estrutura final da página

```text
┌─────────────────────────────────────────────┐
│ Header (escuro, opaco, sólido)              │
├─────────────────────────────────────────────┤
│ Hero (carrossel imagens + overlay texto)    │
├─────────────────────────────────────────────┤
│ Barra de Busca IA (card branco flutuante)  │
├─────────────────────────────────────────────┤
│ Propriedades Especiais (carrossel 3 cards) │
├─────────────────────────────────────────────┤
│ Banner Alphaville (card escuro + CTAs)     │
├─────────────────────────────────────────────┤
│ Redes Sociais (3 cards grandes)            │
├─────────────────────────────────────────────┤
│ Nossa Equipe (avatares + carrossel)        │
├─────────────────────────────────────────────┤
│ Contato                                     │
├─────────────────────────────────────────────┤
│ Mapa Interativo Alphaville (visual novo)   │
├─────────────────────────────────────────────┤
│ Footer                                      │
└─────────────────────────────────────────────┘
```

---

### 1. Refatorar Header
**Arquivo:** `src/components/Header.tsx`
- Remover utility bar superior (Instagram/YouTube/telefone)
- Fundo sólido escuro (`bg-[#2a0a0a]` / bordeaux escuro) em vez de glass panel
- Nav items: "Buscar", "Venda", "Locação", "Serviços", "Fale Conosco"
- Botão CTA "Acessar meu imóvel" no lugar do botão WhatsApp
- Logo e links em branco

### 2. Refatorar HeroSection
**Arquivo:** `src/components/HeroSection.tsx`
- Trocar vídeo por carrossel de imagens (Embla) com dots de navegação
- Reduzir altura para ~65vh
- Overlay com texto: "Prepare-se para sonhar alto..." + itálico
- Info do imóvel no canto inferior (condomínio, localização)
- **Remover** barra de busca daqui (vai para componente separado)

### 3. Criar SearchBarSection (novo)
**Arquivo:** `src/components/SearchBarSection.tsx`
- Card branco com sombra, margin-top negativo para flutuar sobre o hero
- Título "Encontre seu imóvel com o Rafa IA"
- Toggle "Cognitivo / Busca tradicional"
- Input com mic + botão buscar
- Reutilizar lógica de busca IA existente do HeroSection

### 4. Refatorar Propriedades
**Arquivo:** `src/components/NewArrivalsSection.tsx`
- Título: "Nossas propriedades especiais em Alphaville, Tamboré e Santana de Parnaíba"
- Carrossel Embla horizontal com 3 cards visíveis
- Cards: imagem + badges (tipo, código), specs (área, suítes, vagas), preço BRL, botão "Saiba Mais"
- Buscar imóveis do Supabase com fallback mock

### 5. Criar Banner Alphaville (substituir FeaturedPropertySection)
**Arquivo:** `src/components/FeaturedPropertySection.tsx`
- Card escuro com imagem de fundo e overlay
- Texto: "As propriedades mais que especiais em Alphaville"
- 3 botões CTA: "Tamboré I", "Tamboré II", "Tamboré III"

### 6. Refatorar InstitutionalSection → Redes Sociais
**Arquivo:** `src/components/InstitutionalSection.tsx`
- Remover blog editorial
- Título + handle Instagram à direita
- 3 cards grandes de posts do Instagram

### 7. Criar TeamSection (novo)
**Arquivo:** `src/components/TeamSection.tsx`
- Título "Nossa **Equipe**"
- Carrossel de avatares circulares com nome e cargo
- Dados de `site_settings` key `team`

### 8. Refatorar AlphavilleMapSection (visual novo, posição nova)
**Arquivo:** `src/components/AlphavilleMapSection.tsx`
- Manter mapa SVG interativo e toda a lógica de pins/tooltips
- Atualizar visual: fundo escuro (bordeaux/dark) em vez de `bg-background`
- Textos em branco, pins e tooltips com estilo coerente com novo design
- Bordas e cards com estética do novo layout

### 9. Atualizar Index.tsx
**Arquivo:** `src/pages/Index.tsx`
- Remover `LifestyleSection`
- Nova ordem: Header → Hero → SearchBar → NewArrivals → FeaturedProperty(Banner) → Institutional(Social) → Team → Contact → AlphavilleMap → Footer

### 10. Remover LifestyleSection
- Remover import de `Index.tsx` (arquivo pode permanecer para não quebrar imports em outros locais)

### Arquivos a criar
- `src/components/SearchBarSection.tsx`
- `src/components/TeamSection.tsx`

### Arquivos a editar
- `src/components/Header.tsx`
- `src/components/HeroSection.tsx`
- `src/components/NewArrivalsSection.tsx`
- `src/components/FeaturedPropertySection.tsx`
- `src/components/AlphavilleMapSection.tsx`
- `src/components/InstitutionalSection.tsx`
- `src/pages/Index.tsx`

