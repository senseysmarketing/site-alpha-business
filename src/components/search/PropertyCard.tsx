import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import { toTitleCase } from "@/lib/utils";
import { hasRentalOffer, hasSaleOffer, hasBothTransactions } from "@/lib/propertyQueries";

export type TransactionIntent = "venda" | "locacao" | "aluguel" | "all";

interface PropertyCardProps {
  property: {
    id: string;
    code: string;
    title: string;
    condominium: string | null;
    neighborhood: string | null;
    city: string | null;
    price: number | null;
    rental_price: number | null;
    transaction_type: string;
    bedrooms: number | null;
    bathrooms: number | null;
    parking_spots?: number | null;
    area_total: number | null;
    photo: string | null;
    relevance_reason: string;
  };
  isWide?: boolean;
  isSelected?: boolean;
  onToggleCompare?: (id: string) => void;
  /** User's current transaction filter; drives which price/label to show for 'ambos'. */
  transactionIntent?: TransactionIntent;
}

const formatPrice = (value: number | null) => {
  if (!value) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const isRentalIntent = (i?: TransactionIntent) => i === "locacao" || i === "aluguel";

const resolveDisplay = (
  transactionType: string,
  intent: TransactionIntent | undefined,
  salePrice: number | null,
  rentalPrice: number | null
): { label: string; price: number | null; isRental: boolean } => {
  const both = hasBothTransactions(transactionType);
  // Pure rental row
  if (!hasSaleOffer(transactionType) && hasRentalOffer(transactionType)) {
    return { label: "Locação", price: rentalPrice, isRental: true };
  }
  // Pure sale row
  if (hasSaleOffer(transactionType) && !hasRentalOffer(transactionType)) {
    return { label: "Venda", price: salePrice, isRental: false };
  }
  // ambos
  if (both) {
    if (isRentalIntent(intent)) return { label: "Locação", price: rentalPrice, isRental: true };
    if (intent === "venda") return { label: "Venda", price: salePrice, isRental: false };
    return { label: "Venda e Locação", price: salePrice, isRental: false };
  }
  return { label: "Venda", price: salePrice, isRental: false };
};

const PropertyCard = ({ property, isSelected = false, onToggleCompare, transactionIntent }: PropertyCardProps) => {
  const display = resolveDisplay(
    property.transaction_type,
    transactionIntent,
    property.price,
    property.rental_price
  );
  const locationParts = [property.condominium, property.neighborhood, property.city]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="relative h-full">
      {onToggleCompare && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleCompare(property.id);
          }}
          className={`absolute top-3 right-3 z-20 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 backdrop-blur-sm ${
            isSelected
              ? "bg-accent border-accent text-accent-foreground"
              : "bg-background/40 border-white/70 text-transparent hover:border-white hover:bg-background/60"
          }`}
          aria-label="Comparar imóvel"
        >
          <Check size={14} />
        </button>
      )}

      <Link
        to={`/imovel/${property.id}`}
        className="group block h-full bg-card border border-border/60 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Imagem */}
        <div className="relative overflow-hidden aspect-[4/3]">
          {property.photo ? (
            <img
              src={property.photo}
              alt={toTitleCase(property.title)}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-body text-xs tracking-wider uppercase text-muted-foreground">
                Sem foto
              </span>
            </div>
          )}
        </div>

        {/* Bloco inferior */}
        <div className="p-5">
          {/* Meta */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-body text-[11px] tracking-[0.15em] uppercase font-semibold text-foreground">
              {display.label}
            </span>
            <span className="text-body text-[11px] tracking-[0.1em] uppercase text-muted-foreground">
              {property.code}
            </span>
          </div>

          {/* Título */}
          <h3 className="text-display text-xl font-normal text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2 min-h-[3.5rem]">
            {toTitleCase(property.title)}
          </h3>

          {/* Localização */}
          {locationParts && (
            <p className="text-body text-xs text-muted-foreground mb-2 line-clamp-1">
              {locationParts}
            </p>
          )}

          {/* Specs */}
          <p className="text-body text-sm text-muted-foreground">
            {property.area_total ? `${property.area_total}m²` : "—"}
            &nbsp;-&nbsp; Suítes: {property.bedrooms ?? 0}
            &nbsp;-&nbsp; Vagas: {property.parking_spots ?? 0}
          </p>

          {/* Divisor */}
          <div className="border-t border-border/60 my-4" />

          {/* Footer */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-body text-[11px] tracking-[0.1em] uppercase font-semibold text-foreground">
                {display.label}:
              </p>
              <p className="text-display text-lg font-medium text-foreground truncate">
                {display.price ? formatPrice(display.price) : "Sob consulta"}
                {display.price && display.isRental && (
                  <span className="text-body text-[11px] tracking-wider uppercase text-muted-foreground ml-1">
                    /mês
                  </span>
                )}
              </p>
            </div>
            <span className="text-body text-sm bg-foreground text-background px-5 py-2 rounded-md group-hover:bg-foreground/90 transition-colors whitespace-nowrap">
              Saiba Mais
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default PropertyCard;
