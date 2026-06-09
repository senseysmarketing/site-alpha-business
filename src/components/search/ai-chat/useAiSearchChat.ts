import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  ChatMessage,
  ConversationResponse,
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
    { label: "Quero comprar", value: "Quero comprar uma casa", kind: "transaction" },
    { label: "Quero alugar", value: "Quero alugar uma casa", kind: "transaction" },
    { label: "Tenho um código", value: "Quero ver o imóvel ", kind: "code" },
  ],
};

export function useAiSearchChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialAssistant]);
  const [filters, setFilters] = useState<PropertySearchFilters>({ highlights: [] });
  const [loading, setLoading] = useState(false);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const reset = useCallback(() => {
    setMessages([{ ...initialAssistant, id: uid() }]);
    setFilters({ highlights: [] });
  }, []);

  const send = useCallback(async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;

    const userMsg: ChatMessage = { id: uid(), role: "user", content: message };
    const historyForApi = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-property-search", {
        body: {
          action: "converse",
          message,
          currentFilters: filtersRef.current,
          history: historyForApi,
        },
      });
      if (error) {
        console.error("ai-property-search invoke error:", error, "data:", data);
        throw error;
      }
      const r = (data ?? {}) as Partial<ConversationResponse> & { error?: string };
      if (r.error) console.error("ai-property-search error payload:", r.error);
      if (r.parsedFilters) setFilters(r.parsedFilters);
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
          preview: r.showResults ? r.resultsPreview : undefined,
          matchCount: r.matchCount,
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
  }, [loading, messages]);

  const sendOption = useCallback((opt: OptionChip) => {
    // Chips with kind "navigate" handled by caller
    void send(opt.label);
  }, [send]);

  return { messages, filters, loading, send, sendOption, reset, setFilters };
}
