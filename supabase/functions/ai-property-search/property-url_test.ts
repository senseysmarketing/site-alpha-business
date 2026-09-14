import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildPropertyUrl } from "../_shared/property-url.ts";

Deno.test("gera a mesma URL canônica de CA1020 usada no frontend", () => {
  assertEquals(
    buildPropertyUrl({
      id: "422cd1ba-0d32-4f91-8d25-9f2d78aaa8bb",
      code: "CA1020",
      title: "Casa com 5 suítes à venda, 889 m² por R$ 28.900.000 - Alphaville 2 - Barueri/SP",
      property_type: "casa",
      transaction_type: "venda",
      condominium: "Alphaville 2",
      city: "Barueri",
    }),
    "/imovel/casas-em-alphaville/alphaville-2/casa-com-5-suites-a-venda-889-m-por-r-28-900-000-alphaville-2-barueri-sp-ca1020",
  );
});

Deno.test("gera região Granja Viana e preserva fallback UUID", () => {
  assertEquals(
    buildPropertyUrl({
      code: "CG0003",
      title: "Casa no Vintage Granja Viana",
      property_type: "casa",
      condominium: "Vintage Granja Viana",
      city: "Cotia",
    }),
    "/imovel/casas-em-granja-viana/vintage-granja-viana/casa-no-vintage-granja-viana-cg0003",
  );
  assertEquals(
    buildPropertyUrl({ id: "422cd1ba-0d32-4f91-8d25-9f2d78aaa8bb", title: "Sem código" }),
    "/imovel/422cd1ba-0d32-4f91-8d25-9f2d78aaa8bb",
  );
});