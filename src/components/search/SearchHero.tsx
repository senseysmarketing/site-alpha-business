import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ParsedFilters } from "@/components/search/FilterChips";
import AiSearchChatButton from "@/components/search/ai-chat/AiSearchChatButton";
import AiSearchChatModal from "@/components/search/ai-chat/AiSearchChatModal";
import SearchBreadcrumb from "@/components/search/SearchBreadcrumb";
import GlobalControlsBar from "@/components/search/GlobalControlsBar";
import ActiveFilterChips from "@/components/search/ActiveFilterChips";
import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchResult {
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
}

const enrichPhoto = (r: SearchResult): SearchResult => ({
  ...r,
  photo: r.photo || "/placeholder.svg",
});

export type SortBy = "relevance" | "price_asc" | "price_desc" | "area_desc" | "alpha" | "recent";

interface SearchHeroProps {
  initialQuery: string;
  onResults: (results: SearchResult[]) => void;
  onLoading: (loading: boolean) => void;
  onParsedFilters?: (filters: ParsedFilters | null) => void;
  totalCount: number;
  localQuery: string;
  onLocalQueryChange: (value: string) => void;
  sortBy: SortBy;
  onSortChange: (value: SortBy) => void;
  onOpenFilters: () => void;
  chips?: ReactNode;
}

