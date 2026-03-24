

## Correcoes: Instagram + Mascara de Telefone — Todos os Componentes

### Problema
1. **Instagram hardcoded** em `InstitutionalSection.tsx` (linha 127: `@alphabusiness`, linha 146: `instagram.com/alphabusiness`) — nao usa `useSiteSettings`
2. **Instagram sem "@"** no `Header.tsx` (linha 44: `instagram.replace("@", "")` remove o @)
3. **Telefone sem formatacao** no Header (linha exibicao) e Footer

### Mudancas

**1. `src/lib/utils.ts`** — Adicionar helper `formatPhone`
- Recebe string de digitos, retorna `(XX) XXXXX-XXXX` ou `(XX) XXXX-XXXX`

**2. `src/components/Header.tsx`**
- Exibir instagram COM "@": `{instagram.startsWith("@") ? instagram : "@" + instagram}`
- URL do link: remover "@" apenas na href
- Aplicar `formatPhone` no telefone exibido

**3. `src/components/Footer.tsx`**
- Aplicar `formatPhone` no telefone

**4. `src/components/InstitutionalSection.tsx`**
- Importar `useSiteSettings` com key `contact`
- Substituir `@alphabusiness` hardcoded (linha 127) pelo valor do DB
- Substituir `instagram.com/alphabusiness` hardcoded (linha 146) pela URL dinamica
- Fallback para "alphabusiness" se DB vazio

**5. `src/pages/admin/SiteSettings.tsx`**
- Aplicar mascara de telefone no onChange do campo phone (formatar enquanto digita)

### Arquivos

| Arquivo | Acao |
|---|---|
| `src/lib/utils.ts` | Adicionar `formatPhone` |
| `src/components/Header.tsx` | Fix "@" + formatPhone |
| `src/components/Footer.tsx` | formatPhone |
| `src/components/InstitutionalSection.tsx` | Integrar `useSiteSettings("contact")` para instagram |
| `src/pages/admin/SiteSettings.tsx` | Mascara no input telefone |

