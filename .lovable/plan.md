## Causa

Mismatch de campo no `site_settings.team.members`:
- Admin (`SiteSettings.tsx`) salva cada membro como `{ name, role, creci, photo }`.
- `TeamSection.tsx` lê `member.avatar`, então `member.avatar` é sempre `undefined` e cai no fallback com a inicial do nome ("W", "R", "A"...).

## Correção

Em `src/components/TeamSection.tsx`:
- Atualizar a interface `TeamMember` para `{ name, role, photo?, avatar?, creci? }` (aceitando ambos por compatibilidade com dados antigos).
- Usar `member.photo ?? member.avatar` no `<img src>` e na condicional.

Nada muda no admin nem no schema — só o leitor passa a usar a chave correta.
