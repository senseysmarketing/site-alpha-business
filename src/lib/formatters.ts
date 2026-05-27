export const formatPrice = (price: number | null): string => {
  if (!price) return "Sob consulta";
  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });
};
