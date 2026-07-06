/**
 * Meta Pixel client-side helper.
 * CAPI (server-side) será adicionado quando o token estiver disponível.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type FbEventName =
  | "PageView"
  | "ViewContent"
  | "Search"
  | "Lead"
  | "Contact"
  | "Schedule"
  | "SubmitApplication";

function track(event: FbEventName, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    if (params && Object.keys(params).length > 0) {
      window.fbq("track", event, params);
    } else {
      window.fbq("track", event);
    }
  } catch {
    /* noop */
  }
}

export const trackPageView = () => track("PageView");

export const trackViewContent = (params: {
  content_ids?: string[];
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}) => track("ViewContent", { currency: "BRL", ...params });

export const trackSearch = (params: {
  search_string?: string;
  content_category?: string;
}) => track("Search", params);

export const trackLead = (params?: {
  content_name?: string;
  value?: number;
  currency?: string;
}) => track("Lead", { currency: "BRL", ...params });

export const trackContact = (params?: { content_name?: string }) =>
  track("Contact", params);

export const trackSchedule = (params?: {
  content_name?: string;
  content_ids?: string[];
}) => track("Schedule", params);

export const trackSubmitApplication = (params?: {
  content_name?: string;
  value?: number;
  currency?: string;
}) => track("SubmitApplication", { currency: "BRL", ...params });
