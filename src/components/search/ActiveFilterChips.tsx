import { X } from "lucide-react";
import { useSearchParams } from "react-router-dom";

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

const brl = (v: number) => {
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `R$ ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace(".", ",")} mi`;
  }
  if (v >= 1_000) return `R$ ${Math.round(v / 1_000)} mil`;
  return `R$ ${v}`;
};

interface Chip {
  label: string;
  keys: string[];
}

/**
 * Chips de todos os filtros ativos na URL, cada um removível individualmente.
 */
const ActiveFilterChips = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const get = (k: string) => searchParams.get(k);
  const num = (k: string) => {
    const v = get(k);
    const n = v ? Number(v) : NaN;
    return Number.isFinite(n) ? n : null;
  };

  const chips: Chip[] = [];

  const propertyType = get("propertyType");
  if (propertyType)
    chips.push({ label: typeLabels[propertyType] || titleCase(propertyType), keys: ["propertyType"] });

  const tx = get("transactionType");
  if (tx)
    chips.push({
      label: tx === "venda" ? "Venda" : tx === "ambos" ? "Venda e Locação" : "Locação",
      keys: ["transactionType"],
    });

  const condominium = get("condominium");
  if (condominium) chips.push({ label: condominium, keys: ["condominium"] });

  const city = get("city");
  if (city) chips.push({ label: titleCase(city), keys: ["city"] });

  const neighborhood = get("neighborhood");
  if (neighborhood) chips.push({ label: titleCase(neighborhood), keys: ["neighborhood"] });

  const minPrice = num("minPrice");
  const maxPrice = num("maxPrice");
  if (minPrice != null || maxPrice != null) {
    const label =
      minPrice != null && maxPrice != null
        ? `Venda ${brl(minPrice)} – ${brl(maxPrice)}`
        : minPrice != null
          ? `Venda a partir de ${brl(minPrice)}`
          : `Venda até ${brl(maxPrice as number)}`;
    chips.push({ label, keys: ["minPrice", "maxPrice"] });
  }

  const minRent = num("minRent");
  const maxRent = num("maxRent");
  if (minRent != null || maxRent != null) {
    const label =
      minRent != null && maxRent != null
        ? `Aluguel ${brl(minRent)} – ${brl(maxRent)}`
        : minRent != null
          ? `Aluguel a partir de ${brl(minRent)}`
          : `Aluguel até ${brl(maxRent as number)}`;
    chips.push({ label, keys: ["minRent", "maxRent"] });
  }

  const minArea = num("minArea");
  const maxArea = num("maxArea");
  if (minArea != null || maxArea != null) {
    const label =
      minArea != null && maxArea != null
        ? `${minArea} – ${maxArea} m²`
        : minArea != null
          ? `A partir de ${minArea} m²`
          : `Até ${maxArea} m²`;
    chips.push({ label, keys: ["minArea", "maxArea"] });
  }

  const minBedrooms = num("minBedrooms");
  if (minBedrooms) chips.push({ label: `${minBedrooms}+ suítes`, keys: ["minBedrooms"] });

  const minBathrooms = num("minBathrooms");
  if (minBathrooms) chips.push({ label: `${minBathrooms}+ banheiros`, keys: ["minBathrooms"] });

  const minParking = num("minParking");
  if (minParking) chips.push({ label: `${minParking}+ vagas`, keys: ["minParking"] });

  if (get("featured") === "1") chips.push({ label: "Somente destaques", keys: ["featured"] });

  const tag = get("tag");
  if (tag) chips.push({ label: `Estilo de vida: ${tag}`, keys: ["tag"] });

  const q = (get("q") || "").trim();
  if (q) chips.push({ label: `Busca: "${q}"`, keys: ["q"] });

  if (chips.length === 0) return null;

  const remove = (keys: string[]) => {
    const next = new URLSearchParams(searchParams);
    keys.forEach((k) => next.delete(k));
    setSearchParams(next);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {chips.map((chip) => (
        <button
          key={chip.keys.join("-")}
          onClick={() => remove(chip.keys)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-body text-[11px] text-foreground hover:bg-muted transition-colors"
        >
          {chip.label}
          <X size={11} className="text-muted-foreground" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          onClick={() => setSearchParams(new URLSearchParams())}
          className="text-body text-[11px] tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors px-1"
        >
          Limpar tudo
        </button>
      )}
    </div>
  );
};

export default ActiveFilterChips;
