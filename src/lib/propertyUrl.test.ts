import { describe, expect, it } from "vitest";
import {
  buildPropertyUrl,
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
      "/imovel/casa-a-venda/alphaville-zero/casa-com-5-suites-a-venda-1079m2-alphaville-zero-barueri-sp-ca0079",
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
});
