import { describe, expect, it } from "vitest";
import { fetchAllPages } from "@/lib/supabasePagination";

describe("fetchAllPages", () => {
  it("keeps loading pages until Supabase returns a short page", async () => {
    const pages = [
      [1, 2],
      [3, 4],
      [5],
    ];
    const ranges: Array<[number, number]> = [];

    const rows = await fetchAllPages(
      () => ({
        range: async (from, to) => {
          ranges.push([from, to]);
          return { data: pages.shift() ?? [], error: null };
        },
      }),
      2
    );

    expect(rows).toEqual([1, 2, 3, 4, 5]);
    expect(ranges).toEqual([
      [0, 1],
      [2, 3],
      [4, 5],
    ]);
  });
});
