import { X } from "lucide-react";
import type { PropertySearchFilters } from "./types";

interface Props {
  filters: PropertySearchFilters;
  onRemove: (key: keyof PropertySearchFilters) => void;
}

const fmtBRL = (n: number) =>
  n >= 1_000_000
    ? `R$ ${(n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`
    : `R$ ${(n / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`;

const AiChatFiltersSummary = ({ filters, onRemove }: Props) => {
  const chips: { key: keyof PropertySearchFilters; label: string }[] = [];
  if (filters.transactionType)
    chips.push({ key: "transactionType", label: filters.transactionType === "venda" ? "Venda" : "Locação" });
  if (filters.propertyType) chips.push({ key: "propertyType", label: filters.propertyType });
  if (filters.condominium) chips.push({ key: "condominium", label: filters.condominium });
  if (filters.neighborhood) chips.push({ key: "neighborhood", label: filters.neighborhood });
  if (filters.city) chips.push({ key: "city", label: filters.city });
  if (filters.address) chips.push({ key: "address", label: `região: ${filters.address}` });
  if (filters.minBedrooms) chips.push({ key: "minBedrooms", label: `${filters.minBedrooms}+ suítes` });
  if (filters.minParking) chips.push({ key: "minParking", label: `${filters.minParking}+ vagas` });
  if (filters.minArea) chips.push({ key: "minArea", label: `${filters.minArea}m²+` });
  if (filters.minPrice) chips.push({ key: "minPrice", label: `Min ${fmtBRL(filters.minPrice)}` });
  if (filters.maxPrice) chips.push({ key: "maxPrice", label: `Até ${fmtBRL(filters.maxPrice)}` });
  if (filters.maxCondoFee) chips.push({ key: "maxCondoFee", label: `Cond. ≤ ${fmtBRL(filters.maxCondoFee)}/mês` });
  if (filters.maxIptu) chips.push({ key: "maxIptu", label: `IPTU ≤ ${fmtBRL(filters.maxIptu)}/ano` });
  (filters.highlights ?? []).forEach((h) => chips.push({ key: "highlights", label: h }));

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/60 mt-2">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground self-center mr-1">Filtros:</span>
      {chips.map((c, i) => (
        <button
          key={`${String(c.key)}-${i}`}
          onClick={() => onRemove(c.key)}
          className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-foreground hover:bg-muted/70"
        >
          {c.label}
          <X size={10} />
        </button>
      ))}
    </div>
  );
};

export default AiChatFiltersSummary;
