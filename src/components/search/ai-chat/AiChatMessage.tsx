import ReactMarkdown from "react-markdown";
import rafaAvatar from "@/assets/rafa-avatar.png";
import type { ChatMessage } from "./types";

interface Props {
  message: ChatMessage;
}

const AiChatMessage = ({ message }: Props) => {
  const isUser = message.role === "user";
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-body text-sm">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 items-start">
      <img
        src={rafaAvatar}
        alt="Rafa IA"
        width={36}
        height={36}
        loading="lazy"
        className="w-9 h-9 rounded-full object-cover bg-muted flex-shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0 prose prose-sm max-w-none text-body text-sm text-foreground leading-relaxed [&_p]:my-0 [&_strong]:font-medium [&_strong]:text-foreground">
        <ReactMarkdown>{message.content}</ReactMarkdown>
        {typeof message.matchCount === "number" && message.matchCount > 0 && !message.preview && (
          <p className="text-[11px] text-muted-foreground mt-1 tracking-wide uppercase">
            {message.matchCount} {message.matchCount === 1 ? "imóvel encontrado" : "imóveis encontrados"}
          </p>
        )}
      </div>
    </div>
  );
};

export default AiChatMessage;
