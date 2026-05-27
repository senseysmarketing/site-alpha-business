## Objetivo
Exibir o preloader apenas no primeiro acesso do visitante, evitando que ele apareça em recarregamentos ou navegações subsequentes.

## Mudanças

**`src/pages/Index.tsx`**
- Adicionar uma constante `PRELOADER_KEY = "preloader_seen"`.
- Inicializar `loaded` com `true` se `localStorage.getItem(PRELOADER_KEY) === "1"` (já viu antes → pula preloader). Caso contrário `false`.
- Renderizar `<Preloader />` somente quando `!loaded` for o estado inicial (ou seja, primeira visita).
- No `handleComplete`, gravar `localStorage.setItem(PRELOADER_KEY, "1")` antes de marcar `loaded = true`.

## Observações
- Persistência por navegador/dispositivo (localStorage). Quem limpar o cache verá o preloader de novo — comportamento esperado para "novo usuário".
- Sem mudanças em `Preloader.tsx`, rotas ou backend.
- Não afeta admin (preloader só é montado em `Index`).
