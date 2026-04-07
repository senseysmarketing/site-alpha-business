

## Ajustes: Header Transparente + Fundo Clean

O header atual usa `bg-[hsl(350,60%,5%)]` fixo (sempre escuro). Conforme o print de referência, ele deve ser **transparente** sobre o hero e ficar escuro apenas ao scrollar.

### 1. Header com transparência e scroll detection
**Arquivo:** `src/components/Header.tsx`
- Adicionar `useState` + `useEffect` para detectar scroll (`window.scrollY > 50`)
- Estado padrão: `bg-transparent` (sem fundo, sobrepõe o hero)
- Após scroll: `bg-[#2A070C]/95 backdrop-blur-md` com transição suave (`transition-all duration-300`)
- Menu mobile mantém fundo escuro quando aberto

### 2. Remover padding-top do Hero
**Arquivo:** `src/components/HeroSection.tsx`
- Verificar e remover qualquer `pt-` ou `mt-` que compense o header opaco
- O hero deve começar do topo absoluto da página, com o header transparente sobreposto

### Arquivos a editar
- `src/components/Header.tsx`
- `src/components/HeroSection.tsx`

