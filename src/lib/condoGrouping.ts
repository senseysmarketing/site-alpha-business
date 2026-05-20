export interface CondoGroupItem {
  label: string; // display label (e.g., "1" for grouped, full name for singles)
  full: string;  // full canonical name to use in query (?condo=...)
}

export interface CondoGroup {
  base: string;           // normalized base key
  canonical: string;      // display title (canonical base from data)
  items: CondoGroupItem[]; // numbered items, sorted by number
}

export interface CondoMenuData {
  groups: CondoGroup[];
  singles: CondoGroupItem[];
}

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const NUM_SUFFIX = /^(.*?)\s+(\d+)$/;

export function buildCondoMenuData(rawNames: string[]): CondoMenuData {
  // Dedupe by normalized full name, keep most frequent canonical variant
  const fullFreq = new Map<string, Map<string, number>>();
  for (const raw of rawNames) {
    if (!raw) continue;
    const trimmed = raw.trim().replace(/\s+/g, " ");
    if (!trimmed) continue;
    const key = normalize(trimmed);
    if (!fullFreq.has(key)) fullFreq.set(key, new Map());
    const inner = fullFreq.get(key)!;
    inner.set(trimmed, (inner.get(trimmed) ?? 0) + 1);
  }

  // Build list of canonical unique names with their normalized base/num
  type Entry = { canonical: string; normKey: string; base?: string; baseKey?: string; num?: number };
  const entries: Entry[] = [];
  for (const [normKey, variants] of fullFreq.entries()) {
    const canonical = [...variants.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const m = canonical.match(NUM_SUFFIX);
    if (m) {
      const base = m[1].trim();
      entries.push({
        canonical,
        normKey,
        base,
        baseKey: normalize(base),
        num: parseInt(m[2], 10),
      });
    } else {
      entries.push({ canonical, normKey });
    }
  }

  // Group by baseKey when 2+ numbered entries share it
  const baseBuckets = new Map<string, Entry[]>();
  for (const e of entries) {
    if (e.baseKey == null) continue;
    if (!baseBuckets.has(e.baseKey)) baseBuckets.set(e.baseKey, []);
    baseBuckets.get(e.baseKey)!.push(e);
  }

  const groupedKeys = new Set<string>();
  const groups: CondoGroup[] = [];

  for (const [baseKey, list] of baseBuckets.entries()) {
    if (list.length < 2) continue;
    // canonical base = most common base spelling
    const baseFreq = new Map<string, number>();
    list.forEach((e) => baseFreq.set(e.base!, (baseFreq.get(e.base!) ?? 0) + 1));
    const canonicalBase = [...baseFreq.entries()].sort((a, b) => b[1] - a[1])[0][0];

    const items = list
      .sort((a, b) => (a.num! - b.num!))
      .map((e) => ({ label: String(e.num), full: e.canonical }));

    groups.push({ base: baseKey, canonical: canonicalBase, items });
    list.forEach((e) => groupedKeys.add(e.normKey));
  }

  const singles: CondoGroupItem[] = entries
    .filter((e) => !groupedKeys.has(e.normKey))
    .map((e) => ({ label: e.canonical, full: e.canonical }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  groups.sort((a, b) => a.canonical.localeCompare(b.canonical, "pt-BR"));

  return { groups, singles };
}
