import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdvertisePropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatPhoneMask(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCurrency(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseCurrencyToFloat(value: string): number | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  return parseInt(digits, 10) / 100;
}

const AdvertisePropertyModal = ({ open, onOpenChange }: AdvertisePropertyModalProps) => {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [location, setLocation] = useState("");
  const [valueRaw, setValueRaw] = useState("");
  const [highlights, setHighlights] = useState("");

  const resetForm = () => {
    setName(""); setEmail(""); setPhone("");
    setPropertyType(""); setLocation(""); setValueRaw(""); setHighlights("");
    setSuccess(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Preencha seu nome."); return; }

    setLoading(true);
    const dealValue = parseCurrencyToFloat(valueRaw);
    const insights = [
      propertyType && `Tipo: ${propertyType}`,
      location && `Localização: ${location}`,
      dealValue && `Expectativa: R$ ${dealValue.toLocaleString("pt-BR")}`,
      highlights && `Destaques: ${highlights}`,
    ].filter(Boolean).join(" | ");

    const { error } = await supabase.from("leads").insert({
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.replace(/\D/g, "") || null,
      origin: "anuncio_proprio",
      pipeline_stage: "novos",
      deal_value: dealValue,
      ai_insights: insights || null,
    });

    setLoading(false);
    if (error) { toast.error("Erro ao enviar. Tente novamente."); return; }
    setSuccess(true);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-background">
        {success ? (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <CheckCircle2 className="w-16 h-16 text-[#2A070C]" />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Recebemos seu contato. Nossa curadoria técnica analisará as informações e retornaremos em breve via WhatsApp.
            </p>
            <Button variant="outline" onClick={() => handleClose(false)} className="mt-2">
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Anuncie seu imóvel</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Bloco A */}
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Seus Dados</p>
                <div>
                  <Label htmlFor="adv-name">Nome Completo *</Label>
                  <Input id="adv-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required />
                </div>
                <div>
                  <Label htmlFor="adv-email">E-mail</Label>
                  <Input id="adv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
                </div>
                <div>
                  <Label htmlFor="adv-phone">WhatsApp</Label>
                  <Input id="adv-phone" value={phone} onChange={(e) => setPhone(formatPhoneMask(e.target.value))} placeholder="(11) 99999-9999" />
                </div>
              </div>

              {/* Bloco B */}
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Sobre o Imóvel</p>
                <div>
                  <Label>Tipo</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Casa">Casa</SelectItem>
                      <SelectItem value="Apartamento">Apartamento</SelectItem>
                      <SelectItem value="Terreno">Terreno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="adv-location">Localização</Label>
                  <Input id="adv-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Alphaville Residencial 2, Tamboré..." />
                </div>
                <div>
                  <Label htmlFor="adv-value">Expectativa de Valor</Label>
                  <Input id="adv-value" value={valueRaw} onChange={(e) => setValueRaw(formatCurrency(e.target.value))} placeholder="R$ 0,00" />
                </div>
                <div>
                  <Label htmlFor="adv-highlights">Destaques</Label>
                  <Textarea id="adv-highlights" value={highlights} onChange={(e) => setHighlights(e.target.value)} placeholder="Casa com 4 suítes e vista para a reserva..." rows={3} />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdvertisePropertyModal;
