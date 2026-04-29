import { useState, useMemo, useCallback, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

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

const isRental = (tt: string) => tt === "locacao" || tt === "aluguel";

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const tagParam = searchParams.get("tag") || "";

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(!initialQuery);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(() => {
    const condoParam = searchParams.get("condominium");
    const txParam = searchParams.get("transactionType");
    return {
      ...defaultFilters,
      condominium: condoParam || defaultFilters.condominium,
      transactionType: (txParam as Filters["transactionType"]) || defaultFilters.transactionType,
    };
  });
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [parsedFilters, setParsedFilters] = useState<ParsedFilters | null>(null);
  const [visibleCount, setVisibleCount] = useState(8);

  // When there is no query (e.g. navigation from condo links), load full active list from Supabase.
  useEffect(() => {
    if (initialQuery) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select(
          "id, code, title, condominium, neighborhood, city, price, rental_price, transaction_type, bedrooms, bathrooms, area_total, photos, is_featured, created_at"
        )
        .eq("status", "ativo")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);
      if (cancelled) return;
      if (!error && data) {
        setResults(
          data.map((p: any) => ({
            id: p.id,
            code: p.code,
            title: p.title,
            condominium: p.condominium,
            neighborhood: p.neighborhood,
            city: p.city,
            price: p.price,
            rental_price: p.rental_price,
            transaction_type: p.transaction_type,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            area_total: p.area_total,
            photo: p.photos?.[0] ?? null,
            relevance_reason: "",
          }))
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [initialQuery]);

  const filteredResults = useMemo(() => {
    const tagNorm = tagParam ? normalize(tagParam) : "";
    const filtered = results.filter((r) => {
      const rental = isRental(r.transaction_type);
      const price = rental ? r.rental_price : r.price;
      if (price && (price < filters.priceRange[0] || price > filters.priceRange[1])) return false;
      if (filters.transactionType !== "all") {
        const wantRental = isRental(filters.transactionType);
        if (wantRental !== rental) return false;
      }
      if (filters.minBedrooms > 0 && (r.bedrooms || 0) < filters.minBedrooms) return false;
      if (filters.condominium !== "all" && r.condominium !== filters.condominium) return false;
      if (tagNorm) {
        const haystack = [r.title || "", r.condominium || "", r.relevance_reason || ""]
          .map(normalize)
          .join(" | ");
        if (!haystack.includes(tagNorm)) return false;
      }
      return true;
    });
    // Priorize properties with photos to avoid empty placeholder cards.
    return [...filtered].sort((a, b) => {
      const photoA = a.photo ? 1 : 0;
      const photoB = b.photo ? 1 : 0;
      return photoB - photoA;
    });
  }, [results, filters, tagParam]);

  // Reset pagination whenever the filtered set changes.
  useEffect(() => {
    setVisibleCount(8);
  }, [filteredResults]);

  const visibleResults = useMemo(
    () => filteredResults.slice(0, visibleCount),
    [filteredResults, visibleCount]
  );
  const hasMore = visibleCount < filteredResults.length;

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
      <Header variant="solid" />

      <SearchHero
        initialQuery={initialQuery}
        onResults={setResults}
        onLoading={setLoading}
        onParsedFilters={setParsedFilters}
      />

      <section className="pt-6 md:pt-8 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              {!loading && results.length > 0 && (
                <p className="text-body text-xs tracking-[0.15em] uppercase text-muted-foreground">
                  {hasMore
                    ? `Exibindo ${visibleResults.length} de ${filteredResults.length} resultados`
                    : `${filteredResults.length} ${filteredResults.length === 1 ? "resultado" : "resultados"}`}
                </p>
              )}
              {parsedFilters && !loading && (
                <FilterChips filters={parsedFilters} />
              )}
              {tagParam && !loading && (
                <Badge
                  variant="outline"
                  className="text-body text-xs gap-2 rounded-full border-primary/40 bg-primary/5 text-primary cursor-pointer hover:bg-primary/10"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.delete("tag");
                    setSearchParams(next);
                  }}
                >
                  Lifestyle: {tagParam} <span className="opacity-60">×</span>
                </Badge>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="rounded-lg aspect-[4/5]" />
              ))}
            </div>
          )}

          {!loading && (
            <>
              <BentoGrid
                results={visibleResults}
                compareIds={compareIds}
                onToggleCompare={handleToggleCompare}
              />
              {hasMore && (
                <div className="flex justify-center mt-12 md:mt-16">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setVisibleCount((c) => c + 8)}
                    className="text-body text-xs tracking-[0.2em] uppercase rounded-full px-10 py-6 border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    Ver mais imóveis
                  </Button>
                </div>
              )}
            </>
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
