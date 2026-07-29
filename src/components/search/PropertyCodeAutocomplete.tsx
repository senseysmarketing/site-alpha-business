import { ArrowRight, Hash, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Suggestion {
  id: string;
  code: string;
  title: string;
  price: number | null;
  rental_price: number | null;
}

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const LIMIT = 6;

let defaultCache: Suggestion[] | null = null;
let defaultInflight: Promise<Suggestion[]> | null = null;


interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

const PropertyCodeAutocomplete = ({ value, onChange, onSubmit }: Props) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Initial suggestions (loaded once, reused)
  useEffect(() => {
    if (value.trim().length >= 2) return;
    let cancelled = false;
    (async () => {
      if (!defaultCache) {
        if (!defaultInflight) {
          defaultInflight = supabase
            .from("properties")
            .select("id, code, title, price, rental_price")
            .eq("status", "ativo")
            .order("is_featured", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(LIMIT)
            .then(({ data }) => {
              defaultCache = (data as Suggestion[]) ?? [];
              defaultInflight = null;
              return defaultCache;
            });
        }
        await defaultInflight;
      }
      if (!cancelled) {
        setItems(defaultCache ?? []);
        setHighlight(-1);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  // Debounced search
  useEffect(() => {
    const term = value.trim();
    if (term.length < 2) return;
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      const safe = term.replace(/[%,()]/g, "");
      const { data } = await supabase
        .from("properties")
        .select("id, code, title, price, rental_price")
        .eq("status", "ativo")
        .or(`code.ilike.%${safe}%,title.ilike.%${safe}%`)
        .order("code", { ascending: true })
        .limit(LIMIT);
      if (cancelled) return;
      setItems((data as Suggestion[]) ?? []);
      setHighlight(-1);
      setLoading(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);


  const select = useCallback(
    (item: Suggestion) => {
      setOpen(false);
      navigate(`/imovel/${item.id}`);
    },
    [navigate],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || items.length === 0) {
      if (e.key === "Enter") onSubmit();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? items.length - 1 : h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0) select(items[highlight]);
      else onSubmit();
    }
  };

  const showPanel = open && value.trim().length >= 2;

  return (
    <div ref={wrapRef} className="flex-1 relative">
      <Hash size={14} className="absolute left-3 top-[22px] -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value.toUpperCase());
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar por código do imóvel (ex: AB1234)"
        aria-autocomplete="list"
        aria-expanded={showPanel}
        className="w-full bg-background border border-border rounded-md pl-9 pr-24 py-2.5 text-body text-sm text-foreground outline-none focus:ring-1 focus:ring-primary tracking-wider"
      />
      <button
        onClick={onSubmit}
        disabled={!value.trim()}
        className="absolute right-1.5 top-[22px] -translate-y-1/2 inline-flex items-center gap-1 px-3 py-1.5 rounded text-body text-[10px] tracking-[0.1em] uppercase bg-foreground text-background disabled:opacity-30 disabled:cursor-not-allowed hover:bg-foreground/90 transition-colors"
      >
        Ir <ArrowRight size={12} />
      </button>

      {showPanel && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-background border border-border rounded-md shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-body text-xs text-muted-foreground">
              <Loader2 size={13} className="animate-spin" /> Buscando…
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-3 text-body text-xs text-muted-foreground">
              Nenhum imóvel encontrado
            </div>
          ) : (
            <ul className="max-h-[260px] overflow-y-auto overscroll-contain">
              {items.map((item, i) => {
                const value = item.price ?? item.rental_price;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => select(item)}
                      className={`w-full text-left flex items-center gap-3 px-4 min-h-[48px] py-2.5 transition-colors ${
                        highlight === i ? "bg-muted" : "hover:bg-muted"
                      }`}
                    >
                      <span className="text-body text-[11px] tracking-[0.1em] uppercase text-foreground font-medium shrink-0">
                        {item.code}
                      </span>
                      <span className="text-body text-xs text-muted-foreground truncate flex-1">
                        {item.title}
                      </span>
                      {value ? (
                        <span className="text-body text-[11px] text-foreground shrink-0">
                          {brl.format(Number(value))}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyCodeAutocomplete;
