import { useEffect, useState } from "react";
import { MessageCircle, Calendar, Zap, Check, Loader2, Send } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import ScheduleVisitModal from "./ScheduleVisitModal";
import QuickScheduleModal from "./QuickScheduleModal";
import rafaelPhoto from "@/assets/rafa-avatar.png";
import { trackContact } from "@/lib/metaPixel";
import { supabase } from "@/integrations/supabase/client";
import { formatBRPhone, onlyDigits } from "@/lib/phone";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";

interface PropertySidebarProps {
  brokerName: string;
  brokerTitle: string;
  whatsappNumber?: string;
  propertyCode: string;
  propertyId?: string;
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  phone: z.string().trim().min(14, "Telefone inválido").max(15),
  email: z.string().trim().email("E-mail inválido").max(255),
});

type ContactForm = z.infer<typeof contactSchema>;

const PropertySidebar = ({
  brokerName,
  brokerTitle,
  whatsappNumber = "5511993116849",
  propertyCode,
  propertyId,
}: PropertySidebarProps) => {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [quickScheduleOpen, setQuickScheduleOpen] = useState(false);
  const [sessionLeadId, setSessionLeadId] = useState<string | null>(null);
  const [contactData, setContactData] = useState<{ name: string; phone: string; email: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const brokerFirstName = brokerName.split(" ")[0];

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", phone: "", email: "" },
    mode: "onChange",
  });

  // Escopo estrito: novo imóvel = zera sessionLead e volta o form.
  useEffect(() => {
    setSessionLeadId(null);
    setContactData(null);
    setQuickScheduleOpen(false);
    form.reset({ name: "", phone: "", email: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const onSubmit = async (data: ContactForm) => {
    setIsSubmitting(true);
    const phoneDigits = onlyDigits(data.phone);

    const { data: newLeadId, error } = await supabase.rpc("create_public_lead", {
      p_name: data.name,
      p_phone: phoneDigits,
      p_email: data.email,
      p_origin: "fale_conosco",
      p_pipeline_stage: "novos",
      p_score: "morno",
      p_property_id: propertyId || null,
      p_ai_insights: `Contato via card do corretor — Imóvel ${propertyCode}`,
    });

    if (error || !newLeadId) {
      setIsSubmitting(false);
      toast.error("Erro ao enviar. Tente novamente.");
      return;
    }

    trackContact({ content_name: `Sidebar Form — ${propertyCode}` });

    setSessionLeadId(newLeadId as string);
    setContactData({ name: data.name, phone: phoneDigits, email: data.email });
    setIsSubmitting(false);
  };

  return (
    <div className="sticky top-24 space-y-6">
      <div className="border border-border rounded-sm p-6 bg-card space-y-6">
        {/* Bloco A — Corretor */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-muted overflow-hidden flex items-center justify-center">
            <img
              src={rafaelPhoto}
              alt={brokerName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div>
            <p className="text-body text-sm font-medium text-foreground">{brokerName}</p>
            <p className="text-body text-xs text-muted-foreground">{brokerTitle}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#25D366]" />
              </span>
              <Zap size={12} strokeWidth={1.5} className="text-[#25D366]" />
              <span className="text-body text-[11px] tracking-wide text-muted-foreground">
                Responde em até 15 minutos
              </span>
            </div>
          </div>
        </div>

        {/* Bloco B/C — Formulário ou Sucesso */}
        {sessionLeadId === null ? (
          <div className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-body text-[11px] uppercase tracking-wider text-muted-foreground">
                        Nome
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Seu nome completo"
                          {...field}
                          className="bg-background border-border h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-body text-[11px] uppercase tracking-wider text-muted-foreground">
                        Telefone
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(11) 99999-9999"
                          value={field.value}
                          onChange={(e) => field.onChange(formatBRPhone(e.target.value))}
                          className="bg-background border-border h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-body text-[11px] uppercase tracking-wider text-muted-foreground">
                        E-mail
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="seu@email.com"
                          type="email"
                          {...field}
                          className="bg-background border-border h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={!form.formState.isValid || isSubmitting}
                  className="w-full bg-primary !text-[#F8F8F8] hover:bg-primary/90 disabled:bg-muted-foreground/40 disabled:!text-[#F8F8F8] disabled:opacity-100 text-body text-sm font-medium rounded-full h-11"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} />
                      Enviando…
                    </>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Enviar mensagem
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Separador */}
            <div className="h-px bg-border/60 my-4" />

            {/* Bloco D — Agendar visita */}
            <button
              onClick={() => setScheduleOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-3 border border-border text-body text-sm font-medium text-foreground rounded-full hover:bg-muted transition-colors"
            >
              <Calendar size={18} />
              Agendar visita
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Check className="text-primary" size={22} />
            </div>
            <div className="space-y-1.5">
              <p className="text-body text-sm font-medium text-foreground">Contato enviado!</p>
              <p className="text-body text-xs text-muted-foreground leading-relaxed">
                {brokerFirstName} entrará em contato em breve. Quer adiantar? Escolha uma data e horário para sua visita.
              </p>
            </div>
            <Button
              onClick={() => setQuickScheduleOpen(true)}
              className="w-full bg-primary !text-[#F8F8F8] hover:bg-primary/90 hover:!text-[#F8F8F8] text-body text-sm font-medium rounded-full h-11 [&_svg]:!text-[#F8F8F8]"
            >
              <Calendar size={16} className="mr-2" />
              Agendar visita agora
            </Button>
          </div>
        )}

      </div>

      <p className="text-body text-[11px] text-muted-foreground text-center uppercase tracking-widest">
        Atendimento exclusivo e personalizado
      </p>
      <p className="text-body text-[10px] text-muted-foreground/60 text-center tracking-wider">
        CRECI 123.456-F
      </p>

      <ScheduleVisitModal
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        propertyCode={propertyCode}
        brokerName={brokerName}
        propertyId={propertyId}
      />

      {sessionLeadId && contactData && (
        <QuickScheduleModal
          open={quickScheduleOpen}
          onOpenChange={setQuickScheduleOpen}
          leadId={sessionLeadId}
          contactName={contactData.name}
          contactPhone={contactData.phone}
          contactEmail={contactData.email}
          propertyCode={propertyCode}
          propertyId={propertyId}
          brokerName={brokerName}
        />
      )}
    </div>
  );
};

export default PropertySidebar;
