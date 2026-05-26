import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeCondoName } from "@/lib/lucideIconMap";
import { condoSignature, matchCondo } from "@/lib/condoMatching";

let cache: string[] | null = null;
let inflight: Promise<string[]> | null = null;

/** Pick the cleanest variant: shortest one without "ed." / "edificio" prefix. */
function pickCanonical(variants: string[]): string {
  const cleaned = variants.map((v) => v.trim());
  cleaned.sort((a, b) => {
    const aHasPrefix = /^(ed\.?|edificio|edifício|residencial|cond\.?|condomínio|condominio)\b/i.test(a) ? 1 : 0;
    const bHasPrefix = /^(ed\.?|edificio|edifício|residencial|cond\.?|condomínio|condominio)\b/i.test(b) ? 1 : 0;
    if (aHasPrefix !== bHasPrefix) return aHasPrefix - bHasPrefix;
    return a.length - b.length;
  });
  return cleaned[0];
}

async function loadCondos(): Promise<string[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    // Group by token signature so variants of the same condo collapse into one entry.
    const groups = new Map<string, string[]>();
    const add = (name?: string | null) => {
      if (!name) return;
      const sig = condoSignature(name);
      if (!sig) return;
      const arr = groups.get(sig) ?? [];
      arr.push(name.trim());
      groups.set(sig, arr);
    };

    const { data: condos } = await supabase
      .from("condominiums")
      .select("name, is_active")
      .eq("is_active", true);
    condos?.forEach((c: any) => add(c?.name));

    const { data: props } = await supabase
      .from("properties")
      .select("condominium")
      .eq("status", "ativo")
      .not("condominium", "is", null)
      .limit(1000);
    props?.forEach((p: any) => add(p?.condominium));

    const list = [...groups.values()]
      .map((variants) => pickCanonical(variants))
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
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
  // exact normalized match first
  const key = normalizeCondoName(value);
  const exact = list.find((c) => normalizeCondoName(c) === key);
  if (exact) return exact;
  // fall back to token match
  return list.find((c) => matchCondo(c, value)) ?? null;
}

