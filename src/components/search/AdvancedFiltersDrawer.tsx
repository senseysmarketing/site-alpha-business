import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export interface Filters {
  priceRange: [number, number];
  transactionType: string;
  minBedrooms: number;
  condominium: string;
}

interface AdvancedFiltersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
  onApply: (filters: Filters) => void;
  condominiums: string[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);

const AdvancedFiltersDrawer = ({
  open,
  onOpenChange,
  filters,
  onApply,
  condominiums,
}: AdvancedFiltersDrawerProps) => {
  const [local, setLocal] = useState<Filters>(filters);

  const handleApply = () => {
    onApply(local);
    onOpenChange(false);
  };

  const handleReset = () => {
    const reset: Filters = {
      priceRange: [0, 50_000_000],
      transactionType: "all",
      minBedrooms: 0,
      condominium: "all",
    };
    setLocal(reset);
    onApply(reset);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[340px] sm:w-[400px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-display text-lg tracking-wide">
            Filtros Avançados
          </SheetTitle>
          <SheetDescription className="text-body text-xs text-muted-foreground">
            Refine sua busca com critérios específicos
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8">
          {/* Price range */}
          <div className="space-y-3">
            <Label className="text-body text-xs tracking-wider uppercase text-muted-foreground">
              Faixa de Preço
            </Label>
            <Slider
              min={0}
              max={50_000_000}
              step={500_000}
              value={local.priceRange}
              onValueChange={(v) =>
                setLocal((f) => ({ ...f, priceRange: v as [number, number] }))
              }
              className="mt-2"
            />
            <div className="flex justify-between text-body text-[11px] text-muted-foreground">
              <span>{formatCurrency(local.priceRange[0])}</span>
              <span>{formatCurrency(local.priceRange[1])}</span>
            </div>
          </div>

          {/* Transaction type */}
          <div className="space-y-3">
            <Label className="text-body text-xs tracking-wider uppercase text-muted-foreground">
              Tipo
            </Label>
            <Select
              value={local.transactionType}
              onValueChange={(v) => setLocal((f) => ({ ...f, transactionType: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="venda">Venda</SelectItem>
                <SelectItem value="aluguel">Aluguel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Min bedrooms */}
          <div className="space-y-3">
            <Label className="text-body text-xs tracking-wider uppercase text-muted-foreground">
              Suítes (mínimo)
            </Label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setLocal((f) => ({ ...f, minBedrooms: n }))}
                  className={`w-9 h-9 rounded-sm text-body text-xs transition-colors ${
                    local.minBedrooms === n
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {n === 0 ? "—" : n + "+"}
                </button>
              ))}
            </div>
          </div>

          {/* Condominium */}
          {condominiums.length > 0 && (
            <div className="space-y-3">
              <Label className="text-body text-xs tracking-wider uppercase text-muted-foreground">
                Condomínio
              </Label>
              <Select
                value={local.condominium}
                onValueChange={(v) => setLocal((f) => ({ ...f, condominium: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {condominiums.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-10">
          <Button variant="outline" onClick={handleReset} className="flex-1 text-body text-xs tracking-wider uppercase">
            Limpar
          </Button>
          <Button onClick={handleApply} className="flex-1 text-body text-xs tracking-wider uppercase">
            Aplicar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdvancedFiltersDrawer;
