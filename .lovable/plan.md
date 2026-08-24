# Corrigir erro ao salvar edição de lead

## O que está acontecendo

Ao salvar a edição de um lead, o modal pede ao banco que devolva o lead já com os dados do responsável através de um relacionamento direto entre a tabela de leads e a tabela de perfis da equipe. Esse relacionamento não existe no banco: o campo de responsável do lead aponta para os usuários de autenticação, não para os perfis da equipe. Por isso o banco responde com "Could not find a relationship ... 'team_profiles'" e a alteração aparece como erro — mesmo o telefone tendo sido atualizado.

O restante do CRM não sofre disso porque a tela de leads busca os perfis da equipe separadamente e cruza os dados no próprio aplicativo.

## Correção

No modal de edição de lead (`src/components/admin/crm/LeadEditModal.tsx`):

- Remover o trecho do `select` que tenta embutir `team_profiles!leads_assigned_user_id_fkey`.
- Manter o retorno com `*` e o imóvel vinculado (`properties:property_id(title, photos, code)`).
- Ao devolver o lead atualizado para a tela, reaproveitar o objeto de responsável que o lead já carregava (`lead.assigned_user`), preservando avatar e nome no card sem depender do banco.
- Nada muda no banco de dados nem nas permissões.

## Verificação

Abrir um lead em /admin/leads, alterar o telefone e salvar: deve exibir "Lead atualizado" e o card refletir o novo número, com o responsável intacto.
