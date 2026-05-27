import { useEffect, useState } from "react";
import { fetchAllActivePropertyPriceRows, isRentalTransaction } from "@/lib/propertyQueries";

export interface PriceBounds {
  saleMin: number;
  saleMax: number;
  rentMin: number;
  rentMax: number;
  loading: boolean;
}

const DEFAULTS: PriceBounds = {
  saleMin: 500_000,
  saleMax: 15_000_000,
  rentMin: 3_000,
  rentMax: 50_000,
  loading: true,
};

let cache: PriceBounds | null = null;
let inflight: Promise<PriceBounds> | null = null;

async function loadPriceBounds(): Promise<PriceBounds> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    const rows = await fetchAllActivePropertyPriceRows().catch(() => null);
    if (!rows) {
      cache = { ...DEFAULTS, loading: false };
      inflight = null;
      return cache;
    }

    const sale = rows
      .filter((p) => !isRentalTransaction(p.transaction_type) && p.price)
      .map((p) => Number(p.price));
    const rent = rows
      .filter((p) => isRentalTransaction(p.transaction_type) && p.rental_price)
      .map((p) => Number(p.rental_price));

    cache = {
      saleMin: sale.length ? Math.min(...sale) : DEFAULTS.saleMin,
      saleMax: sale.length ? Math.max(...sale) : DEFAULTS.saleMax,
      rentMin: rent.length ? Math.min(...rent) : DEFAULTS.rentMin,
      rentMax: rent.length ? Math.max(...rent) : DEFAULTS.rentMax,
      loading: false,
    };
    inflight = null;
    return cache;
  })();

  return inflight;
}

export const usePriceBounds = (): PriceBounds => {
  const [bounds, setBounds] = useState<PriceBounds>(cache ?? DEFAULTS);

  useEffect(() => {
    let cancelled = false;
    loadPriceBounds().then((next) => {
      if (!cancelled) setBounds(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return bounds;
};

const formatBRL = (n: number): string => {
  if (n >= 1_000_000) {
    const mi = n / 1_000_000;
    const str = mi >= 10 ? mi.toFixed(0) : mi.toFixed(1).replace(/\.0$/, "");
    return `R$ ${str.replace(".", ",")} mi`;
  }
  if (n >= 1_000) {
    return `R$ ${Math.round(n / 1_000)} mil`;
  }
  return `R$ ${n}`;
};

/**
 * Build 6–8 stepped price options between min and max for a select dropdown.
 * Rounds to clean steps based on magnitude.
 */
export const buildPriceOptions = (
  min: number,
  max: number,
  rental = false
): { value: string; label: string }[] => {
  if (!isFinite(min) || !isFinite(max) || max <= min) return [];

  const step = rental
    ? max > 30_000 ? 5_000 : 2_000
    : max > 10_000_000
      ? 1_000_000
      : max > 3_000_000
        ? 500_000
        : 250_000;

  const roundDown = (n: number) => Math.floor(n / step) * step;
  const roundUp = (n: number) => Math.ceil(n / step) * step;

  const start = roundUp(min);
  const end = roundDown(max);
  if (end <= start) {
    return [{ value: String(min), label: formatBRL(min) }];
  }

  const targetCount = 7;
  const rawStep = (end - start) / (targetCount - 1);
  const niceStep = Math.max(step, Math.round(rawStep / step) * step);

  const values: number[] = [];
  for (let v = start; v <= end; v += niceStep) values.push(v);
  if (values[values.length - 1] !== end) values.push(end);

  return values.map((v) => ({ value: String(v), label: formatBRL(v) }));
};