const formatBRL = (value: number) => {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `R$ ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace(".", ",")} mi`;
  }
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)} mil`;
  return `R$ ${value}`;
};

const propertyTypeLabel: Record<string, string> = {
  casa: "Casas",
  apartamento: "Apartamentos",
  terreno: "Terrenos",
  cobertura: "Coberturas",
  sobrado: "Sobrados",
};

const buildTitle = (params: URLSearchParams, initialQuery: string): { title: string; subtitle: string } => {
  const condo = params.get("condominium");
  const q = (params.get("q") || initialQuery || "").trim();
  const propertyType = params.get("propertyType");
  const transactionType = params.get("transactionType");
  const minBedrooms = params.get("minBedrooms");
  const minPrice = params.get("minPrice");
  const maxPrice = params.get("maxPrice");
  const tag = params.get("tag");

  if (condo) {
    return {
      title: `Imóveis no ${condo}`,
      subtitle: "Seleção atual de imóveis disponíveis neste condomínio",
    };
  }

  if (q) {
    return {
      title: `Resultados para "${q}"`,
      subtitle: "Imóveis encontrados a partir da sua busca",
    };
  }

  if (tag) {
    return {
      title: `Estilo de vida · ${tag}`,
      subtitle: "Imóveis selecionados para este estilo de vida",
    };
  }

  const hasAnyFilter = propertyType || transactionType || minBedrooms || minPrice || maxPrice;
  if (hasAnyFilter) {
    const noun = propertyType ? (propertyTypeLabel[propertyType] || "Imóveis") : "Imóveis";
    const tx =
      transactionType === "locacao" || transactionType === "aluguel"
        ? "para locação"
        : transactionType === "venda"
          ? "para venda"
          : "";
    const priceParts: string[] = [];
    if (minPrice) priceParts.push(`a partir de ${formatBRL(Number(minPrice))}`);
    if (maxPrice) priceParts.push(`até ${formatBRL(Number(maxPrice))}`);
    const beds = minBedrooms ? `com ${minBedrooms}+ suítes` : "";
    const pieces = [noun, tx, priceParts.join(" "), beds].filter(Boolean);
    return {
      title: pieces.join(" "),
      subtitle: "Resultados filtrados conforme seus critérios",
    };
  }

  return {
    title: "Todos os imóveis disponíveis",
    subtitle: "Explore a coleção completa de oportunidades exclusivas",
  };
};

const SearchHero = ({
  initialQuery,
  onResults,
  onLoading,
  onParsedFilters,
  totalCount,
  localQuery,
  onLocalQueryChange,
  sortBy,
  onSortChange,
  onOpenFilters,
  chips,
}: SearchHeroProps) => {
  const [searchParams] = useSearchParams();
  const [chatOpen, setChatOpen] = useState(false);
  const { title, subtitle } = buildTitle(searchParams, initialQuery);

  // Backward compat: if a ?q= initial query is present, run legacy search once.
  useEffect(() => {
    const q = (initialQuery || "").trim();
    if (!q || q.length < 2) return;
    (async () => {
      onLoading(true);
      onParsedFilters?.(null);
      try {
        const { data, error } = await supabase.functions.invoke("ai-property-search", { body: { query: q } });
        if (error) throw error;
        if (data?.error) { toast.error(data.error); onResults([]); return; }
        onResults((data?.results || []).map(enrichPhoto));
      } catch (err) {
        console.error("Search error:", err);
        toast.error("Não foi possível realizar a busca. Tente novamente.");
        onResults([]);
      } finally {
        onLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="relative bg-background pt-24 md:pt-28 pb-4 md:pb-6">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SearchBreadcrumb />

          <h1 className="text-display text-2xl md:text-3xl font-light text-foreground leading-tight mt-3">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            <p className="text-body text-sm text-muted-foreground">
              {totalCount > 0
                ? `${totalCount} ${totalCount === 1 ? "imóvel encontrado" : "imóveis encontrados"} · ${subtitle}`
                : subtitle}
            </p>
            {hasAnyFilter && (
              <button
                onClick={() => setSearchParams(new URLSearchParams())}
                className="text-body text-[11px] tracking-[0.1em] uppercase text-foreground underline underline-offset-4 hover:text-primary transition-colors"
              >
                Ver todos os imóveis
              </button>
            )}
          </div>

          <div className="mt-5">
            <GlobalControlsBar propertyTypes={propertyTypes} />
          </div>

          <div className="mt-4">
            <ActiveFilterChips />
          </div>

          {chips && <div className="mt-3">{chips}</div>}


          {/* Controls row */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search
                size={14}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                value={localQuery}
                onChange={(e) => onLocalQueryChange(e.target.value)}
                placeholder="Filtrar nesta lista..."
                className="w-full bg-background border border-border rounded-full pl-10 pr-4 py-2 text-body text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortBy)}>
              <SelectTrigger
                className="bg-background border border-border rounded-full px-4 py-2 text-body text-xs tracking-wider uppercase text-foreground outline-none focus:ring-1 focus:ring-primary cursor-pointer h-auto min-h-[36px] w-auto"
              >
                <SelectValue>
                  {(() => {
                    const labels: Record<SortBy, string> = {
                      relevance: "Relevância",
                      price_asc: "Menor preço",
                      price_desc: "Maior preço",
                      area_desc: "Maior área",
                      alpha: "A → Z",
                      recent: "Mais recentes",
                    };
                    return `Ordenar: ${labels[sortBy]}`;
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevância</SelectItem>
                <SelectItem value="price_asc">Menor preço</SelectItem>
                <SelectItem value="price_desc">Maior preço</SelectItem>
                <SelectItem value="area_desc">Maior área</SelectItem>
                <SelectItem value="alpha">A → Z</SelectItem>
                <SelectItem value="recent">Mais recentes</SelectItem>
              </SelectContent>
            </Select>

            <button
              onClick={onOpenFilters}
              className="inline-flex items-center gap-2 border border-border rounded-full px-4 py-2 text-body text-xs tracking-wider uppercase text-foreground hover:bg-muted transition-colors"
            >
              <SlidersHorizontal size={14} />
              Filtros
            </button>

            <div className="ml-auto">
              <AiSearchChatButton variant="pill" onClick={() => setChatOpen(true)} />
            </div>
          </div>
        </motion.div>
      </div>

      <AiSearchChatModal open={chatOpen} onOpenChange={setChatOpen} />
    </section>
  );
};

export default SearchHero;
