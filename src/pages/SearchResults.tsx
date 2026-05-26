import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { SlidersHorizontal, GitCompareArrows } from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchHero from "@/components/search/SearchHero";
import BentoGrid from "@/components/search/BentoGrid";
import AdvancedFiltersDrawer, {
  type Filters,
  type FilterBounds,
  defaultFilters,
} from "@/components/search/AdvancedFiltersDrawer";
import CompareModal from "@/components/search/CompareModal";
import ConciergeSidebar from "@/components/search/ConciergeSidebar";
import FilterChips, { type ParsedFilters } from "@/components/search/FilterChips";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCondoList, resolveCanonicalCondo } from "@/hooks/useCondoList";
import { matchCondo } from "@/lib/condoMatching";

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
  property_type?: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spots?: number | null;
  area_total: number | null;
  is_featured?: boolean | null;
  photo: string | null;
  relevance_reason: string;
}

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
  const [visibleCount, setVisibleCount] = useState(9);

  // When there is no query (e.g. navigation from condo links), load full active list from Supabase.
  const condoParam = searchParams.get("condominium") || "";
  const txParam = searchParams.get("transactionType") || "";
  useEffect(() => {
    if (initialQuery) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      let q = supabase
        .from("properties")
        .select(
          "id, code, title, condominium, neighborhood, city, price, rental_price, transaction_type, property_type, bedrooms, bathrooms, parking_spots, area_total, photos, is_featured, created_at"
        )
        .eq("status", "ativo");
      if (txParam === "venda" || txParam === "locacao" || txParam === "aluguel") {
        q = q.in("transaction_type", txParam === "venda" ? ["venda"] : ["locacao", "aluguel"]);
      }
      const { data, error } = await q
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
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
            property_type: p.property_type,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            parking_spots: p.parking_spots,
            area_total: p.area_total,
            is_featured: p.is_featured,
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
  }, [initialQuery, txParam]);

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
      if (filters.propertyType !== "all" && r.property_type !== filters.propertyType) return false;
      if (filters.minBedrooms > 0 && (r.bedrooms || 0) < filters.minBedrooms) return false;
      if (filters.minBathrooms > 0 && (r.bathrooms || 0) < filters.minBathrooms) return false;
      if (filters.minParking > 0 && (r.parking_spots || 0) < filters.minParking) return false;
      if (r.area_total != null) {
        if (r.area_total < filters.areaRange[0] || r.area_total > filters.areaRange[1]) return false;
      }
      if (filters.city !== "all" && r.city !== filters.city) return false;
      if (filters.neighborhood !== "all" && r.neighborhood !== filters.neighborhood) return false;
      if (filters.onlyFeatured && !r.is_featured) return false;
      if (filters.condominium !== "all") {
        if (!matchCondo(r.condominium, filters.condominium)) return false;
      }
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
    setVisibleCount(9);
  }, [filteredResults]);

  const visibleResults = useMemo(
    () => filteredResults.slice(0, visibleCount),
    [filteredResults, visibleCount]
  );
  const hasMore = visibleCount < filteredResults.length;

  const { condos: allCondos } = useCondoList();
  const condominiums = useMemo(() => {
    if (allCondos.length) return allCondos;
    return [...new Set(results.map((r) => r.condominium).filter(Boolean))] as string[];
  }, [allCondos, results]);

  // Compute filter bounds dynamically from loaded results.
  const bounds = useMemo<FilterBounds>(() => {
    const salePrices = results
      .filter((r) => !isRental(r.transaction_type) && r.price)
      .map((r) => r.price as number);
    const rentPrices = results
      .filter((r) => isRental(r.transaction_type) && r.rental_price)
      .map((r) => r.rental_price as number);
    const areas = results.filter((r) => r.area_total).map((r) => r.area_total as number);

    const roundUp = (n: number, step: number) => Math.ceil(n / step) * step;
    const roundDown = (n: number, step: number) => Math.floor(n / step) * step;

    const saleMin = salePrices.length ? roundDown(Math.min(...salePrices), 100_000) : 0;
    const saleMax = salePrices.length ? roundUp(Math.max(...salePrices), 100_000) : 50_000_000;
    const rentMin = rentPrices.length ? roundDown(Math.min(...rentPrices), 1_000) : 0;
    const rentMax = rentPrices.length ? roundUp(Math.max(...rentPrices), 1_000) : 50_000;
    const areaMin = areas.length ? roundDown(Math.min(...areas), 10) : 0;
    const areaMax = areas.length ? roundUp(Math.max(...areas), 10) : 5000;

    const propertyTypes = [
      ...new Set(results.map((r) => r.property_type).filter(Boolean) as string[]),
    ].sort();
    const cities = [
      ...new Set(results.map((r) => r.city).filter(Boolean) as string[]),
    ].sort();
    const neighborhoods = [
      ...new Set(results.map((r) => r.neighborhood).filter(Boolean) as string[]),
    ].sort();

    return {
      saleRange: [saleMin, saleMax],
      rentRange: [rentMin, rentMax],
      areaRange: [areaMin, areaMax],
      propertyTypes,
      cities,
      neighborhoods,
    };
  }, [results]);

  // Initialize price/area ranges to real bounds once data lands.
  const [boundsInitialized, setBoundsInitialized] = useState(false);
  useEffect(() => {
    if (boundsInitialized || results.length === 0) return;
    setFilters((f) => ({
      ...f,
      priceRange: isRental(f.transactionType) ? bounds.rentRange : bounds.saleRange,
      areaRange: bounds.areaRange,
    }));
    setBoundsInitialized(true);
  }, [bounds, results.length, boundsInitialized]);

  // Canonicalize condominium filter coming from URL once the list is loaded.
  useEffect(() => {
    if (!allCondos.length || filters.condominium === "all") return;
    const canonical = resolveCanonicalCondo(filters.condominium, allCondos);
    if (canonical && canonical !== filters.condominium) {
      setFilters((f) => ({ ...f, condominium: canonical }));
    }
  }, [allCondos, filters.condominium]);

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
                    onClick={() => setVisibleCount((c) => c + 9)}
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
        bounds={bounds}
        matchCount={filteredResults.length}
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
