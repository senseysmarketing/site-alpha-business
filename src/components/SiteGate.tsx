import { useState, type ReactNode } from "react";
import { Lock, Construction } from "lucide-react";

const PASSWORD = "@Alpha123";
const STORAGE_KEY = "site_access";

const SiteGate = ({ children }: { children: ReactNode }) => {
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "granted"
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  // Admin routes bypass the gate
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "granted");
      setUnlocked(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full space-y-8">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Construction className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="font-[Raleway] text-3xl font-semibold tracking-tight text-foreground">
            Site em Construção
          </h1>
          <p className="text-muted-foreground font-[Raleway] text-sm leading-relaxed">
            Estamos preparando algo incrível para você.<br />
            Se você faz parte da equipe, insira a senha de acesso abaixo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Senha de acesso"
              className="w-full h-11 pl-10 pr-4 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-[Raleway] text-sm"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-destructive text-sm font-[Raleway]">
              Senha incorreta. Tente novamente.
            </p>
          )}

          <button
            type="submit"
            className="w-full h-11 rounded-md bg-primary text-primary-foreground font-[Raleway] text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Acessar
          </button>
        </form>

        <p className="text-muted-foreground/60 text-xs font-[Raleway]">
          Alpha Imóveis © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default SiteGate;
