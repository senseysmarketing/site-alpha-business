import { Link } from "react-router-dom";
import type { PropertyResult } from "./types";

interface Props {
  results: PropertyResult[];
  onNavigate?: () => void;
}

const fmtBRL = (n: number | null, rental: boolean) => {
  if (!n) return "Sob consulta";
  const v = n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  return rental ? `${v}/mês` : v;
};

const AiChatResultsPreview = ({ results, onNavigate }: Props) => {
  if (!results?.length) return null;


  return (
    <div className="pl-12 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {results.slice(0, 4).map((r) => {
          const rental = r.transaction_type === "locacao" || r.transaction_type === "aluguel";
          const price = rental ? r.rental_price : r.price;
          return (
            <Link
              key={r.id}
              to={`/imovel/${r.id}`}
              onClick={onNavigate}
              className="group block bg-card border border-border/60 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/3] bg-muted overflow-hidden">
                {r.photo ? (
                  <img
                    src={r.photo}
                    alt={r.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
              <div className="p-2.5 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.code}</p>
                <p className="text-body text-xs text-foreground line-clamp-2 leading-tight min-h-[2rem]">
                  {r.condominium ?? r.title}
                </p>
                <p className="text-display text-sm text-foreground font-light">{fmtBRL(price, rental)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AiChatResultsPreview;
