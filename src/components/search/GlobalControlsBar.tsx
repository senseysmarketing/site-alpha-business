import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CondoAutocomplete from "@/components/search/CondoAutocomplete";

const typeLabels: Record<string, string> = {
  casa: "Casa",
  apartamento: "Apartamento",
  terreno: "Terreno",
  cobertura: "Cobertura",
  sobrado: "Sobrado",
  chacara: "Chácara",
  comercial: "Comercial",
};

const titleCase = (s: string) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());

interface Props {
  propertyTypes: string[];
}

const pillBase =
  "text-body text-[11px] tracking-[0.1em] uppercase px-3.5 py-1.5 rounded-full border transition-colors whitespace-nowrap";
const pillOn = "bg-primary text-primary-foreground border-primary";
const pillOff = "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted";

/**
 * Controles globais rápidos (transação, tipo de imóvel e condomínio).
 * Escrevem direto na URL — a página já deriva os filtros de searchParams.
 */
const GlobalControlsBar = ({ propertyTypes }: Props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTx = searchParams.get("transactionType") || "all";
  const currentType = searchParams.get("propertyType") || "all";
  const currentCondo = searchParams.get("condominium") || "";

  const [condoInput, setCondoInput] = useState(currentCondo);
  useEffect(() => setCondoInput(currentCondo), [currentCondo]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    // Faixas dependem da categoria: ao trocar, elas são recalculadas.
    ["minPrice", "maxPrice", "minRent", "maxRent", "minArea", "maxArea"].forEach((k) =>
      next.delete(k)
    );
    setSearchParams(next);
  };

  const txOptions = [
    { value: "all", label: "Tudo" },
    { value: "venda", label: "Venda" },
    { value: "locacao", label: "Locação" },
  ];

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-1 px-1">
        {txOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setParam("transactionType", opt.value)}
            className={`${pillBase} ${currentTx === opt.value ? pillOn : pillOff}`}
          >
            {opt.label}
          </button>
        ))}

        {propertyTypes.length > 0 && (
          <span className="h-4 w-px bg-border mx-1 shrink-0" aria-hidden />
        )}

        <button
          onClick={() => setParam("propertyType", "all")}
          className={`${pillBase} ${currentType === "all" ? pillOn : pillOff}`}
        >
          Todos os tipos
        </button>
        {propertyTypes.map((t) => (
          <button
            key={t}
            onClick={() => setParam("propertyType", t)}
            className={`${pillBase} ${currentType === t ? pillOn : pillOff}`}
          >
            {typeLabels[t] || titleCase(t)}
          </button>
        ))}
      </div>

      <div className="lg:ml-auto w-full lg:w-[240px]">
        <CondoAutocomplete
          value={condoInput}
          placeholder="Trocar de condomínio"
          onChange={(v) => {
            setCondoInput(v);
            if (v === "" && currentCondo) setParam("condominium", null);
          }}
          onSelect={(v) => setParam("condominium", v)}
          className="w-full bg-background border border-border rounded-full pl-4 pr-8 py-2 text-body text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
        />

      </div>
    </div>
  );
};

export default GlobalControlsBar;
