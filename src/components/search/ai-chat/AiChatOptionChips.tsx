import type { OptionChip } from "./types";

interface Props {
  options: OptionChip[];
  onSelect: (opt: OptionChip) => void;
}

const AiChatOptionChips = ({ options, onSelect }: Props) => {
  if (!options.length) return null;
  return (
    <div className="flex flex-wrap gap-2 pl-12">
      {options.map((opt, i) => (
        <button
          key={`${opt.value}-${i}`}
          onClick={() => onSelect(opt)}
          className="text-body text-xs tracking-wide px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted hover:border-foreground/30 transition-colors text-foreground"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default AiChatOptionChips;
