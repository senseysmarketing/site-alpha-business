import { useState } from "react";
import { Share2, Link as LinkIcon, Mail, Facebook, Twitter, MessageCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

interface ShareButtonProps {
  /** Path to the property page, e.g. `/imovel/123` */
  path: string;
  title: string;
  className?: string;
}

const buildAbsoluteUrl = (path: string) => {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
};

const ShareButton = ({ path, title, className }: ShareButtonProps) => {
  const [open, setOpen] = useState(false);

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleTriggerClick = async (e: React.MouseEvent) => {
    stop(e);
    const url = buildAbsoluteUrl(path);
    // Prefer native share on supported devices (mobile) — opens the OS sheet with WhatsApp, IG, etc.
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch {
        // user cancelled or failed → fall back to popover
      }
    }
    setOpen((v) => !v);
  };

  const url = buildAbsoluteUrl(path);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const options: { label: string; href?: string; icon: typeof Share2; onClick?: () => void }[] = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      label: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "X / Twitter",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
    },
    {
      label: "Copiar link",
      icon: LinkIcon,
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Link copiado");
        } catch {
          toast.error("Não foi possível copiar");
        }
        setOpen(false);
      },
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={handleTriggerClick}
          aria-label="Compartilhar imóvel"
          className={
            className ??
            "inline-flex items-center justify-center h-9 w-9 rounded-md border border-border/60 text-foreground hover:bg-muted transition-colors"
          }
        >
          <Share2 className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-52 p-1"
        onClick={stop}
      >
        <div className="flex flex-col">
          {options.map((opt) => {
            const Icon = opt.icon;
            const cls =
              "flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors text-left";
            if (opt.href) {
              return (
                <a
                  key={opt.label}
                  href={opt.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                  }}
                  className={cls}
                >
                  <Icon className="h-4 w-4" />
                  {opt.label}
                </a>
              );
            }
            return (
              <button
                key={opt.label}
                type="button"
                onClick={(e) => {
                  stop(e);
                  opt.onClick?.();
                }}
                className={cls}
              >
                <Icon className="h-4 w-4" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ShareButton;
