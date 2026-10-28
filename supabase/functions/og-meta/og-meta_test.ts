import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { metaTags, parsePath, unavailableMeta } from "../_shared/og-meta.ts";
import { resolveMeta } from "./resolve.ts";

const CA1020 = {
  id: "d0a75d58-ee6d-4a0e-bde6-ebfd76b9f71c", code: "CA1020", title: "Casa com 5 suítes à venda, 889 m² por R$ 28.900.000 - Alphaville 2 - Barueri/SP",
  property_type: "casa", transaction_type: "venda", condominium: "Alphaville 2", city: "Barueri", price: 28900000, status: "ativo",
  photos: ["https://x/p.jpg"], social_image_url: "https://x/social.jpg",
};
const CANON = "/imovel/casas-em-alphaville/alphaville-2/casa-com-5-suites-a-venda-889-m-por-r-28-900-000-alphaville-2-barueri-sp-ca1020";

// Minimal fake of the supabase query builder.
// deno-lint-ignore no-explicit-any
const fakeDb = (rows: Record<string, any[]>) => ({
  from: (t: string) => {
    // deno-lint-ignore no-explicit-any
    let list = rows[t] ?? []; const q: any = {
      select: () => q,
      eq: (k: string, v: unknown) => { list = list.filter((r) => r[k] === v); return q; },
      ilike: (k: string, v: string) => { list = list.filter((r) => String(r[k]).toLowerCase() === v.toLowerCase()); return q; },
      limit: () => q,
      maybeSingle: () => Promise.resolve({ data: list[0] ?? null, error: null }),
    };
    return q;
  },
});

Deno.test("parsePath: code, uuid, legacy friendly url, blog", () => {
  assertEquals(parsePath(CANON), { kind: "property", code: "CA1020" });
  assertEquals(parsePath(`/imovel/${CA1020.id}`), { kind: "property", id: CA1020.id });
  assertEquals(parsePath("/imovel/casa-a-venda/alphaville-2/casa-ca1020"), { kind: "property", code: "CA1020" });
  assertEquals(parsePath("/blog/minha-noticia"), { kind: "post", slug: "minha-noticia" });
  assertEquals(parsePath("/busca"), null);
});

Deno.test("canonical url returns live meta with social image", async () => {
  const r = await resolveMeta(fakeDb({ properties: [CA1020] }), CANON);
  assertEquals(r.status, "ok");
  if (r.status !== "ok") return;
  assert(r.tags.includes(`https://rafaelalbuquerque.com.br${CANON}`));
  assert(r.tags.includes('content="https://x/social.jpg"'));
});

Deno.test("uuid and old slug redirect once to canonical", async () => {
  for (const p of [`/imovel/${CA1020.id}`, "/imovel/casa-a-venda/alphaville-2/casa-ca1020"]) {
    const r = await resolveMeta(fakeDb({ properties: [CA1020] }), p);
    assertEquals(r, { status: "moved", httpStatus: 301, location: CANON });
  }
});

Deno.test("inactive property never shows price or photo", async () => {
  const r = await resolveMeta(fakeDb({ properties: [{ ...CA1020, status: "inativo" }] }), CANON);
  assertEquals(r.status, "inactive");
  if (r.status !== "inactive") return;
  assert(!r.tags.includes("28.900.000") && !r.tags.includes("social.jpg"));
  assert(r.tags.includes("noindex"));
});

Deno.test("missing property is 404 noindex", async () => {
  const r = await resolveMeta(fakeDb({ properties: [] }), "/imovel/casas-em-alphaville/x/casa-ca9999");
  assertEquals(r.status, "not_found");
  if (r.status === "not_found") assertEquals(r.httpStatus, 404);
});

Deno.test("blog: desktop cover first, mobile fallback, unpublished hidden", async () => {
  const base = { slug: "n", title: "Notícia", published_at: "2020-01-01", social_image_url: null };
  const a = await resolveMeta(fakeDb({ blog_posts: [{ ...base, cover_image: "https://x/d.jpg", cover_image_mobile: "https://x/m.jpg" }] }), "/blog/n");
  assert(a.status === "ok" && a.tags.includes("https://x/d.jpg"));
  const b = await resolveMeta(fakeDb({ blog_posts: [{ ...base, cover_image: null, cover_image_mobile: "https://x/m.jpg" }] }), "/blog/n");
  assert(b.status === "ok" && b.tags.includes("https://x/m.jpg"));
  const c = await resolveMeta(fakeDb({ blog_posts: [{ ...base, published_at: "2999-01-01" }] }), "/blog/n");
  assertEquals(c.status, "inactive");
});

Deno.test("each managed tag appears exactly once", () => {
  const tags = metaTags(unavailableMeta("property"));
  for (const k of ["<title>", 'rel="canonical"', 'property="og:image"', 'name="description"', 'name="twitter:card"']) {
    assertEquals(tags.split(k).length - 1, 1, k);
  }
});
