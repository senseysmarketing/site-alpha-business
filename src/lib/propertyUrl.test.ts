import { describe, expect, it } from "vitest";
import {
  buildPropertyUrl,
  buildPropertyCategory,
  buildPropertySeoRegion,
  extractPropertyCodeFromSlug,
  isLegacyPropertyId,
  normalizePropertyCode,
  slugify,
} from "./propertyUrl";

describe("propertyUrl", () => {
  it("builds SEO-friendly property URLs with code as the stable suffix", () => {
    const url = buildPropertyUrl({
      id: "422cd1ba-0d32-4f91-8d25-9f2d78aaa8bb",
      code: "CA0079",
      title: "Casa com 5 suítes à venda",
      property_type: "Casa",
      transaction_type: "venda",
      condominium: "Alphaville Zero",
      city: "Barueri/SP",
      bedrooms: 5,
      area_total: 1079,
    });

    expect(url).toBe(
      "/imovel/casas-em-alphaville/alphaville-zero/casa-com-5-suites-a-venda-ca0079",
    );
  });

  it("extracts and normalizes the code from the last slug segment", () => {
    expect(
      extractPropertyCodeFromSlug(
        "casa-com-5-suites-1079m2-alphaville-zero-barueri-sp-ca0079",
      ),
    ).toBe("CA0079");
    expect(normalizePropertyCode(" ca-0079 ")).toBe("CA0079");
  });

  it("normalizes accents and preserves legacy UUID detection", () => {
    expect(slugify("Tamboré & São Paulo")).toBe("tambore-e-sao-paulo");
    expect(isLegacyPropertyId("422cd1ba-0d32-4f91-8d25-9f2d78aaa8bb")).toBe(true);
    expect(isLegacyPropertyId("ca0079")).toBe(false);
  });

  it("falls back to the legacy property route when a property has no code", () => {
    expect(
      buildPropertyUrl({
        id: "422cd1ba-0d32-4f91-8d25-9f2d78aaa8bb",
        title: "Casa sem código cadastrado",
      }),
    ).toBe("/imovel/422cd1ba-0d32-4f91-8d25-9f2d78aaa8bb");
  });

  it("matches the approved CA1020 canonical URL", () => {
    expect(buildPropertyUrl({
      id: "422cd1ba-0d32-4f91-8d25-9f2d78aaa8bb",
      code: "CA1020",
      title: "Casa com 5 suítes à venda, 889 m² por R$ 28.900.000 - Alphaville 2 - Barueri/SP",
      property_type: "casa",
      transaction_type: "venda",
      condominium: "Alphaville 2",
      city: "Barueri",
    })).toBe(
      "/imovel/casas-em-alphaville/alphaville-2/casa-com-5-suites-a-venda-889-m-por-r-28-900-000-alphaville-2-barueri-sp-ca1020",
    );
  });

  it.each([
    ["apartamento", "apartamentos-em-alphaville"],
    ["terreno", "terrenos-em-alphaville"],
    ["galpão", "galpoes-em-alphaville"],
    ["loft", "imoveis-em-alphaville"],
  ])("pluralizes %s with a controlled fallback", (propertyType, expected) => {
    expect(buildPropertyCategory({ property_type: propertyType, condominium: "Tamboré 11" })).toBe(expected);
  });

  it("keeps Alphaville for Tamboré and Gênesis and prepares Granja Viana", () => {
    expect(buildPropertySeoRegion({ condominium: "Tamboré 11" })).toBe("alphaville");
    expect(buildPropertySeoRegion({ condominium: "Gênesis 2" })).toBe("alphaville");
    expect(buildPropertySeoRegion({ condominium: "Vintage Granja Viana", city: "Cotia" })).toBe("granja-viana");
  });

  it("uses neighborhood or city when condominium is absent", () => {
    expect(buildPropertyUrl({
      code: "AP1234",
      title: "Apartamento mobiliado",
      property_type: "apartamento",
      neighborhood: "Alphaville Industrial",
      city: "Barueri",
    })).toBe(
      "/imovel/apartamentos-em-alphaville/alphaville-industrial/apartamento-mobiliado-ap1234",
    );
  });

  it("does not duplicate a code already present at the end of the title", () => {
    expect(buildPropertyUrl({
      code: "TE0042",
      title: "Terreno em Alphaville TE0042",
      property_type: "terreno",
      condominium: "Alphaville 2",
    })).toBe(
      "/imovel/terrenos-em-alphaville/alphaville-2/terreno-em-alphaville-te0042",
    );
  });
});
