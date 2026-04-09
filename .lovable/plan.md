

## Mover botão "Assistir Tour em Vídeo" para a parte inferior da imagem

### Problema
O botão está posicionado com `top-8 right-6`, ficando atrás do header transparente (z-50) que agora sobrepõe a galeria.

### Mudança em `src/components/property/PropertyGallery.tsx`

**Desktop (linha 43):** Trocar `top-8 right-6` por `bottom-8 left-6` — posiciona o botão no canto inferior esquerdo da imagem principal, longe do header e do botão "Explorar todas as fotos" (que fica no canto inferior direito da imagem menor).

**Mobile (linha 99):** Trocar `top-4 right-4` por `bottom-14 right-4` — posiciona abaixo do header e acima do botão de fotos que já está em `bottom-4`.

