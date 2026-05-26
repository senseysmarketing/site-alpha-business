/**
 * Condo name matching utilities.
 *
 * The same physical condominium can appear in the properties table with many
 * grafias ("Jardins de Tamboré", "Jardins do Tamboré", "Ed. Jardins Tamboré",
 * "Edifício Jardins Tamboré"...). To group/filter them robustly, we reduce
 * each name to a set of significant tokens (no accents, no stopwords, no
 * common prefixes) and match when all tokens of the query are present in the
 * candidate.
 */

const STOPWORDS = new Set([
  "edificio",
  "ed",
  "residencial",
  "resid",
  "res",
  "condominio",
  "cond",
  "condo",
  "the",
  "de",
  "do",
  "da",
  "dos",
  "das",
  "e",
  "of",
  "at",
  "in",
  "le",
  "la",
  "les",
]);

export function normalizeCondoTokens(name: string | null | undefined): string[] {
  if (!name) return [];
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t) && (t.length > 1 || /^\d$/.test(t)));
}

/** True when every significant token of `query` exists in `candidate`. */
export function matchCondo(candidate: string | null | undefined, query: string | null | undefined): boolean {
  const qt = normalizeCondoTokens(query);
  if (!qt.length) return false;
  const ct = new Set(normalizeCondoTokens(candidate));
  return qt.every((t) => ct.has(t));
}

/** Stable signature used to group variants of the same condo. */
export function condoSignature(name: string | null | undefined): string {
  return normalizeCondoTokens(name).sort().join(" ");
}
