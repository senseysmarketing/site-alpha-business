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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export interface Filters {
  priceRange: [number, number];
  transactionType: string;
  propertyType: string;
  minBedrooms: number;
  minBathrooms: number;
  minParking: number;
  areaRange: [number, number];
  condominium: string;
  city: string;
  neighborhood: string;
  onlyFeatured: boolean;
}

export interface FilterBounds {
  saleRange: [number, number];
  rentRange: [number, number];
  areaRange: [number, number];
  propertyTypes: string[];
  cities: string[];
  neighborhoods: string[];
}

export const defaultFilters: Filters = {
  priceRange: [0, 50_000_000],
  transactionType: "all",
  propertyType: "all",
  minBedrooms: 0,
  minBathrooms: 0,
  minParking: 0,
  areaRange: [0, 5000],
  condominium: "all",
  city: "all",
  neighborhood: "all",
  onlyFeatured: false,
};

interface AdvancedFiltersDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
  onApply: (filters: Filters) => void;
  condominiums: string[];
  bounds: FilterBounds;
  matchCount?: number;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);

const isRental = (tt: string) => tt === "locacao" || tt === "aluguel";

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const propertyTypeLabel = (t: string) => {
  const map: Record<string, string> = {
    casa: "Casa",
    apartamento: "Apartamento",
    cobertura: "Cobertura",
    terreno: "Terreno",
    sobrado: "Sobrado",
    sala_comercial: "Sala Comercial",
    comercial: "Comercial",
  };
  return map[t] || t.charAt(0).toUpperCase() + t.slice(1);
};

