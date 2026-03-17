import { useEffect, useState, useRef, useCallback } from "react";
import { Bold, Italic, Heading2, Link, Quote } from "lucide-react";

type Props = {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onInsertMarkdown: (before: string, after: string) => void;
};

const EditorToolbar = ({ textareaRef, onInsertMarkdown }: Props) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);

  const checkSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    if (selectionStart !== selectionEnd && document.activeElement === textarea) {
      const rect = textarea.getBoundingClientRect();
      // Position toolbar above the textarea center roughly
      setPosition({
        top: rect.top - 48,
        left: rect.left + rect.width / 2,
      });
      setVisible(true);
    } else {
      setVisible(false);
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
      // Don't hide if clicking toolbar
      if (toolbarRef.current?.contains(e.relatedTarget as Node)) return;
      setVisible(false);
    };
    textarea.addEventListener("blur", handleBlur);

    return () => {
      textarea.removeEventListener("select", handleSelect);
      textarea.removeEventListener("mouseup", handleSelect);
      textarea.removeEventListener("keyup", handleSelect);
      textarea.removeEventListener("blur", handleBlur);
    };
  }, [textareaRef, checkSelection]);

  const buttons = [
    { icon: Bold, before: "**", after: "**", title: "Negrito" },
    { icon: Italic, before: "_", after: "_", title: "Itálico" },
    { icon: Heading2, before: "\n## ", after: "", title: "Subtítulo" },
    { icon: Link, before: "[", after: "](url)", title: "Link" },
    { icon: Quote, before: "\n> ", after: "", title: "Citação" },
  ];

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 flex items-center gap-0.5 px-2 py-1.5 rounded-lg bg-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-150"
      style={{ top: position.top, left: position.left, transform: "translateX(-50%)" }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {buttons.map(({ icon: Icon, before, after, title }) => (
        <button
          key={title}
          title={title}
          className="p-1.5 rounded text-background/80 hover:text-background hover:bg-white/10 transition-colors"
          onClick={() => {
            onInsertMarkdown(before, after);
            setVisible(false);
          }}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
};

export default EditorToolbar;
