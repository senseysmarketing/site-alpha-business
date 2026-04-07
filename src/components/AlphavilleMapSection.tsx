import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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
        if (row.transaction_type === "aluguel") existing.hasAluguel = true;
        map.set(row.condominium, existing);
      }
      return map;
    },
  });

  const handleClick = (condo: string, type: "venda" | "aluguel") => {
    const params = new URLSearchParams({ condo, transactionType: type });
    navigate(`/imoveis?${params.toString()}`);
  };

  const condos = condoMap ? Array.from(condoMap.entries()) : [];

  return (
    <section id="mapa" className="px-6 md:px-12 lg:px-24 py-20 md:py-32 bg-muted/50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 md:mb-16">
          <motion.p
            className="text-body text-xs tracking-[0.3em] uppercase text-foreground/40 mb-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Regiões
          </motion.p>
          <motion.h2
            className="text-display text-3xl md:text-5xl font-light text-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            Conheça o seu futuro imóvel em{" "}
            <em className="italic">Alphaville</em>
          </motion.h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border-b border-border pb-3 space-y-2">
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
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {condos.map(([condo, availability]) => (
              <div key={condo} className="border-b border-border pb-3">
                <span className="text-body text-sm text-foreground font-medium block mb-1">
                  {condo}
                </span>
                <div className="flex items-center gap-2 text-body text-xs">
                  {availability.hasVenda && (
                    <button
                      onClick={() => handleClick(condo, "venda")}
                      className="text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
                    >
                      Comprar
                    </button>
                  )}
                  {availability.hasVenda && availability.hasAluguel && (
                    <span className="text-muted-foreground">|</span>
                  )}
                  {availability.hasAluguel && (
                    <button
                      onClick={() => handleClick(condo, "aluguel")}
                      className="text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
                    >
                      Alugar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default AlphavilleMapSection;
