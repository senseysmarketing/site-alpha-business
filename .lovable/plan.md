

## Hero — Overlay Degradê para Legibilidade do Título

Adicionar um degradê preto sutil partindo da esquerda em direção ao centro do Hero, melhorando o contraste do título sem escurecer a imagem inteira.

### Mudança em `src/components/HeroSection.tsx`

Adicionar uma camada de overlay logo após a mídia (vídeo/imagem) e antes da camada de conteúdo:

```tsx
<div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent pointer-events-none" />
```

- **Direção**: `to-r` (esquerda → direita).
- **Intensidade**: `from-black/60` na borda esquerda (onde está o texto), `via-black/30` no meio, `to-transparent` antes da metade — preserva a imagem do imóvel à direita.
- **Posição**: sobreposto à mídia mas abaixo do conteúdo (`z-index` natural pela ordem do DOM).
- **`pointer-events-none`**: garante que o overlay não intercepte cliques no carrossel/CTA.

### Compatibilidade

- Funciona igual para slides com vídeo ou imagem (Ken Burns).
- Não interfere nos dots de navegação nem no botão pause (já posicionados com `z-20`).
- Mobile: o degradê funciona bem mesmo em telas estreitas porque o título sempre ocupa o lado esquerdo.

### Observações

- Sem mudança de tokens nem de tipografia.
- Se ficar escuro demais, fácil ajustar de `/60` para `/40` depois.

