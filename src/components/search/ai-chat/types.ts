export interface PropertySearchFilters {
  code?: string | null;
  transactionType?: "venda" | "locacao" | null;
  propertyType?: string | null;
  condominium?: string | null;
  condominiumGroup?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  minBedrooms?: number | null;
  minBathrooms?: number | null;
  minParking?: number | null;
  minArea?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  highlights?: string[];
}

export interface OptionChip {
  label: string;
  value: string;
  kind: string;
}

export interface PropertyResult {
  id: string;
  code: string;
  title: string;
  condominium: string | null;
  neighborhood: string | null;
  city: string | null;
  price: number | null;
  rental_price: number | null;
  transaction_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spots: number | null;
  area_total: number | null;
  photo: string | null;
  relevance_reason: string;
}

export interface ConversationResponse {
  assistantMessage: string;
  parsedFilters: PropertySearchFilters;
  suggestedOptions?: OptionChip[];
  matchCount?: number;
  needsClarification?: boolean;
  clarificationType?: string | null;
  showResults?: boolean;
  resultsPreview?: PropertyResult[];
  nextAction?: "ask" | "confirm" | "show";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  options?: OptionChip[];
  preview?: PropertyResult[];
  matchCount?: number;
}

export function filtersToSearchParams(f: PropertySearchFilters): string {
  const p = new URLSearchParams();
  if (f.transactionType) p.set("transactionType", f.transactionType);
  if (f.propertyType) p.set("propertyType", f.propertyType);
  if (f.condominium) p.set("condominium", f.condominium);
  if (f.city) p.set("city", f.city);
  if (f.neighborhood) p.set("neighborhood", f.neighborhood);
  if (f.minBedrooms) p.set("minBedrooms", String(f.minBedrooms));
  if (f.minBathrooms) p.set("minBathrooms", String(f.minBathrooms));
  if (f.minParking) p.set("minParking", String(f.minParking));
  if (f.minArea) p.set("minArea", String(f.minArea));
  if (f.minPrice) p.set("minPrice", String(f.minPrice));
  if (f.maxPrice) p.set("maxPrice", String(f.maxPrice));
  return p.toString();
}
