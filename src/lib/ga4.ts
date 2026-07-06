/**
 * Google Analytics 4 (gtag.js) client-side helper.
 * Measurement ID: G-9DPKDHQ7CM
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const MEASUREMENT_ID = "G-9DPKDHQ7CM";

function event(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name, params ?? {});
  } catch {
    /* noop */
  }
}

export const trackPageView = (path?: string) => {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const page_path = path ?? window.location.pathname + window.location.search;
  try {
    window.gtag("event", "page_view", {
      page_path,
      page_location: window.location.href,
      page_title: document.title,
      send_to: MEASUREMENT_ID,
    });
  } catch {
    /* noop */
  }
};

export const trackViewContent = (params: {
  content_ids?: string[];
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}) =>
  event("view_item", {
    currency: "BRL",
    value: params.value,
    items: params.content_ids?.map((id) => ({
      item_id: id,
      item_name: params.content_name,
      item_category: params.content_category,
      price: params.value,
    })),
  });

export const trackSearch = (params: {
  search_string?: string;
  content_category?: string;
}) =>
  event("search", {
    search_term: params.search_string,
    search_type: params.content_category,
  });

export const trackLead = (params?: {
  content_name?: string;
  value?: number;
  currency?: string;
}) =>
  event("generate_lead", {
    currency: "BRL",
    ...params,
  });

export const trackContact = (params?: { content_name?: string }) =>
  event("contact", params);

export const trackSchedule = (params?: {
  content_name?: string;
  content_ids?: string[];
}) => event("schedule_visit", params);

export const trackSubmitApplication = (params?: {
  content_name?: string;
  value?: number;
  currency?: string;
}) =>
  event("submit_application", {
    currency: "BRL",
    ...params,
  });
