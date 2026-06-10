import { useCallback, useRef, useState } from "react";
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

type SendInput = string | { message: string; selectedOption?: OptionChip };

export function useAiSearchChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialAssistant]);
  const [state, setState] = useState<ConversationState>({ filters: { highlights: [] } });
  const [loading, setLoading] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const setFilters = useCallback(
    (updater: (prev: PropertySearchFilters) => PropertySearchFilters) => {
      setState((prev) => ({ ...prev, filters: updater(prev.filters) }));
    },
    [],
  );

  const reset = useCallback(() => {
    setMessages([{ ...initialAssistant, id: uid() }]);
    setState({ filters: { highlights: [] } });
  }, []);

  const send = useCallback(
    async (input: SendInput) => {
      const message = (typeof input === "string" ? input : input.message).trim();
      const selectedOption = typeof input === "string" ? undefined : input.selectedOption;
      if (!message || loading) return;

      const userMsg: ChatMessage = { id: uid(), role: "user", content: message };
      const historyForApi = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
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
