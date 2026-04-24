import { useSiteSettings } from "@/hooks/useSiteSettings";

export type KenloSyncConfig = {
  import_sale: boolean;
  import_rental: boolean;
  split_dual: boolean;
  min_price: number;
  max_price: number;
  allowed_property_types: string[];
  allowed_condominiums: string[];
  missing_behavior: "inativar" | "manter" | "deletar";
  protected_fields: string[];
};

export const DEFAULT_KENLO_CONFIG: KenloSyncConfig = {
  import_sale: true,
  import_rental: true,
  split_dual: true,
  min_price: 0,
  max_price: 0,
  allowed_property_types: [],
  allowed_condominiums: [],
  missing_behavior: "inativar",
  protected_fields: ["is_featured", "engineering_highlights"],
};

export function useKenloSyncConfig() {
  return useSiteSettings<KenloSyncConfig>("kenlo_sync_config");
}

export function useKenloLastIp() {
  return useSiteSettings<{ ip: string; checked_at: string }>(
    "kenlo_last_outbound_ip",
  );
}
