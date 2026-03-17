import { useEffect, useState, useRef, useCallback } from "react";
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  Link, Quote, List, ListOrdered, Code, Minus, Image
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

type Props = {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onInsertMarkdown: (before: string, after: string) => void;
};

type ToolButton = {
  icon: React.ElementType;
  before: string;
  after: string;
  title: string;
  lineStart?: boolean; // insert at beginning of line
};

const inlineButtons: ToolButton[] = [
  { icon: Bold, before: "**", after: "**", title: "Negrito" },
  { icon: Italic, before: "_", after: "_", title: "Itálico" },
  { icon: Strikethrough, before: "~~", after: "~~", title: "Tachado" },
  { icon: Code, before: "`", after: "`", title: "Código" },
  { icon: Link, before: "[", after: "](url)", title: "Link" },
];

const blockButtons: ToolButton[] = [
  { icon: Heading1, before: "\n# ", after: "", title: "Título H1", lineStart: true },
  { icon: Heading2, before: "\n## ", after: "", title: "Subtítulo H2", lineStart: true },
  { icon: Heading3, before: "\n### ", after: "", title: "Subtítulo H3", lineStart: true },
];

const listButtons: ToolButton[] = [
  { icon: List, before: "\n- ", after: "", title: "Lista", lineStart: true },
  { icon: ListOrdered, before: "\n1. ", after: "", title: "Lista numerada", lineStart: true },
  { icon: Quote, before: "\n> ", after: "", title: "Citação", lineStart: true },
  { icon: Minus, before: "\n---\n", after: "", title: "Linha horizontal", lineStart: true },
  { icon: Image, before: "![", after: "](url)", title: "Imagem" },
];

// Bubble menu buttons (subset)
const bubbleButtons: ToolButton[] = [
  { icon: Bold, before: "**", after: "**", title: "Negrito" },
  { icon: Italic, before: "_", after: "_", title: "Itálico" },
  { icon: Heading2, before: "\n## ", after: "", title: "Subtítulo" },
  { icon: Link, before: "[", after: "](url)", title: "Link" },
  { icon: Quote, before: "\n> ", after: "", title: "Citação" },
];

const ToolbarButton = ({ icon: Icon, title, onClick }: { icon: React.ElementType; title: string; onClick: () => void }) => (
  <button
    title={title}
    type="button"
    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
  >
    <Icon className="h-4 w-4" />
  </button>
);

const EditorToolbar = ({ textareaRef, onInsertMarkdown }: Props) => {
  // Bubble menu state
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);

  const checkSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    if (selectionStart !== selectionEnd && document.activeElement === textarea) {
      const rect = textarea.getBoundingClientRect();
      setBubblePosition({ top: rect.top - 48, left: rect.left + rect.width / 2 });
      setBubbleVisible(true);
    } else {
      setBubbleVisible(false);
    }
  }, [textareaRef]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const handleSelect = () => setTimeout(checkSelection, 10);
    textarea.addEventListener("select", handleSelect);
    textarea.addEventListener("mouseup", handleSelect);
    textarea.addEventListener("keyup", handleSelect);
    const handleBlur = (e: FocusEvent) => {
      if (bubbleRef.current?.contains(e.relatedTarget as Node)) return;
      setBubbleVisible(false);
    };
    textarea.addEventListener("blur", handleBlur);
    return () => {
      textarea.removeEventListener("select", handleSelect);
      textarea.removeEventListener("mouseup", handleSelect);
      textarea.removeEventListener("keyup", handleSelect);
      textarea.removeEventListener("blur", handleBlur);
    };
  }, [textareaRef, checkSelection]);

  return (
    <>
      {/* Persistent toolbar */}
      <div className="sticky top-0 z-10 flex items-center gap-0.5 px-2 py-1.5 mb-4 rounded-lg bg-muted/50 border border-border/50">
        {blockButtons.map((btn) => (
          <ToolbarButton key={btn.title} icon={btn.icon} title={btn.title} onClick={() => onInsertMarkdown(btn.before, btn.after)} />
        ))}
        <Separator orientation="vertical" className="h-5 mx-1" />
        {inlineButtons.map((btn) => (
          <ToolbarButton key={btn.title} icon={btn.icon} title={btn.title} onClick={() => onInsertMarkdown(btn.before, btn.after)} />
        ))}
        <Separator orientation="vertical" className="h-5 mx-1" />
        {listButtons.map((btn) => (
          <ToolbarButton key={btn.title} icon={btn.icon} title={btn.title} onClick={() => onInsertMarkdown(btn.before, btn.after)} />
        ))}
      </div>

      {/* Bubble menu on selection */}
      {bubbleVisible && (
        <div
          ref={bubbleRef}
          className="fixed z-50 flex items-center gap-0.5 px-2 py-1.5 rounded-lg bg-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-150"
          style={{ top: bubblePosition.top, left: bubblePosition.left, transform: "translateX(-50%)" }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {bubbleButtons.map(({ icon: Icon, before, after, title }) => (
            <button
              key={title}
              title={title}
              className="p-1.5 rounded text-background/80 hover:text-background hover:bg-white/10 transition-colors"
              onClick={() => { onInsertMarkdown(before, after); setBubbleVisible(false); }}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default EditorToolbar;
