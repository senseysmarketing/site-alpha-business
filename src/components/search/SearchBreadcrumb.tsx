import { ChevronRight, Home } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const typeLabels: Record<string, string> = {
  casa: "Casas",
  apartamento: "Apartamentos",
  terreno: "Terrenos",
  cobertura: "Coberturas",
  sobrado: "Sobrados",
  chacara: "Chácaras",
  comercial: "Comerciais",
};

const txLabels: Record<string, string> = {
  venda: "Venda",
  locacao: "Locação",
  aluguel: "Locação",
  ambos: "Venda e Locação",
};

const titleCase = (s: string) =>
  s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());

interface Crumb {
  label: string;
  /** URL params preserved when this crumb is clicked. */
  keep: string[];
}

/**
 * Trilha clicável do tipo Casas › Venda › Tamboré 11.
 * Cada nível preserva apenas os filtros anteriores a ele.
 */
const SearchBreadcrumb = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const propertyType = searchParams.get("propertyType");
  const transactionType = searchParams.get("transactionType");
  const city = searchParams.get("city");
  const neighborhood = searchParams.get("neighborhood");
  const condominium = searchParams.get("condominium");
  const q = (searchParams.get("q") || "").trim();
  const tag = searchParams.get("tag");

  const crumbs: Crumb[] = [];
  const keep: string[] = [];

  if (propertyType) {
    keep.push("propertyType");
    crumbs.push({
      label: typeLabels[propertyType] || titleCase(propertyType),
      keep: [...keep],
    });
  }
  if (transactionType) {
    keep.push("transactionType");
    crumbs.push({
      label: txLabels[transactionType] || titleCase(transactionType),
      keep: [...keep],
    });
  }
  if (city) {
    keep.push("city");
    crumbs.push({ label: titleCase(city), keep: [...keep] });
  }
  if (neighborhood) {
    keep.push("neighborhood");
    crumbs.push({ label: titleCase(neighborhood), keep: [...keep] });
  }
  if (condominium) {
    keep.push("condominium");
    crumbs.push({ label: condominium, keep: [...keep] });
  }
  if (tag) {
    keep.push("tag");
    crumbs.push({ label: `Estilo · ${tag}`, keep: [...keep] });
  }
  if (q) {
    keep.push("q");
    crumbs.push({ label: `"${q}"`, keep: [...keep] });
  }

  const goTo = (allowed: string[]) => {
    const next = new URLSearchParams();
    allowed.forEach((key) => {
      const value = searchParams.get(key);
      if (value) next.set(key, value);
    });
    setSearchParams(next);
  };

  const sep = (
    <ChevronRight
      size={12}
      className="text-muted-foreground/50 shrink-0"
      aria-hidden
    />
  );

  const itemClass =
    "text-body text-[11px] tracking-[0.12em] uppercase text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap";

  return (
    <nav
      aria-label="Trilha de navegação"
      className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1"
    >
      <button onClick={() => navigate("/")} className={`${itemClass} inline-flex items-center gap-1.5`}>
        <Home size={12} />
        Início
      </button>
      {sep}
      <button onClick={() => goTo([])} className={itemClass}>
        Imóveis
      </button>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={`${crumb.label}-${i}`} className="flex items-center gap-2">
            {sep}
            {isLast ? (
              <span className="text-body text-[11px] tracking-[0.12em] uppercase text-foreground font-medium whitespace-nowrap">
                {crumb.label}
              </span>
            ) : (
              <button onClick={() => goTo(crumb.keep)} className={itemClass}>
                {crumb.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default SearchBreadcrumb;
