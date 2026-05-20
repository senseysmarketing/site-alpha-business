import {
  Utensils,
  TreePine,
  ShoppingBag,
  GraduationCap,
  Trees,
  Dumbbell,
  Waves,
  Plane,
  Train,
  Car,
  Hospital,
  Coffee,
  Wine,
  MapPin,
  Building2,
  Mountain,
  Sun,
  Sparkles,
  Heart,
  Church,
  Landmark,
  Palette,
  Music,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  TreePine,
  ShoppingBag,
  GraduationCap,
  Trees,
  Dumbbell,
  Waves,
  Plane,
  Train,
  Car,
  Hospital,
  Coffee,
  Wine,
  MapPin,
  Building2,
  Mountain,
  Sun,
  Sparkles,
  Heart,
  Church,
  Landmark,
  Palette,
  Music,
  Briefcase,
};

export const LUCIDE_ICON_NAMES = Object.keys(LUCIDE_ICON_MAP);

export function getLucideIcon(name?: string | null): LucideIcon {
  if (!name) return MapPin;
  return LUCIDE_ICON_MAP[name] ?? MapPin;
}

export const normalizeCondoName = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
