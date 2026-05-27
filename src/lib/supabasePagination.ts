export const SUPABASE_PAGE_SIZE = 1000;

type PageResult<T> = {
  data: T[] | null;
  error: { message?: string } | null;
};

type RangeableQuery<T> = {
  range: (from: number, to: number) => PromiseLike<PageResult<T>>;
};

export async function fetchAllPages<T>(
  buildQuery: () => RangeableQuery<T>,
  pageSize = SUPABASE_PAGE_SIZE
): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw error;

    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }

  return rows;
}
