import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const COLLAPSED_LIMIT = 24;

interface CondoAvailability {
  hasVenda: boolean;
  hasAluguel: boolean;
}

const AlphavilleMapSection = () => {
  const navigate = useNavigate();

  const { data: condoMap, isLoading } = useQuery({
    queryKey: ["condo-availability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("condominium, transaction_type")
        .eq("status", "ativo")
        .not("condominium", "is", null);

      if (error) throw error;

      const map = new Map<string, CondoAvailability>();
      for (const row of data || []) {
        if (!row.condominium) continue;
        const existing = map.get(row.condominium) || { hasVenda: false, hasAluguel: false };
        if (row.transaction_type === "venda") existing.hasVenda = true;
        if (row.transaction_type === "locacao" || row.transaction_type === "aluguel") existing.hasAluguel = true;
        if (row.transaction_type === "ambos") {
          existing.hasVenda = true;
          existing.hasAluguel = true;
        }
        map.set(row.condominium, existing);
      }
      return map;
    },
  });

  const [expanded, setExpanded] = useState(false);

  const handleClick = (condo: string, type: "venda" | "locacao") => {
    const params = new URLSearchParams({ condominium: condo, transactionType: type });
    navigate(`/busca?${params.toString()}`);
  };

  const allCondos = condoMap ? Array.from(condoMap.entries()) : [];
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
