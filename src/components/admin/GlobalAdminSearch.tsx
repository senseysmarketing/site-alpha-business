import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Loader2, User as UserIcon, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type LeadHit = { id: string; name: string; email: string | null; phone: string | null };
type PropertyHit = { id: string; code: string | null; title: string | null; condominium: string | null };

function useDebounced<T>(value: T, delay = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function normalizePhone(input: string) {
  return input.replace(/\D/g, "").slice(-11);
}

export function GlobalAdminSearch({ onSelect }: { onSelect?: () => void }) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<LeadHit[]>([]);
  const [props, setProps] = useState<PropertyHit[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounced(term, 250);

  // ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Click outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const q = debounced.trim();
    if (q.length < 2) {
      setLeads([]);
      setProps([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    const like = `%${q}%`;
    const phoneDigits = normalizePhone(q);

    const leadsOr = [
      `name.ilike.${like}`,
      `email.ilike.${like}`,
      phoneDigits ? `phone_normalized.ilike.%${phoneDigits}%` : null,
    ]
      .filter(Boolean)
      .join(",");

    const propsOr = [
      `code.ilike.${like}`,
      `title.ilike.${like}`,
      `condominium.ilike.${like}`,
      `neighborhood.ilike.${like}`,
    ].join(",");

    Promise.all([
      supabase
        .from("leads")
        .select("id, name, email, phone")
        .or(leadsOr)
        .limit(5),
      supabase
        .from("properties")
        .select("id, code, title, condominium")
        .or(propsOr)
        .limit(5),
    ])
      .then(([lRes, pRes]) => {
        if (cancelled) return;
        setLeads((lRes.data as LeadHit[]) || []);
        setProps((pRes.data as PropertyHit[]) || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const hasResults = leads.length > 0 || props.length > 0;
  const showDropdown = open && term.trim().length >= 2;

  const goLead = (id: string) => {
    setOpen(false);
    setTerm("");
    if (onSelect) onSelect();
    navigate(`/admin/leads?leadId=${id}`);
  };

  const goProperty = (id: string) => {
    setOpen(false);
    setTerm("");
    if (onSelect) onSelect();
    navigate(`/admin/imoveis/${id}`);
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="relative">
        {loading ? (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 animate-spin" />
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
        )}
        <Input
          ref={inputRef}
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Pesquisar Imóveis ou Leads"
          className="pl-9 h-9 bg-white/50 border-border/30 font-[Inter] text-sm placeholder:text-muted-foreground/40 focus-visible:ring-[#2A070C]/20"
        />
      </div>

      {showDropdown && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 rounded-md border border-border/40 bg-white/95 backdrop-blur-md shadow-lg font-[Inter] text-sm overflow-hidden">
          {!hasResults && !loading && (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              Nenhum resultado para "{term}".
            </div>
          )}

          {leads.length > 0 && (
            <div className="py-1">
              <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground/70">
                Leads
              </div>
              {leads.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => goLead(l.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/60 transition-colors"
                  )}
                >
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-foreground">{l.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {l.email || l.phone || "—"}
                    </div>
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (onSelect) onSelect();
                  navigate(`/admin/leads?q=${encodeURIComponent(term)}`);
                }}
                className="w-full px-3 py-1.5 text-left text-[11px] text-[#2A070C] hover:bg-muted/60"
              >
                Ver todos os leads →
              </button>
            </div>
          )}

          {props.length > 0 && (
            <div className="py-1 border-t border-border/30">
              <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground/70">
                Imóveis
              </div>
              {props.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => goProperty(p.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/60 transition-colors"
                >
                  <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-foreground">
                      {p.code ? <span className="text-muted-foreground mr-1.5">{p.code}</span> : null}
                      {p.title || "Sem título"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {p.condominium || "—"}
                    </div>
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (onSelect) onSelect();
                  navigate(`/admin/imoveis?q=${encodeURIComponent(term)}`);
                }}
                className="w-full px-3 py-1.5 text-left text-[11px] text-[#2A070C] hover:bg-muted/60"
              >
                Ver todos os imóveis →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