const ChipRow = ({
  value,
  onChange,
  max = 5,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
}) => (
  <div className="flex gap-2 flex-wrap">
    {Array.from({ length: max + 1 }, (_, n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className={`min-w-[36px] h-9 px-2 rounded-md text-body text-xs transition-colors ${
          value === n
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        {n === 0 ? "—" : `${n}+`}
      </button>
    ))}
  </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Label className="text-body text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
    {children}
  </Label>
);

const AdvancedFiltersDrawer = ({
  open,
  onOpenChange,
  filters,
  onApply,
  condominiums,
  bounds,
  matchCount,
}: AdvancedFiltersDrawerProps) => {
  const [local, setLocal] = useState<Filters>(filters);
  const [condoOpen, setCondoOpen] = useState(false);
  const [condoSearch, setCondoSearch] = useState("");

  // Sync when parent filters change (e.g. URL → state) or sheet reopens.
  useEffect(() => {
    if (open) setLocal(filters);
  }, [open, filters]);

  const rental = isRental(local.transactionType);
  const activePriceBounds = rental ? bounds.rentRange : bounds.saleRange;
  const [priceLo, priceHi] = activePriceBounds;
  const validPriceRange = priceHi > priceLo;

  // Dynamic step: ~200 increments across the slider, snapped to a sane unit.
  const priceStep = useMemo(() => {
    if (!validPriceRange) return rental ? 500 : 50_000;
    const span = priceHi - priceLo;
    const unit = rental ? 500 : 50_000;
    return Math.max(unit, Math.round(span / 200 / unit) * unit);
  }, [validPriceRange, priceHi, priceLo, rental]);

  // Re-clamp local range whenever the bounds shift while the drawer is open
  // (e.g. user changed propertyType inside the drawer).
  useEffect(() => {
    if (!open || !validPriceRange) return;
    setLocal((f) => {
      const lo = Math.max(f.priceRange[0], priceLo);
      const hi = Math.min(f.priceRange[1], priceHi);
      if (lo === f.priceRange[0] && hi === f.priceRange[1]) return f;
      return { ...f, priceRange: [Math.min(lo, hi), Math.max(lo, hi)] };
    });
  }, [open, validPriceRange, priceLo, priceHi]);

  const handleApply = () => {
    onApply(local);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocal({
      ...defaultFilters,
      priceRange: bounds.saleRange,
      areaRange: bounds.areaRange,
    });
  };

  const filteredCondos = useMemo(() => {
    if (!condoSearch) return condominiums;
    const q = normalize(condoSearch);
    return condominiums.filter((c) => normalize(c).includes(q));
  }, [condoSearch, condominiums]);

  const neighborhoodOptions = bounds.neighborhoods;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[380px] sm:w-[440px] overflow-y-auto p-0 flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-border/60">
          <SheetHeader className="space-y-1">
            <SheetTitle className="text-display text-lg tracking-wide">
              Filtros Avançados
            </SheetTitle>
            <SheetDescription className="text-body text-xs text-muted-foreground">
              Refine sua busca com critérios específicos
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* GRUPO 1 — Preço & Tipo */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionLabel>
                  Faixa de {rental ? "Aluguel" : "Preço"}
                </SectionLabel>
                <span className="text-body text-[10px] text-muted-foreground/70">
                  {validPriceRange
                    ? `${formatCurrency(priceLo)} – ${formatCurrency(priceHi)}`
                    : "Sem imóveis no filtro atual"}
                </span>
              </div>
              {validPriceRange ? (
                <Slider
                  min={priceLo}
                  max={priceHi}
                  step={priceStep}
                  value={[
                    Math.max(local.priceRange[0], priceLo),
                    Math.min(local.priceRange[1], priceHi),
                  ]}
                  onValueChange={(v) =>
                    setLocal((f) => ({ ...f, priceRange: v as [number, number] }))
                  }
                  className="mt-2"
                />
              ) : (
                <div className="h-2 rounded-full bg-muted mt-2" />
              )}
              <div className="flex justify-between text-body text-[11px] text-foreground/80">
                <span>{formatCurrency(local.priceRange[0])}</span>
                <span>{formatCurrency(local.priceRange[1])}</span>
              </div>
            </div>


            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <SectionLabel>Operação</SectionLabel>
                <Select
                  value={local.transactionType}
                  onValueChange={(v) =>
                    setLocal((f) => ({
                      ...f,
                      transactionType: v,
                      priceRange: isRental(v) ? bounds.rentRange : bounds.saleRange,
                    }))
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent className="z-[80]">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="venda">Venda</SelectItem>
                    <SelectItem value="locacao">Locação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <SectionLabel>Tipo</SectionLabel>
                <Select
                  value={local.propertyType}
                  onValueChange={(v) => setLocal((f) => ({ ...f, propertyType: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent className="z-[80]">
                    <SelectItem value="all">Todos</SelectItem>
                    {bounds.propertyTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {propertyTypeLabel(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* GRUPO 2 — Características */}
          <div className="space-y-5 pt-2 border-t border-border/40">
            <div className="space-y-3 pt-5">
              <SectionLabel>Suítes (mínimo)</SectionLabel>
              <ChipRow
                value={local.minBedrooms}
                onChange={(n) => setLocal((f) => ({ ...f, minBedrooms: n }))}
              />
            </div>

            <div className="space-y-3">
              <SectionLabel>Banheiros (mínimo)</SectionLabel>
              <ChipRow
                value={local.minBathrooms}
                onChange={(n) => setLocal((f) => ({ ...f, minBathrooms: n }))}
                max={4}
              />
            </div>

            <div className="space-y-3">
              <SectionLabel>Vagas (mínimo)</SectionLabel>
              <ChipRow
                value={local.minParking}
                onChange={(n) => setLocal((f) => ({ ...f, minParking: n }))}
                max={4}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionLabel>Área Útil (m²)</SectionLabel>
                <span className="text-body text-[10px] text-muted-foreground/70">
                  até {bounds.areaRange[1]} m²
                </span>
              </div>
              <Slider
                min={bounds.areaRange[0]}
                max={bounds.areaRange[1]}
                step={10}
                value={[
                  Math.max(local.areaRange[0], bounds.areaRange[0]),
                  Math.min(local.areaRange[1], bounds.areaRange[1]),
                ]}
                onValueChange={(v) =>
                  setLocal((f) => ({ ...f, areaRange: v as [number, number] }))
                }
              />
              <div className="flex justify-between text-body text-[11px] text-foreground/80">
                <span>{local.areaRange[0]} m²</span>
                <span>{local.areaRange[1]} m²</span>
              </div>
            </div>
          </div>

          {/* GRUPO 3 — Localização */}
          <div className="space-y-5 pt-2 border-t border-border/40">
            <div className="space-y-2 pt-5">
              <SectionLabel>Condomínio</SectionLabel>
              <Popover open={condoOpen} onOpenChange={setCondoOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <span className={local.condominium === "all" ? "text-muted-foreground" : ""}>
                      {local.condominium === "all" ? "Todos" : local.condominium}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0 z-[80]"
                  align="start"
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar condomínio..."
                      value={condoSearch}
                      onValueChange={setCondoSearch}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhum condomínio encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setLocal((f) => ({ ...f, condominium: "all" }));
                            setCondoOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              local.condominium === "all" ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          Todos
                        </CommandItem>
                        {filteredCondos.map((c) => (
                          <CommandItem
                            key={c}
                            value={c}
                            onSelect={() => {
                              setLocal((f) => ({ ...f, condominium: c }));
                              setCondoOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                local.condominium === c ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {c}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <SectionLabel>Cidade</SectionLabel>
                <Select
                  value={local.city}
                  onValueChange={(v) => setLocal((f) => ({ ...f, city: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent className="z-[80]">
                    <SelectItem value="all">Todas</SelectItem>
                    {bounds.cities.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <SectionLabel>Bairro</SectionLabel>
                <Select
                  value={local.neighborhood}
                  onValueChange={(v) => setLocal((f) => ({ ...f, neighborhood: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent className="z-[80]">
                    <SelectItem value="all">Todos</SelectItem>
                    {neighborhoodOptions.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* GRUPO 4 — Extras */}
          <div className="space-y-3 pt-5 border-t border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-sm text-foreground">Somente em destaque</p>
                <p className="text-body text-[11px] text-muted-foreground">
                  Imóveis selecionados pela curadoria
                </p>
              </div>
              <Switch
                checked={local.onlyFeatured}
                onCheckedChange={(v) => setLocal((f) => ({ ...f, onlyFeatured: v }))}
              />
            </div>
          </div>
        </div>

        {/* Footer fixo */}
        <div className="px-6 py-4 border-t border-border/60 bg-background/95 backdrop-blur">
          {typeof matchCount === "number" && (
            <p className="text-body text-[11px] tracking-wider uppercase text-muted-foreground text-center mb-3">
              {matchCount} {matchCount === 1 ? "imóvel" : "imóveis"} correspondentes
            </p>
          )}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 text-body text-xs tracking-wider uppercase"
            >
              Limpar
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 text-body text-xs tracking-wider uppercase text-primary-foreground"
            >
              Aplicar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdvancedFiltersDrawer;
