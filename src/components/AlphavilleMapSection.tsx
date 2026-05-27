import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { condoSignature } from "@/lib/condoMatching";
import { fetchAllActivePropertyCondoRows } from "@/lib/propertyQueries";
import { useCondoList } from "@/hooks/useCondoList";

const COLLAPSED_LIMIT = 24;

interface CondoAvailability {
  hasVenda: boolean;
  hasAluguel: boolean;
}

type CondoAvailabilityEntry = CondoAvailability & {
  displayName: string;
};

const AlphavilleMapSection = () => {
  const navigate = useNavigate();
  const { condos: condoNames, loading: condoNamesLoading } = useCondoList();

  const { data: availabilityBySignature, isLoading: availabilityLoading } = useQuery({
    queryKey: ["condo-availability-v2"],
    queryFn: async () => {
      const props = await fetchAllActivePropertyCondoRows();
      const availability = new Map<string, CondoAvailabilityEntry>();

      for (const row of props) {
        if (!row.condominium) continue;
        const key = condoSignature(row.condominium);
        if (!key) continue;
        const existing = availability.get(key) || {
          hasVenda: false,
          hasAluguel: false,
          displayName: row.condominium,
        };
        if (row.transaction_type === "venda") existing.hasVenda = true;
        if (row.transaction_type === "locacao" || row.transaction_type === "aluguel") existing.hasAluguel = true;
        if (row.transaction_type === "ambos") { existing.hasVenda = true; existing.hasAluguel = true; }
        availability.set(key, existing);
      }

      return availability;
    },
  });

  const condoMap = useMemo(() => {
    const map = new Map<string, CondoAvailability>();
    const used = new Set<string>();

    for (const condo of condoNames) {
      const key = condoSignature(condo);
      const availability = availabilityBySignature?.get(key);
      if (!availability || (!availability.hasVenda && !availability.hasAluguel)) continue;
      map.set(condo, {
        hasVenda: availability.hasVenda,
        hasAluguel: availability.hasAluguel,
      });
      used.add(key);
    }

    for (const [key, availability] of availabilityBySignature ?? []) {
      if (used.has(key) || (!availability.hasVenda && !availability.hasAluguel)) continue;
      map.set(availability.displayName, {
        hasVenda: availability.hasVenda,
        hasAluguel: availability.hasAluguel,
      });
    }

    return map;
  }, [availabilityBySignature, condoNames]);

  const [expanded, setExpanded] = useState(false);

  const handleClick = (condo: string, type: "venda" | "locacao") => {
    const params = new URLSearchParams({ condominium: condo, transactionType: type });
    navigate(`/busca?${params.toString()}`);
  };

  const isLoading = condoNamesLoading || availabilityLoading;
  const allCondos = Array.from(condoMap.entries()).sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));
  const condos = expanded ? allCondos : allCondos.slice(0, COLLAPSED_LIMIT);
  const hasMore = allCondos.length > COLLAPSED_LIMIT;

  return (
    <section id="mapa" className="px-6 md:px-12 lg:px-24 py-8 md:py-12">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="mb-10 flex items-center justify-between gap-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-display text-2xl md:text-3xl font-normal text-foreground">
            Conheça o seu futuro imóvel em Alphaville
          </h2>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-x-6 gap-y-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : condos.length === 0 ? (
          <p className="text-body text-sm text-muted-foreground">
            Nenhum condomínio com imóveis ativos no momento.
          </p>
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-x-6 gap-y-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {condos.map(([condo, availability]) => (
              <div key={condo}>
                <span className="text-display text-base font-normal text-foreground block mb-1">
                  {condo}
                </span>
                <div className="flex items-center gap-2 text-body text-xs text-muted-foreground">
                  {availability.hasVenda && (
                    <button
                      onClick={() => handleClick(condo, "venda")}
                      className="hover:text-foreground transition-colors"
                    >
                      Comprar
                    </button>
                  )}
                  {availability.hasVenda && availability.hasAluguel && (
                    <span className="text-muted-foreground/50">|</span>
                  )}
                  {availability.hasAluguel && (
                    <button
                      onClick={() => handleClick(condo, "locacao")}
                      className="hover:text-foreground transition-colors"
                    >
                      Alugar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {!isLoading && hasMore && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-body text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors border-b border-muted-foreground/30 hover:border-foreground pb-1"
            >
              {expanded ? "Ver menos" : `Ver mais (${allCondos.length - COLLAPSED_LIMIT})`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default AlphavilleMapSection;
