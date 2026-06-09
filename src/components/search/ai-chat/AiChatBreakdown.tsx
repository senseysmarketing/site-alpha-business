import { Link } from "react-router-dom";
import type { CondominiumBreakdownItem } from "./types";

interface Props {
  items: CondominiumBreakdownItem[];
  onNavigate?: () => void;
}

const fmtBRL = (n: number | null | undefined) =>
  typeof n === "number"
    ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
    : null;

const AiChatBreakdown = ({ items, onNavigate }: Props) => {
  if (!items?.length) return null;
  return (
    <div className="pl-12 space-y-1">
      {items.map((b, i) => {
        const range = b.minPrice ? `${fmtBRL(b.minPrice)}${b.maxPrice && b.maxPrice !== b.minPrice ? ` – ${fmtBRL(b.maxPrice)}` : ""}` : null;
        return (
          <Link
            key={i}
            to={b.url ?? "/busca"}
            onClick={onNavigate}
            className="flex items-center justify-between gap-3 py-2 px-3 rounded-md bg-card border border-border/60 hover:border-foreground/30 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-body text-xs text-foreground truncate">{b.condominium}</p>
              {range && <p className="text-[10px] text-muted-foreground">{range}</p>}
            </div>
            <span className="text-body text-xs text-muted-foreground flex-shrink-0">
              {b.count} {b.count === 1 ? "imóvel" : "imóveis"} →
            </span>
          </Link>
        );
      })}
    </div>
  );
};

export default AiChatBreakdown;
