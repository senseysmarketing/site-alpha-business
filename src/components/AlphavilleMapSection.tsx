import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const condominiums = [
  "Alphaville Residencial 1",
  "Alphaville Residencial 2",
  "Alphaville Residencial Zero",
  "Alphaville Residencial 3",
  "Alphaville Residencial 4",
  "Alphaville Residencial 5",
  "Alphaville Residencial 8",
  "Alphaville Residencial 9",
  "Alphaville Residencial 10",
  "Alphaville Residencial 11",
  "Tamboré 1",
  "Tamboré 2",
  "Tamboré 3",
  "Tamboré 5",
  "Tamboré 10",
  "Tamboré 11",
  "Aldeia da Serra",
  "Burle Marx",
  "Genesis",
  "Melville",
];

const AlphavilleMapSection = () => {
  const navigate = useNavigate();

  const handleClick = (condo: string, type: "venda" | "aluguel") => {
    const params = new URLSearchParams({ condo, transactionType: type });
    navigate(`/imoveis?${params.toString()}`);
  };

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

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {condominiums.map((condo) => (
            <div key={condo} className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-body text-sm text-foreground font-medium">{condo}</span>
              <div className="flex items-center gap-2 text-body text-xs">
                <button
                  onClick={() => handleClick(condo, "venda")}
                  className="text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
                >
                  Comprar
                </button>
                <span className="text-muted-foreground">|</span>
                <button
                  onClick={() => handleClick(condo, "aluguel")}
                  className="text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
                >
                  Alugar
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default AlphavilleMapSection;
