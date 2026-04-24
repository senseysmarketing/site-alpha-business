import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Maximize, Bed, Car, MapPin } from "lucide-react";
import { toTitleCase } from "@/lib/utils";

interface Property {
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
}

interface CompareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
}

const formatPrice = (value: number | null) => {
  if (!value) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
};

const CompareModal = ({ open, onOpenChange, properties }: CompareModalProps) => {
  if (properties.length < 2) return null;

  const [a, b] = properties;

  const rows = [
    { label: "Preço", a: formatPrice(a.price), b: formatPrice(b.price), icon: null },
    { label: "Aluguel", a: formatPrice(a.rental_price), b: formatPrice(b.rental_price), icon: null },
    { label: "Área total", a: a.area_total ? `${a.area_total}m²` : "—", b: b.area_total ? `${b.area_total}m²` : "—", icon: Maximize },
    { label: "Suítes", a: a.bedrooms?.toString() || "—", b: b.bedrooms?.toString() || "—", icon: Bed },
    { label: "Vagas", a: a.bathrooms?.toString() || "—", b: b.bathrooms?.toString() || "—", icon: Car },
    { label: "Condomínio", a: a.condominium || "—", b: b.condominium || "—", icon: MapPin },
    { label: "Bairro", a: a.neighborhood || "—", b: b.neighborhood || "—", icon: null },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-display text-xl tracking-wide">
            Comparativo Editorial
          </DialogTitle>
          <DialogDescription className="text-body text-xs text-muted-foreground">
            Análise lado a lado dos imóveis selecionados
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Photos */}
          {[a, b].map((p) => (
            <div key={p.id} className="aspect-[16/10] overflow-hidden">
              {p.photo ? (
                <img src={p.photo} alt={toTitleCase(p.title)} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                  Sem foto
                </div>
              )}
            </div>
          ))}

          {/* Titles */}
          {[a, b].map((p) => (
            <div key={p.id + "-title"} className="px-6 pt-4 pb-2">
              <span className="text-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                {p.code}
              </span>
              <h3 className="text-serif text-lg font-normal text-foreground">{toTitleCase(p.title)}</h3>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="px-6 pb-6">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_1fr_auto_1fr] md:grid-cols-[1fr_auto_1fr] items-center py-3 border-b border-border/50 last:border-0"
            >
              <div className="text-right pr-4">
                <span className="font-mono text-sm text-foreground">{row.a}</span>
              </div>
              <div className="text-center px-3">
                <span className="text-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                  {row.label}
                </span>
              </div>
              <div className="text-left pl-4">
                <span className="font-mono text-sm text-foreground">{row.b}</span>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompareModal;
