import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Check, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { trackSchedule } from "@/lib/metaPixel";

// Brazilian holidays 2026
const HOLIDAYS_2026 = [
  new Date(2026, 0, 1),   // Ano Novo
  new Date(2026, 1, 16),  // Carnaval
  new Date(2026, 1, 17),  // Carnaval
  new Date(2026, 3, 3),   // Sexta-feira Santa
  new Date(2026, 3, 21),  // Tiradentes
  new Date(2026, 4, 1),   // Dia do Trabalho
  new Date(2026, 5, 4),   // Corpus Christi
  new Date(2026, 8, 7),   // Independência
  new Date(2026, 9, 12),  // N. Sra. Aparecida
  new Date(2026, 10, 2),  // Finados
  new Date(2026, 10, 15), // Proclamação da República
  new Date(2026, 11, 25), // Natal
];

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00",
];

function isSlotPast(date: Date, slot: string) {
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (!isToday) return false;
  const [h] = slot.split(":").map(Number);
  return h <= now.getHours();
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  phone: z.string().trim().min(14, "Telefone inválido").max(15),
  email: z.string().trim().email("E-mail inválido").max(255),
});

type ContactForm = z.infer<typeof contactSchema>;

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isHoliday(date: Date) {
  return HOLIDAYS_2026.some(
    (h) => h.getDate() === date.getDate() && h.getMonth() === date.getMonth() && h.getFullYear() === date.getFullYear()
  );
}

interface ScheduleVisitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyCode: string;
  brokerName: string;
  propertyId?: string;
}

const ScheduleVisitModal = ({
  open,
  onOpenChange,
  propertyCode,
  brokerName,
  propertyId,
}: ScheduleVisitModalProps) => {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", phone: "", email: "" },
  });

  const brokerFirstName = brokerName.split(" ")[0];

  const resetAll = () => {
    setStep(1);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setIsSubmitting(false);
    form.reset();
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetAll();
    onOpenChange(val);
  };

  const handleSubmit = async (data: ContactForm) => {
    if (!selectedDate || !selectedTime) return;
    setIsSubmitting(true);

    const phoneDigits = data.phone.replace(/\D/g, "");
    const visitDateStr = format(selectedDate, "yyyy-MM-dd");

    // 1) Create lead first so we can link the visit to it
    const { data: leadRow, error: leadErr } = await supabase
      .from("leads")
      .insert({
        name: data.name,
        phone: phoneDigits,
        email: data.email,
        origin: "agendamento_visita",
        pipeline_stage: "visita_agendada",
        score: "quente",
        property_id: propertyId || null,
        ai_insights: `Visita agendada para ${format(selectedDate, "dd/MM/yyyy")} às ${selectedTime} — Imóvel ${propertyCode}`,
      })
      .select("id")
      .single();

    if (leadErr) {
      setIsSubmitting(false);
      toast.error("Erro ao registrar o lead. Tente novamente.");
      return;
    }

    // 2) Insert visit linked to the newly created lead
    const { error } = await supabase.from("visits_scheduling").insert({
      property_code: propertyCode,
      property_id: propertyId || null,
      broker_name: brokerName,
      visit_date: visitDateStr,
      visit_time: selectedTime,
      event_type: "visita",
      lead_id: leadRow?.id ?? null,
      lead_name: data.name,
      lead_phone: phoneDigits,
      lead_email: data.email,
    });

    if (error) {
      setIsSubmitting(false);
      toast.error("Erro ao agendar visita. Tente novamente.");
      return;
    }

    trackSchedule({
      content_name: `Visita — ${propertyCode}`,
      content_ids: propertyId ? [propertyId] : [propertyCode],
    });

    setIsSubmitting(false);
    setStep(4);
  };

  const stepVariants = {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px] bg-background/95 backdrop-blur-md border-border p-0 overflow-hidden">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-display text-xl font-light tracking-wide text-foreground">
              {step < 4 ? "Agendar Visita" : ""}
            </DialogTitle>
            {step < 4 && (
              <DialogDescription className="text-body text-sm text-muted-foreground">
                {step === 1 && "Selecione a data desejada"}
                {step === 2 && `Horários disponíveis em ${format(selectedDate!, "d 'de' MMMM", { locale: ptBR })}`}
                {step === 3 && "Preencha seus dados de contato"}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Step indicator */}
          {step < 4 && (
            <div className="flex gap-1.5 mb-6">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                    s <= step ? "bg-primary" : "bg-border"
                  }`}
                />
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1: Calendar */}
            {step === 1 && (
              <motion.div key="step1" {...stepVariants} transition={{ duration: 0.25 }}>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      if (date) setStep(2);
                    }}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                      date.getDay() === 0 ||
                      isHoliday(date)
                    }
                    locale={ptBR}
                    className="p-3 pointer-events-auto"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Time Slots */}
            {step === 2 && (
              <motion.div key="step2" {...stepVariants} transition={{ duration: 0.25 }}>
                <div className="grid grid-cols-5 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => {
                        setSelectedTime(slot);
                        setStep(3);
                      }}
                      className={`py-3 text-body text-sm rounded-full border transition-all duration-200 ${
                        selectedTime === slot
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-foreground hover:bg-muted hover:border-muted-foreground/30"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 mt-6 text-body text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft size={14} />
                  Alterar data
                </button>
              </motion.div>
            )}

            {/* Step 3: Contact Form */}
            {step === 3 && (
              <motion.div key="step3" {...stepVariants} transition={{ duration: 0.25 }}>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-body text-xs uppercase tracking-wider text-muted-foreground">Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome completo" {...field} className="bg-card border-border" />
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
                          <FormLabel className="text-body text-xs uppercase tracking-wider text-muted-foreground">Telefone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(11) 99999-9999"
                              value={field.value}
                              onChange={(e) => field.onChange(formatPhone(e.target.value))}
                              className="bg-card border-border"
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
                          <FormLabel className="text-body text-xs uppercase tracking-wider text-muted-foreground">E-mail</FormLabel>
                          <FormControl>
                            <Input placeholder="seu@email.com" type="email" {...field} className="bg-card border-border" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-2 space-y-2">
                      <p className="text-body text-xs text-muted-foreground">
                        {format(selectedDate!, "d 'de' MMMM", { locale: ptBR })} às {selectedTime}
                      </p>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold tracking-wide uppercase rounded-full"
                      >
                        {isSubmitting ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          "Confirmar Agendamento"
                        )}
                      </Button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex items-center gap-1.5 text-body text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft size={14} />
                      Alterar horário
                    </button>
                  </form>
                </Form>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.15 }}
                  className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-6"
                >
                  <Check className="text-primary-foreground" size={28} />
                </motion.div>

                <h3 className="text-display text-lg font-light tracking-wide text-foreground mb-3">
                  Agendamento Solicitado
                </h3>
                <p className="text-body text-sm text-muted-foreground leading-relaxed max-w-[300px]">
                  {brokerFirstName} entrará em contato em breve para confirmar sua visita.
                </p>

                <Button
                  variant="outline"
                  className="mt-8 text-body text-xs tracking-wider uppercase rounded-full"
                  onClick={() => handleOpenChange(false)}
                >
                  Fechar
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleVisitModal;
