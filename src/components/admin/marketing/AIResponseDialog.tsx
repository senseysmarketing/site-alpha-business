import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  leadPhone?: string | null;
  propertyName?: string | null;
  lastActivity?: string | null;
}

function generateMessage(name: string, property?: string | null, activity?: string | null) {
  const greeting = `Olá ${name}, tudo bem?`;
  const interest = property
    ? ` Vi que você se interessou pela residência no ${property}.`
    : " Vi que você demonstrou interesse em um de nossos imóveis exclusivos.";
  const follow = activity
    ? ` Notei que recentemente você ${activity.toLowerCase()}.`
    : "";
  const cta =
    " Gostaria de agendar uma visita personalizada ou tirar alguma dúvida? Estou à disposição! 🏡";
  return `${greeting}${interest}${follow}${cta}`;
}

export function AIResponseDialog({
  open,
  onOpenChange,
  leadName,
  leadPhone,
  propertyName,
  lastActivity,
}: AIResponseDialogProps) {
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setMessage(generateMessage(leadName, propertyName, lastActivity));
    }
    onOpenChange(isOpen);
  };

  const copyAndOpen = () => {
    navigator.clipboard.writeText(message);
    toast({ title: "Mensagem copiada!" });
    if (leadPhone) {
      const phone = leadPhone.replace(/\D/g, "");
      window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, "_blank");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-[Raleway]">Resposta IA para {leadName}</DialogTitle>
          <DialogDescription className="font-[Inter] text-xs">
            Mensagem sugerida para WhatsApp. Edite à vontade antes de enviar.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className="font-[Inter] text-sm"
        />
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={copyAndOpen} className="gap-2">
            {leadPhone ? (
              <>
                <ExternalLink className="h-4 w-4" /> Enviar via WhatsApp
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copiar Mensagem
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
