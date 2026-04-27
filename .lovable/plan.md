# Correções de responsividade

## Diagnóstico (a partir do print)

O print foi tirado em ~1366px de largura. Dois problemas claros:

### 1. Header — colisão entre logos e quebra do menu
No `Header.tsx`, o menu desktop ativa em `lg:` (1024px). Entre **1024px e ~1440px**, a soma dos elementos (logo + 6 itens de nav + botão "Anuncie seu imóvel") não cabe no padding `lg:px-24`. Resultado visível no print:
- A logo "Rafael Albuquerque / Prepare-se para sonhar alto" colide e se sobrepõe ao logo central "Alpha Business" (mas o Header só tem **um** logo — a sobreposição na verdade é entre o logo e o início da navegação, e "FALE CONOSCO" quebra em duas linhas).
- "FALE CONOSCO" aparece quebrado em 2 linhas.
- Falta `whitespace-nowrap` nos itens de nav.

### 2. Hero — botão "SAIBA MAIS" coberto pelo card de busca
`SearchBarSection` usa `-mt-10` para sobrepor o card branco sobre o final do Hero. Em monitores onde `75vh` é curto (~700-800px de altura), o card cobre exatamente o CTA "SAIBA MAIS" do slide, como visto no print (botão circulado pelo usuário).

---

## Correções

### A. Header (`src/components/Header.tsx`)
1. **Adiar a navegação desktop para `xl:` (1280px)** em vez de `lg:` (1024px), e usar o menu hamburguer em telas médias. Isso elimina a janela 1024–1280px onde tudo se aperta.
2. **Reduzir o padding lateral em `lg`** de `lg:px-24` para `lg:px-8 xl:px-16 2xl:px-24`, dando mais espaço para o conteúdo respirar.
3. **Adicionar `whitespace-nowrap`** em cada item de nav para impedir quebra de "Fale Conosco".
4. **Reduzir o gap em `xl`** (`xl:gap-6 2xl:gap-10`) para acomodar 6 itens + botão sem espremer.

### B. Hero (`src/components/HeroSection.tsx`)
1. **Aumentar a altura mínima** para garantir espaço ao CTA: `min-h-[640px] h-[85vh] md:h-[90vh]` em vez de `h-[75vh] md:h-[80vh]`. Assim o conteúdo (tagline + título + descrição + botão) não fica espremido contra o card de busca.
2. **Adicionar `pb-24 md:pb-32`** no container de conteúdo do Hero, reservando espaço inferior para o card flutuante não cobrir o CTA.

### C. SearchBarSection (`src/components/SearchBarSection.tsx`)
1. **Reduzir a sobreposição negativa** de `-mt-10` para `-mt-6 md:-mt-10`, e em telas pequenas/médias garantir que o card não invada o CTA do hero (combinado com o padding inferior do Hero acima).
2. Manter o restante do layout intacto.

---

## Detalhes técnicos

**Header.tsx**
- Linha 46: `px-6 md:px-12 lg:px-24` → `px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-24`
- Linha 55: `hidden lg:flex items-center gap-6 xl:gap-10` → `hidden xl:flex items-center gap-5 2xl:gap-8`
- Linhas 61 e 69: adicionar `whitespace-nowrap` à classe dos links
- Linha 77: `hidden lg:flex` → `hidden xl:flex`
- Linha 88: `lg:hidden` → `xl:hidden`
- Linhas 94, 96: `lg:hidden` → `xl:hidden`

**HeroSection.tsx**
- Linha 116: `h-[75vh] md:h-[80vh]` → `min-h-[640px] h-[85vh] md:h-[90vh]`
- Linha 124: idem
- Linha 173: adicionar `pb-24 md:pb-32` ao container de conteúdo
- Linhas 246, 275: ajustar `bottom-24/bottom-28/bottom-32` para acompanhar (subir um pouco para ficarem acima do card de busca)

**SearchBarSection.tsx**
- Linha 177: `-mt-10` → `-mt-6 md:-mt-10`

---

## Não incluído / fora de escopo
- Não vou mexer nos demais componentes (Lifestyle, Featured, Footer, etc.) — eles já usam `max-w-7xl mx-auto` com paddings consistentes e não há indícios de problema no print.
- Caso o usuário reporte problemas adicionais em outras seções após esta correção, atacaremos individualmente.

Após aprovação, faço as edições e o usuário pode validar no preview.