import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeCondoName } from "@/lib/lucideIconMap";

let cache: string[] | null = null;
let inflight: Promise<string[]> | null = null;

async function loadCondos(): Promise<string[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const names = new Map<string, string>(); // normalized -> canonical

    // 1) Try canonical condominiums table
    const { data: condos } = await supabase
      .from("condominiums")
      .select("name, is_active")
      .eq("is_active", true);
    condos?.forEach((c: any) => {
      if (c?.name) names.set(normalizeCondoName(c.name), c.name.trim());
    });

    // 2) Augment with distinct condominiums from active properties
    const { data: props } = await supabase
      .from("properties")
      .select("condominium")
      .eq("status", "ativo")
      .not("condominium", "is", null)
      .limit(1000);
    props?.forEach((p: any) => {
      if (!p?.condominium) return;
      const key = normalizeCondoName(p.condominium);
      if (!names.has(key)) names.set(key, p.condominium.trim());
    });

    const list = [...names.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
    cache = list;
    inflight = null;
    return list;
  })();
  return inflight;
}

export function useCondoList() {
  const [condos, setCondos] = useState<string[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let cancelled = false;
    loadCondos()
      .then((list) => {
        if (!cancelled) {
          setCondos(list);
          setLoading(false);
        }
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return { condos, loading };
}

/** Resolve a possibly-misencoded condo name to its canonical form in the list. */
export function resolveCanonicalCondo(value: string, list: string[]): string | null {
  if (!value) return null;
  const key = normalizeCondoName(value);
  return list.find((c) => normalizeCondoName(c) === key) ?? null;
}
