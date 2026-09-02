import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { fetchAllPages } from "@/lib/supabasePagination";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

export type ActivePropertySearchRow = Pick<
  PropertyRow,
  | "id"
  | "code"
  | "title"
  | "condominium"
  | "neighborhood"
  | "city"
  | "price"
  | "rental_price"
  | "transaction_type"
  | "property_type"
  | "bedrooms"
  | "bathrooms"
  | "parking_spots"
  | "area_total"
  | "photos"
  | "is_featured"
  | "created_at"
>;

export type PropertyCondoAvailabilityRow = Pick<
  PropertyRow,
  "condominium" | "transaction_type"
>;

export type PropertyPriceRow = Pick<
  PropertyRow,
  "price" | "rental_price" | "transaction_type"
>;

export type AdminPropertyListRow = Pick<
  PropertyRow,
  | "id"
  | "code"
  | "title"
  | "condominium"
  | "property_type"
  | "transaction_type"
  | "price"
  | "rental_price"
  | "status"
  | "source"
  | "created_at"
>;

const ACTIVE_PROPERTY_SEARCH_SELECT =
  "id, code, title, condominium, neighborhood, city, price, rental_price, transaction_type, property_type, bedrooms, bathrooms, parking_spots, area_total, photos, is_featured, created_at";

const ADMIN_PROPERTY_SELECT =
  "id, code, title, condominium, property_type, transaction_type, price, rental_price, status, source, created_at";

/** Strict: only legacy rental-only rows. */
export const isRentalTransaction = (transactionType: string | null | undefined) =>
  transactionType === "locacao" || transactionType === "aluguel";

/** Strict: only sale-only rows. */
export const isSaleTransaction = (transactionType: string | null | undefined) =>
  transactionType === "venda";

/** Inclusive: row offers a rental price (rental-only OR ambos). */
export const hasRentalOffer = (transactionType: string | null | undefined) =>
  isRentalTransaction(transactionType) || transactionType === "ambos";

/** Inclusive: row offers a sale price (sale-only OR ambos). */
export const hasSaleOffer = (transactionType: string | null | undefined) =>
  transactionType === "venda" || transactionType === "ambos";

export const hasBothTransactions = (transactionType: string | null | undefined) =>
  transactionType === "ambos";

/** SQL `IN` lists that include the unified "ambos" row. */
export const SALE_TRANSACTION_TYPES = ["venda", "ambos"] as const;
export const RENTAL_TRANSACTION_TYPES = ["locacao", "aluguel", "ambos"] as const;


export async function fetchAllActivePropertySearchRows(
  transactionType?: string | null
): Promise<ActivePropertySearchRow[]> {
  return fetchAllPages<ActivePropertySearchRow>(() => {
    let query = supabase
      .from("properties")
      .select(ACTIVE_PROPERTY_SEARCH_SELECT)
      .eq("status", "ativo");

    if (transactionType === "venda") {
      query = query.in("transaction_type", [...SALE_TRANSACTION_TYPES]);
    } else if (isRentalTransaction(transactionType)) {
      query = query.in("transaction_type", [...RENTAL_TRANSACTION_TYPES]);
    }

    return query
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
  });
}


export async function fetchAllPropertyCondoRows(
  options: { activeOnly?: boolean } = {}
): Promise<PropertyCondoAvailabilityRow[]> {
  return fetchAllPages<PropertyCondoAvailabilityRow>(() =>
    {
      let query = supabase
      .from("properties")
      .select("condominium, transaction_type")
      .not("condominium", "is", null);

      if (options.activeOnly) {
        query = query.eq("status", "ativo");
      }

      return query.order("condominium", { ascending: true });
    }
  );
}

export async function fetchAllActivePropertyCondoRows(): Promise<PropertyCondoAvailabilityRow[]> {
  return fetchAllPropertyCondoRows({ activeOnly: true });
}

export async function fetchAllActivePropertyPriceRows(): Promise<PropertyPriceRow[]> {
  return fetchAllPages<PropertyPriceRow>(() =>
    supabase
      .from("properties")
      .select("price, rental_price, transaction_type")
      .eq("status", "ativo")
  );
}

export async function fetchAllAdminPropertyRows(): Promise<AdminPropertyListRow[]> {
  return fetchAllPages<AdminPropertyListRow>(() =>
    supabase
      .from("properties")
      .select(ADMIN_PROPERTY_SELECT)
      .order("created_at", { ascending: false })
  );
}
