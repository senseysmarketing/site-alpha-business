import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  ChatMessage,
  ConversationResponse,
  ConversationState,
  OptionChip,
  PropertySearchFilters,
} from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

const CACHE_KEY = "rafa-ia:chat:v1";
const CACHE_VERSION = 1;
const CACHE_TTL_MS = 45 * 60 * 1000; // 45 minutos
const MAX_STORED_MESSAGES = 40;
const MAX_HISTORY_FOR_AI = 20;

const initialAssistant: ChatMessage = {
  id: uid(),
  role: "assistant",
  content:
    "Olá! Sou o **Rafa IA**. Posso te ajudar a encontrar o imóvel ideal em Alphaville/Tamboré. Me conta: você quer comprar, alugar, ou já tem o código de um imóvel em mente?",
  options: [
    { label: "Quero comprar", value: "venda", kind: "transaction", action: "set_transaction" },
    { label: "Quero alugar", value: "locacao", kind: "transaction", action: "set_transaction" },
    { label: "Tenho um código", value: "code", kind: "code" },
  ],
};

const emptyState: ConversationState = { filters: { highlights: [] } };

interface CachePayload {
  v: number;
  updatedAt: number;
  messages: ChatMessage[];
  state: ConversationState;
}

function readCache(): CachePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachePayload;
    if (!parsed || parsed.v !== CACHE_VERSION) return null;
    if (Date.now() - parsed.updatedAt > CACHE_TTL_MS) return null;
    if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearCache() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* noop */
  }
}

function isPristine(messages: ChatMessage[], state: ConversationState): boolean {
  if (messages.length > 1) return false;
  if (messages.length === 1 && messages[0].role !== "assistant") return false;
  const f = state.filters || {};
  const hasFilter = Object.entries(f).some(([k, v]) => {
    if (v == null) return false;
    if (k === "highlights" && Array.isArray(v) && v.length === 0) return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  });
  return !hasFilter;
}

function pruneMessages(msgs: ChatMessage[]): ChatMessage[] {
  if (msgs.length <= MAX_STORED_MESSAGES) return msgs;
  // mantém a primeira (âncora do assistente) + as últimas (MAX-1)
  const head = msgs[0];
  const tail = msgs.slice(-(MAX_STORED_MESSAGES - 1));
  return [head, ...tail];
}

function buildHistoryForApi(msgs: ChatMessage[]) {
  if (msgs.length <= MAX_HISTORY_FOR_AI) {
    return msgs.map((m) => ({ role: m.role, content: m.content }));
  }
  const head = msgs[0];
  const tail = msgs.slice(-(MAX_HISTORY_FOR_AI - 1));
  return [head, ...tail].map((m) => ({ role: m.role, content: m.content }));
}

type SendInput = string | { message: string; selectedOption?: OptionChip };

export function useAiSearchChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const cached = readCache();
    return cached?.messages ?? [initialAssistant];
  });
  const [state, setState] = useState<ConversationState>(() => {
    const cached = readCache();
    return cached?.state ?? emptyState;
  });
  const [loading, setLoading] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Persistência automática
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isPristine(messages, state)) return;
    try {
      const payload: CachePayload = {
        v: CACHE_VERSION,
        updatedAt: Date.now(),
        messages: pruneMessages(messages),
        state,
      };
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    } catch {
      /* quota/safari privado: ignorar */
    }
  }, [messages, state]);

  // Sincronização entre abas/instâncias
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== CACHE_KEY) return;
      if (!e.newValue) {
        setMessages([{ ...initialAssistant, id: uid() }]);
        setState(emptyState);
        return;
      }
      try {
        const parsed = JSON.parse(e.newValue) as CachePayload;
        if (parsed?.v === CACHE_VERSION && Array.isArray(parsed.messages)) {
          setMessages(parsed.messages);
          setState(parsed.state ?? emptyState);
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setFilters = useCallback(
    (updater: (prev: PropertySearchFilters) => PropertySearchFilters) => {
      setState((prev) => ({ ...prev, filters: updater(prev.filters) }));
    },
    [],
  );

  const reset = useCallback(() => {
    clearCache();
    setMessages([{ ...initialAssistant, id: uid() }]);
    setState(emptyState);
  }, []);

  const send = useCallback(
    async (input: SendInput) => {
      const message = (typeof input === "string" ? input : input.message).trim();
      const selectedOption = typeof input === "string" ? undefined : input.selectedOption;
      if (!message || loading) return;

      const userMsg: ChatMessage = { id: uid(), role: "user", content: message };
      const historyForApi = buildHistoryForApi([...messages, userMsg]);
      setMessages((m) => [...m, userMsg]);
      setLoading(true);

      try {
        const { data, error } = await supabase.functions.invoke("ai-property-search", {
          body: {
            action: "converse_v3",
            message,
            selectedOption,
            conversation_state: stateRef.current.filters,
            currentState: stateRef.current,
            history: historyForApi,
          },
        });
        if (error) {
          console.error("ai-property-search invoke error:", error, "data:", data);
          throw error;
        }
        const r = (data ?? {}) as Partial<ConversationResponse> & { error?: string };
        if (r.error) console.error("ai-property-search error payload:", r.error);
        if (r.updatedState) setState(r.updatedState);
        else if (r.parsedFilters) setState((prev) => ({ ...prev, filters: r.parsedFilters! }));

        const fallback = r.error
          ? "Tive um problema técnico ao processar sua mensagem. Pode tentar de novo?"
          : "Pode me contar um pouco mais? Ex: tipo do imóvel, condomínio ou faixa de preço.";
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: "assistant",
            content: r.assistantMessage?.trim() ? r.assistantMessage : fallback,
            options: r.suggestedOptions,
            preview: r.resultsPreview,
            matchCount: r.matchCount,
            links: r.links,
            breakdown: r.breakdown,
            responseType: r.responseType,
          },
        ]);
      } catch (e) {
        console.error("chat error", e);
        toast.error("Não consegui processar agora. Tente novamente.");
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: "assistant",
            content: "Tive um problema técnico. Pode tentar novamente em instantes?",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages],
  );

  const sendOption = useCallback(
    (opt: OptionChip) => {
      void send({ message: opt.label, selectedOption: opt });
    },
    [send],
  );

  return {
    messages,
    state,
    filters: state.filters,
    loading,
    send,
    sendOption,
    reset,
    setFilters,
    setState,
  };
}
