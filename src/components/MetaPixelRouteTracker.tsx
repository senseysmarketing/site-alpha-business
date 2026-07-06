import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/metaPixel";

/**
 * Dispara PageView do Meta Pixel a cada mudança de rota (SPA).
 * O PageView inicial já é disparado pelo snippet em index.html.
 */
const MetaPixelRouteTracker = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    trackPageView();
  }, [location.pathname, location.search]);

  return null;
};

import { useRef } from "react";
export default MetaPixelRouteTracker;
