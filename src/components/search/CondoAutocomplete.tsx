import { ChevronDown, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCondoList } from "@/hooks/useCondoList";
import { normalizeCondoName } from "@/lib/lucideIconMap";

const LIMIT = 8;

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Chamado apenas quando o usuário escolhe um item da lista. */
  onSelect?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const CondoAutocomplete = ({ value, onChange, onSelect, placeholder = "Condomínio", className = "" }: Props) => {
  const { condos, loading } = useCondoList();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const filtered = useMemo(() => {
    const term = normalizeCondoName(value.trim());
    if (!term) return condos.slice(0, LIMIT);
    return condos.filter((c) => normalizeCondoName(c).includes(term)).slice(0, LIMIT);
  }, [condos, value]);

  const total = useMemo(() => {
    const term = normalizeCondoName(value.trim());
    if (!term) return condos.length;
    return condos.filter((c) => normalizeCondoName(c).includes(term)).length;
  }, [condos, value]);

  const select = (name: string) => {
    onChange(name);
    onSelect?.(name);
    setOpen(false);
    setHighlight(-1);
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? filtered.length - 1 : h - 1));
    } else if (e.key === "Enter" && highlight >= 0) {
      e.preventDefault();
      select(filtered[highlight]);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Condomínio"
        aria-autocomplete="list"
        aria-expanded={open}
        className={`${className} pr-8`}
      />
      {value ? (
        <button
          type="button"
          aria-label="Limpar condomínio"
          onClick={() => {
            onChange("");
            setOpen(false);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={14} />
        </button>
      ) : (
        <ChevronDown
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
      )}

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-background border border-border rounded-md shadow-xl overflow-hidden">
          {loading ? (
            <div className="px-4 py-3 text-body text-xs text-muted-foreground">Carregando…</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-3 text-body text-xs text-muted-foreground">
              Nenhum condomínio encontrado
            </div>
          ) : (
            <>
              <ul className="max-h-[260px] overflow-y-auto overscroll-contain">
                {filtered.map((name, i) => (
                  <li key={name}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => select(name)}
                      className={`w-full text-left px-4 min-h-[44px] py-2.5 text-body text-xs text-foreground transition-colors ${
                        highlight === i ? "bg-muted" : "hover:bg-muted"
                      }`}
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
              {total > filtered.length && (
                <div className="px-4 py-2 border-t border-border text-body text-[10px] tracking-[0.08em] uppercase text-muted-foreground">
                  digite para ver mais
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CondoAutocomplete;
