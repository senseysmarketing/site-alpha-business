

## Tela de "Site em Construção" com Senha de Acesso

### Como funciona
- Um componente `SiteGate` envolve todo o `App`
- Ao acessar o site, verifica no `localStorage` se já foi desbloqueado
- Se não, mostra tela elegante de "Site em Construção" com campo de senha
- Senha correta (`@Alpha123`) → salva no `localStorage` e mostra o site
- Senha errada → mostra erro
- Rotas `/admin/*` ficam livres (equipe admin não precisa da senha extra)

### Arquivos

**1. Criar `src/components/SiteGate.tsx`**
- Estado `unlocked` baseado em `localStorage.getItem("site_access")`
- Tela com logo, texto "Site em Construção", campo de senha, botão "Acessar"
- Visual alinhado com o branding (cores bordeaux/cashmere, font Raleway)
- Ao acertar a senha, seta `localStorage` e libera acesso

**2. Editar `src/App.tsx`**
- Envolver o conteúdo do `App` com `<SiteGate>`
- O `SiteGate` verifica a rota atual — se começa com `/admin`, passa direto sem pedir senha

### Detalhes técnicos
- Senha hardcoded no cliente (aceitável pois é temporário, não protege dados sensíveis)
- `localStorage` key: `"site_access"` com valor `"granted"`
- Para remover futuramente: basta deletar o `SiteGate` e seu import

