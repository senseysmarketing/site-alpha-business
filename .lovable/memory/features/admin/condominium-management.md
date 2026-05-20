---
name: Condominium Management
description: Tela admin /admin/condominios para gerenciar região, descrição e destaques exibidos no detalhe do imóvel
type: feature
---
Tabela `condominiums` (Supabase) com `name` (unique), `region`, `city`, `description`, `highlights` (jsonb array `{icon,label}`), `cover_image`, `is_active`. RLS: leitura pública, escrita só admin.

Tela `/admin/condominios` (admin only): listagem em tabela Quiet Luxury com busca, dialog de edição com nome/região/cidade/descrição/switch ativo e editor dinâmico de destaques (seletor de ícone lucide via `LUCIDE_ICON_MAP` em `src/lib/lucideIconMap.ts` + label). Botão "Sincronizar com imóveis" varre `properties.condominium` distintos e cria entradas vazias para condomínios ainda não cadastrados.

Matching com imóveis: por nome normalizado (lowercase + sem acento + trim) via `normalizeCondoName`. `PropertyDetail.tsx` busca o condomínio correspondente e usa `region`/`city`/`description`/`highlights` na seção "Sobre o bairro" (`PropertyNeighborhood.tsx`), sobrescrevendo o subtitle do hero quando há `region`/`city` cadastrados. Sem FK na tabela `properties`.

Fallback: se o imóvel não tem condomínio cadastrado em `condominiums`, mostra apenas `neighborhood`/`city` do próprio imóvel como título e oculta descrição e grid de destaques (sem texto fixo de Alphaville).
