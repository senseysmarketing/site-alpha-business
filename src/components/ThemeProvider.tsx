import { useLayoutEffect, type ReactNode } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  applyDesignTokens,
  loadCachedTokens,
  type DesignTokens,
} from "@/lib/colorTokens";

// Apply cached tokens synchronously at module load to avoid flash of old colors
const cached = loadCachedTokens();
if (cached) applyDesignTokens(cached);

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const { data } = useSiteSettings<DesignTokens>("design_tokens");

  useLayoutEffect(() => {
    if (data) applyDesignTokens(data);
  }, [data]);

  return <>{children}</>;
}
