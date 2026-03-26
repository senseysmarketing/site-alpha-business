

## Adicionar máscara de moeda nos campos financeiros

### O que será feito
Criar uma função helper `formatCurrencyInput` que aplica a máscara brasileira de moeda (R$ 1.234,56) nos campos de valor, atualizando em tempo real conforme o usuário digita. A máscara trabalha apenas com dígitos internamente e exibe o valor formatado.

### Campos afetados

**Dialog "Nova Transação":**
- Valor da Venda (R$) — linha 287-292
- Repasse Corretor (R$) — linha 306-311

**Dialog "Nova Despesa":**
- Valor (R$) — linha 367-372

### Abordagem técnica

**Arquivo:** `src/pages/admin/Financial.tsx`

1. Adicionar helper `applyCurrencyMask(value: string): string` que:
   - Remove tudo que não é dígito
   - Converte para centavos e formata como `1.234,56`
   
2. Adicionar helper `parseCurrencyToFloat(masked: string): number` que:
   - Remove pontos e troca vírgula por ponto para obter o float na hora de salvar

3. Trocar os 3 inputs de `type="number"` para `type="text"` e aplicar a máscara no `onChange`

4. Ajustar `handleAddExpense` e `handleAddTransaction` para usar `parseCurrencyToFloat` ao inserir no Supabase

5. O campo de Comissão (%) permanece sem máscara de moeda (é percentual)

