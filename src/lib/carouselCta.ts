export type CarouselCtaMode = "search" | "url" | "hidden";

export interface CarouselCtaSearchFilters {
  condominium?: string;
  transactionType?: "venda" | "locacao" | "all";
  propertyType?: string;
  city?: string;
  neighborhood?: string;
}

export interface CarouselCta {
  label?: string;
  mode?: CarouselCtaMode;
  filters?: CarouselCtaSearchFilters;
  url?: string;
  openInNewTab?: boolean;
}

const DEFAULT_LABEL = "Ver todos";

export function getCtaLabel(cta?: CarouselCta): string {
  return cta?.label?.trim() || DEFAULT_LABEL;
}

export function buildCtaHref(cta?: CarouselCta): string | null {
  const mode = cta?.mode ?? "search";
  if (mode === "hidden") return null;

  if (mode === "url") {
    const url = cta?.url?.trim();
    return url || null;
  }

  // search
  const f = cta?.filters || {};
  const params = new URLSearchParams();
  if (f.condominium) params.set("condominium", f.condominium);
  if (f.transactionType && f.transactionType !== "all") params.set("transactionType", f.transactionType);
  if (f.propertyType) params.set("propertyType", f.propertyType);
  if (f.city) params.set("city", f.city);
  if (f.neighborhood) params.set("neighborhood", f.neighborhood);
  const qs = params.toString();
  return qs ? `/busca?${qs}` : "/busca";
}

export function isExternalUrl(url: string | null): boolean {
  if (!url) return false;
  return /^https?:\/\//i.test(url);
}
