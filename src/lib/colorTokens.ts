// HEX → HSL conversion + design token application to :root
// Converts admin-saved colors into the CSS variables consumed by the whole app.

export interface DesignTokens {
  accent_color: string;
  background_color: string;
  secondary_color: string;
}

export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  accent_color: "#2A070C",
  background_color: "#F5F0EB",
  secondary_color: "#8B7D6B",
};

interface HSL {
  h: number;
  s: number;
  l: number;
}

function normalizeHex(hex: string): string {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return h;
}

export function hexToHslObject(hex: string): HSL {
  const h = normalizeHex(hex);
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hh = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hh = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hh = (b - r) / d + 2; break;
      case b: hh = (r - g) / d + 4; break;
    }
    hh /= 6;
  }
  return { h: Math.round(hh * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hexToHSL(hex: string): string {
  const { h, s, l } = hexToHslObject(hex);
  return `${h} ${s}% ${l}%`;
}

function hsl(h: number, s: number, l: number): string {
  return `${h} ${Math.max(0, Math.min(100, s))}% ${Math.max(0, Math.min(100, l))}%`;
}

const STORAGE_KEY = "alpha_design_tokens_cache";

export function applyDesignTokens(tokens: DesignTokens): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const accent = hexToHslObject(tokens.accent_color);
  const bg = hexToHslObject(tokens.background_color);
  const sec = hexToHslObject(tokens.secondary_color);

  // Accent family — used by primary, foreground, bordeaux, accent, ring
  const accentStr = hsl(accent.h, accent.s, accent.l);
  const accentLight = hsl(accent.h, accent.s, Math.min(accent.l + 8, 95));
  root.style.setProperty("--accent", accentStr);
  root.style.setProperty("--bordeaux", accentStr);
  root.style.setProperty("--bordeaux-light", accentLight);
  root.style.setProperty("--primary", accentStr);
  root.style.setProperty("--ring", accentStr);
  root.style.setProperty("--foreground", accentStr);
  root.style.setProperty("--card-foreground", accentStr);
  root.style.setProperty("--popover-foreground", accentStr);
  root.style.setProperty("--secondary-foreground", accentStr);

  // Background family
  const bgStr = hsl(bg.h, bg.s, bg.l);
  const cardStr = hsl(bg.h, Math.max(bg.s - 8, 0), Math.max(bg.l - 2, 0));
  const mutedStr = hsl(bg.h, Math.max(bg.s - 15, 0), Math.max(bg.l - 8, 0));
  const borderStr = hsl(bg.h, Math.max(bg.s - 13, 0), Math.max(bg.l - 11, 0));
  root.style.setProperty("--background", bgStr);
  root.style.setProperty("--popover", bgStr);
  root.style.setProperty("--card", cardStr);
  root.style.setProperty("--muted", mutedStr);
  root.style.setProperty("--border", borderStr);
  root.style.setProperty("--input", borderStr);
  root.style.setProperty("--primary-foreground", bgStr);
  root.style.setProperty("--accent-foreground", bgStr);
  root.style.setProperty("--cashmere", hsl(bg.h, Math.max(bg.s, 20), Math.max(bg.l - 11, 0)));

  // Secondary family
  const secStr = hsl(sec.h, sec.s, sec.l);
  root.style.setProperty("--secondary", secStr);
  root.style.setProperty("--greige", secStr);
  root.style.setProperty("--muted-foreground", hsl(sec.h, Math.max(sec.s - 5, 0), Math.max(sec.l - 13, 0)));

  // Legacy preview var (kept for any consumer)
  root.style.setProperty("--color-accent-preview", tokens.accent_color);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    /* ignore */
  }
}

export function loadCachedTokens(): DesignTokens | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DesignTokens;
  } catch {
    return null;
  }
}
