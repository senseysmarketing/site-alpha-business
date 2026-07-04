## Objetivo
Retirar a tela de senha de acesso "Site em Construção", liberando o site publicamente.

## Alterações

### 1. `src/App.tsx`
- Remover o import de `SiteGate`.
- Remover o wrapper `<SiteGate>` ao redor de `<AnimatedRoutes />` e `<FloatingWhatsApp />`, deixando-os diretamente no JSX.

### 2. `src/components/SiteGate.tsx`
- Remover o arquivo completo (componente deixa de existir).

## Fora do escopo
- Nenhuma alteração em rotas, autenticação do admin, estilos ou outras páginas.

## Resultado esperado
O site público (`/`, `/imovel/:id`, `/busca`, `/blog`, etc.) será acessível sem senha. A área `/admin` continua protegida pelo login normal.