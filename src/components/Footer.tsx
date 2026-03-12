import logoAlpha from "@/assets/logo-alpha.png";

const Footer = () => {
  return (
    <footer id="contact" className="section-padding border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <img
              src={logoAlpha}
              alt="Alpha Business Imobiliária"
              className="h-10 w-auto brightness-0 mb-4"
            />
            <p className="text-body text-sm text-muted-foreground leading-relaxed max-w-sm">
              Especialistas no mercado imobiliário de altíssimo padrão em Alphaville.
              Experiência, curadoria e exclusividade há mais de 15 anos.
            </p>
          </div>
          <div>
            <p className="text-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">
              Navegação
            </p>
            <nav className="flex flex-col gap-3">
              {["Comprar", "Alugar", "Private Collection", "Blog", "Sobre nós"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-body text-sm text-foreground/70 hover:text-foreground transition-colors"
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>
          <div>
            <p className="text-body text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">
              Contato
            </p>
            <div className="flex flex-col gap-3 text-body text-sm text-foreground/70">
              <p>+55 (11) 99999-9999</p>
              <p>contato@alphabusiness.com.br</p>
              <p>Alphaville, Barueri - SP</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-body text-xs text-muted-foreground">
            © 2026 Alpha Business. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            {["Privacidade", "Termos", "CRECI: 00000-J"].map((item) => (
              <span key={item} className="text-body text-xs text-muted-foreground">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;