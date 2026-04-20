

## Hero Cinematográfica — Plano Final com Refinamentos

Carrossel cinematográfico estilo GWM Motors com cross-fade, barras de progresso animadas, controles glassmorphism e os 3 refinamentos solicitados.

### Comportamento base
- 3 slides de mansões em destaque (Supabase via `hero.carousel_property_ids`, fallback `mockProperties`).
- Auto-advance a cada **5 segundos** por slide, controlado por `setInterval` de 50ms incrementando `progress` (0–100).
- Cross-fade suave entre slides (Framer Motion, `opacity` animado, sem Embla).
- `AnimatePresence mode="wait"` no bloco de texto (slide-up + fade-in/out, `key={activeIndex}`).
- Altura `h-[75vh] md:h-[80vh]`.

### Refinamento 1 — Mídia Dinâmica
- Cada slide pode ter **`video_url`** (4K) ou **imagem**.
- **Vídeo**: `<video autoPlay muted loop playsInline preload="metadata">` cobrindo o slide com `object-cover`.
- **Imagem**: efeito **Ken Burns** suave — animação CSS/Motion de `scale(1) → scale(1.08)` ao longo dos 5s do slide ativo, com `transform-origin` alternando levemente entre slides para evitar repetição.
- Detecção: se `slide.video_url` existir → renderiza `<video>`; senão renderiza `<img>` com Ken Burns.
- Pré-carregamento do próximo slide em background para evitar flash.

### Refinamento 2 — Tagline Editorial
- Título do slide segue prioridade:
  1. **`property.short_pitch`** (campo "Chamada Curta", se existir no schema/`site_settings`)
  2. **`property.title`**
  3. Fallback: `[condominium, neighborhood, city].filter(Boolean).join(" · ")` (endereço)
- Subtítulo/descrição: usa o endereço completo ou descrição curta (truncada).
- *Observação técnica*: a tabela `properties` atual não tem `short_pitch`. Vou ler o campo de forma defensiva (`(p as any).short_pitch`) — se não existir, cai automaticamente no `title`. Em uma próxima etapa podemos adicionar a coluna via migração se você quiser editar a chamada curta no admin.

### Refinamento 3 — Pausa Inteligente
- Estado `isPaused` combinado: `isPausedManual || isHovered`.
- `onMouseEnter` no **conteúdo do slide** (bloco do texto + botão "Saiba Mais") → `setIsHovered(true)`.
- `onMouseLeave` → `setIsHovered(false)`.
- `setInterval` só incrementa `progress` quando `!isPaused`. Vídeo continua tocando (visual fluido), apenas o cronômetro pausa.
- Botão Play/Pause manual no canto inferior direito controla `isPausedManual` independentemente.
- Ícone do botão reflete o estado real (mostra "Play" se manual ou hover estiverem ativos).

### Refinamento 4 — Mobile
- Barra única ultra-fina **1px** (`h-px`) full-width no rodapé absoluto da seção, preenchendo da esquerda para direita conforme `progress`.
- Sem barras múltiplas no mobile, sem setas, sem botão play/pause visível (ocultos com `hidden md:flex`).
- Vídeo/foto ocupa 100% vertical (75vh).

### Controles desktop (md+)
- **Setas** finas (`ChevronLeft/Right`, `strokeWidth={1.25}`) nas extremidades, opacity 0 → 100 no hover do `<section>`. Glassmorphism: `bg-white/10 backdrop-blur-md border border-white/20`.
- **Barras de progresso** horizontais (uma por slide, ~80px × 2px) no canto inferior esquerdo. Ativa preenche; anteriores 100%; futuras vazias. Clicáveis para pular.
- **Play/Pause** ao lado das barras com mesma estética glassmorphism.
- **Botão "Saiba Mais"** por slide com fundo `#2A070C` (Midnight Bordeaux), texto branco, link para `/imovel/:id`.

### Estrutura técnica
```text
HeroSection
├── <section h-[75vh] md:h-[80vh] onMouseEnter/Leave (setas)>
│   ├── slides absolutos (cross-fade via opacity)
│   │   └── video OU img+KenBurns + gradient overlay
│   ├── conteúdo (onMouseEnter/Leave → isHovered)
│   │   └── AnimatePresence: tagline / título / descrição / botão "Saiba Mais"
│   ├── setas hidden md:flex (hover-only)
│   └── controles inferior:
│       ├── desktop: barras + play/pause (glassmorphism)
│       └── mobile: barra única 1px full-width
```

Estados: `activeIndex`, `progress`, `isPausedManual`, `isHovered`, `isHoveredSection`.

### Arquivos
| Ação | Arquivo |
|------|---------|
| Reescrever | `src/components/HeroSection.tsx` |

Sem mudanças em outros arquivos. Próximas etapas (footer, seções, etc.) virão depois.

