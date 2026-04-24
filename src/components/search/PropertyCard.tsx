import { motion } from "framer-motion";
import { Maximize, Bed, Car, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toTitleCase } from "@/lib/utils";

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
    area_total: number | null;
    photo: string | null;
    relevance_reason: string;
  };
  isWide?: boolean;
  isSelected?: boolean;
  onToggleCompare?: (id: string) => void;
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

const PropertyCard = ({ property, isWide = false, isSelected = false, onToggleCompare }: PropertyCardProps) => {
  const navigate = useNavigate();
  const isRental = property.transaction_type === "aluguel" || property.transaction_type === "locacao";
  const price = isRental ? property.rental_price : property.price;

  return (
    <div
      className={`group relative overflow-hidden rounded-sm cursor-pointer ${
        isWide ? "aspect-[16/9]" : "aspect-[4/5]"
      }`}
      onClick={() => navigate(`/imovel/${property.id}`)}
    >
      {/* Image */}
      <div className="absolute inset-0">
        {property.photo ? (
          <img
            src={property.photo}
            alt={toTitleCase(property.title)}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-body text-xs tracking-wider uppercase text-muted-foreground">
              Sem foto
            </span>
          </div>
        )}
      </div>

      {/* Hover overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />

      {/* Compare checkbox */}
      {onToggleCompare && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompare(property.id);
          }}
          className={`absolute top-3 right-3 z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
            isSelected
              ? "bg-accent border-accent text-accent-foreground"
              : "border-primary-foreground/50 text-transparent hover:border-primary-foreground"
          }`}
        >
          <Check size={14} />
        </button>
      )}

      {/* Content overlay */}
      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 z-10">
        {/* Code badge */}
        <span className="text-body text-[10px] tracking-[0.2em] uppercase text-primary-foreground/60 mb-1 block">
          {property.code}
        </span>

        {/* Title */}
        <h3 className={`text-display ${isWide ? "text-xl md:text-2xl min-h-[3.5rem] md:min-h-[4rem]" : "text-lg md:text-xl min-h-[2.75rem] md:min-h-[3.5rem]"} font-normal text-primary-foreground leading-tight mb-1 line-clamp-2`}>
          {toTitleCase(property.title)}
        </h3>

        {/* Location */}
        <p className="text-body text-xs text-primary-foreground/70 mb-3">
          {[property.condominium, property.neighborhood, property.city].filter(Boolean).join(" · ")}
        </p>

        {/* Specs row - visible on hover */}
        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-400">
          {property.area_total && (
            <span className="flex items-center gap-1.5 text-primary-foreground/80">
              <Maximize size={13} strokeWidth={1.5} />
              <span className="text-body text-xs">{property.area_total}m²</span>
            </span>
          )}
          {property.bedrooms && (
            <span className="flex items-center gap-1.5 text-primary-foreground/80">
              <Bed size={13} strokeWidth={1.5} />
              <span className="text-body text-xs">{property.bedrooms}</span>
            </span>
          )}
          {property.bathrooms && (
            <span className="flex items-center gap-1.5 text-primary-foreground/80">
              <Car size={13} strokeWidth={1.5} />
              <span className="text-body text-xs">{property.bathrooms}</span>
            </span>
          )}
        </div>

        {/* Price */}
        {price && (
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-body text-sm font-medium text-primary-foreground">
              {formatPrice(price)}
            </span>
            {isRental && (
              <span className="text-body text-[10px] tracking-wider uppercase text-primary-foreground/50">
                /mês
              </span>
            )}
          </div>
        )}

        {/* AI relevance */}
        <p className="text-body text-[11px] text-primary-foreground/50 mt-2 line-clamp-1 italic">
          {property.relevance_reason}
        </p>
      </div>
    </div>
  );
};

export default PropertyCard;
