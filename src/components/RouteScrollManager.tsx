import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * In SPA navigation the browser keeps the previous scroll position.
 * Scroll to the top on new public-page navigations (including query-only
 * changes such as switching condominiums in /busca).
 *
 * Preserve hash anchors, filter normalization (REPLACE), and browser
 * Back/Forward navigation (POP). Never affect the admin workspace.
 */
export default function RouteScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const initialized = useRef(false);

  useLayoutEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    if (location.pathname.startsWith("/admin")) return;
    if (location.hash) return;
    if (navigationType !== "PUSH") return;
    if ((location.state as { preserveScroll?: boolean } | null)?.preserveScroll) return;

    window.scrollTo(0, 0);
  }, [location.key, location.pathname, location.hash, location.state, navigationType]);

  return null;
}
