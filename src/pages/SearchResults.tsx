import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, GitCompareArrows } from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchHero from "@/components/search/SearchHero";
import BentoGrid from "@/components/search/BentoGrid";
import AdvancedFiltersDrawer, { type Filters } from "@/components/search/AdvancedFiltersDrawer";
import CompareModal from "@/components/search/CompareModal";
import ConciergeSidebar from "@/components/search/ConciergeSidebar";
import FilterChips, { type ParsedFilters } from "@/components/search/FilterChips";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { mockProperties, toSearchResult } from "@/data/mockProperties";

const mockByCode: Record<string, string> = {};
mockProperties.forEach((p) => {
  if (p.photo) mockByCode[p.code] = p.photo;
});
const enrichPhoto = (r: SearchResult): SearchResult => ({
  ...r,
  photo: r.photo || mockByCode[r.code] || "/images/property-1.jpg",
});

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
  area_total: number | null;
  photo: string | null;
  relevance_reason: string;
}

const defaultFilters: Filters = {
  priceRange: [0, 50_000_000],
  transactionType: "all",
  minBedrooms: 0,
  condominium: "all",
};

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [results, setResults] = useState<SearchResult[]>(
    initialQuery ? [] : mockProperties.map(toSearchResult).map(enrichPhoto)
  );
  const [loading, setLoading] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [parsedFilters, setParsedFilters] = useState<ParsedFilters | null>(null);

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const price = r.transaction_type === "aluguel" ? r.rental_price : r.price;
      if (price && (price < filters.priceRange[0] || price > filters.priceRange[1])) return false;
      if (filters.transactionType !== "all" && r.transaction_type !== filters.transactionType) return false;
      if (filters.minBedrooms > 0 && (r.bedrooms || 0) < filters.minBedrooms) return false;
      if (filters.condominium !== "all" && r.condominium !== filters.condominium) return false;
      return true;
    });
  }, [results, filters]);

  const condominiums = useMemo(() => {
    return [...new Set(results.map((r) => r.condominium).filter(Boolean))] as string[];
  }, [results]);

  const handleToggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }, []);

  const compareProperties = useMemo(() => {
    return compareIds.map((id) => results.find((r) => r.id === id)).filter(Boolean) as SearchResult[];
  }, [compareIds, results]);

  const conciergeSuggestions = useMemo(() => {
    return results.slice(-3).map((r) => ({
      id: r.id,
      title: r.title,
      photo: r.photo,
      condominium: r.condominium,
      price: r.price,
    }));
  }, [results]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background"
    >
      <Header />

      <SearchHero
        initialQuery={initialQuery}
        onResults={setResults}
        onLoading={setLoading}
        onParsedFilters={setParsedFilters}
      />

      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4 flex-wrap">
              {!loading && results.length > 0 && (
                <p className="text-body text-xs tracking-[0.15em] uppercase text-muted-foreground">
                  {filteredResults.length}{" "}
                  {filteredResults.length === 1 ? "resultado" : "resultados"}
                </p>
              )}
              {parsedFilters && !loading && (
                <FilterChips filters={parsedFilters} />
              )}
            </div>
            <div className="flex items-center gap-3">
              {compareIds.length === 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompareOpen(true)}
                  className="text-body text-xs tracking-wider uppercase gap-2"
                >
                  <GitCompareArrows size={14} />
                  Comparar ({compareIds.length})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiltersOpen(true)}
                className="text-body text-xs tracking-wider uppercase gap-2"
              >
                <SlidersHorizontal size={14} />
                Filtros
              </Button>
            </div>
          </div>

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton
                  key={i}
                  className={`rounded-xl ${i === 1 ? "col-span-full aspect-[16/9]" : "aspect-[4/5]"}`}
                />
              ))}
            </div>
          )}

          {!loading && (
            <BentoGrid
              results={filteredResults}
              compareIds={compareIds}
              onToggleCompare={handleToggleCompare}
            />
          )}

          {!loading && results.length > 0 && filteredResults.length === 0 && (
            <div className="text-center py-20">
              <p className="text-body text-sm text-muted-foreground">
                Nenhum imóvel corresponde aos filtros selecionados.
              </p>
              <Button
                variant="ghost"
                onClick={() => setFilters(defaultFilters)}
                className="mt-4 text-body text-xs tracking-wider uppercase"
              >
                Limpar filtros
              </Button>
            </div>
          )}

          {!loading && results.length === 0 && initialQuery && (
            <div className="text-center py-20">
              <p className="text-display text-lg text-muted-foreground">
                Utilize a busca para encontrar imóveis exclusivos
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />

      <ConciergeSidebar
        suggestions={conciergeSuggestions}
        visible={!loading && results.length > 3}
      />

      <AdvancedFiltersDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onApply={setFilters}
        condominiums={condominiums}
      />

      <CompareModal
        open={compareOpen}
        onOpenChange={setCompareOpen}
        properties={compareProperties}
      />
    </motion.div>
  );
};

export default SearchResults;
