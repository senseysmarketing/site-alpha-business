export const onlyDigits = (value: string | null | undefined): string =>
  (value || "").replace(/\D/g, "");

/**
 * Aplica máscara brasileira de telefone: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.
 * Aceita entrada parcial e remove DDI 55 quando presente (>11 dígitos).
 */
export const formatBRPhone = (value: string | null | undefined): string => {
  let digits = onlyDigits(value);
  if (digits.length > 11) digits = digits.slice(-11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
};
