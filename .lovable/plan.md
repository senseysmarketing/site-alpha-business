

## Remover ícone do Instagram no hover

Ajuste simples em `src/components/InstitutionalSection.tsx`: remover o `<div>` de overlay que contém o ícone do Instagram. Manter apenas o efeito de zoom (`scale-[1.03]`) e o overlay Bordeaux sutil sem o ícone centralizado.

### Arquivo
`src/components/InstitutionalSection.tsx` — remover o bloco `<div className="absolute inset-0 bg-bordeaux/10 ...">` com o ícone `<Instagram>` de dentro do `<a>` dos posts.

