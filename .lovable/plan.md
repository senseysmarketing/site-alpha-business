

## Ajuste da Seção de Regiões — Layout e Lógica Dinâmica

### Mudanças

#### 1. Layout: Botões na linha debaixo
Cada item do grid passa de uma row horizontal (`flex items-center justify-between`) para um layout vertical:
- Linha 1: Nome do condomínio
- Linha 2: Botões "COMPRAR | ALUGAR" abaixo do título

#### 2. Lógica dinâmica com dados do Supabase
- Ao montar o componente, fazer query na tabela `properties` agrupando por `condominium` e `transaction_type` onde `status = 'ativo'`
- Construir um Map com a estrutura: `{ condominium → { hasVenda: bool, hasAluguel: bool } }`
- Filtrar a lista para exibir **apenas condomínios que possuem pelo menos 1 imóvel ativo**
- Mostrar botão "COMPRAR" somente se `hasVenda`, "ALUGAR" somente se `hasAluguel`
- Mostrar skeleton/loading enquanto carrega

### Arquivo: `src/components/AlphavilleMapSection.tsx`

**Query Supabase:**
```ts
const { data } = await supabase
  .from("properties")
  .select("condominium, transaction_type")
  .eq("status", "ativo")
  .not("condominium", "is", null);
```

Processar `data` para gerar o Map de disponibilidade e renderizar apenas os condomínios presentes.

