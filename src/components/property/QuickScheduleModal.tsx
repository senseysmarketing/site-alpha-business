import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { trackSchedule } from "@/lib/metaPixel";

const HOLIDAYS_2026 = [
  new Date(2026, 0, 1), new Date(2026, 1, 16), new Date(2026, 1, 17),
  new Date(2026, 3, 3), new Date(2026, 3, 21), new Date(2026, 4, 1),
  new Date(2026, 5, 4), new Date(2026, 8, 7), new Date(2026, 9, 12),
  new Date(2026, 10, 2), new Date(2026, 10, 15), new Date(2026, 11, 25),
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

function isHoliday(date: Date) {
  return HOLIDAYS_2026.some(
    (h) => h.getDate() === date.getDate() && h.getMonth() === date.getMonth() && h.getFullYear() === date.getFullYear()
  );
}

interface QuickScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  propertyCode: string;
  propertyId?: string;
  brokerName: string;
}

const QuickScheduleModal = ({
  open,
  onOpenChange,
  leadId,
  contactName,
  contactPhone,
  contactEmail,
  propertyCode,
  propertyId,
  brokerName,
}: QuickScheduleModalProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const brokerFirstName = brokerName.split(" ")[0];

  const resetAll = () => {
    setStep(1);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setIsSubmitting(false);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetAll();
    onOpenChange(val);
  };

  const submit = async (date: Date, time: string) => {
    setIsSubmitting(true);
    const visitDateStr = format(date, "yyyy-MM-dd");
    const summary = `Visita agendada para ${format(date, "dd/MM/yyyy")} às ${time}`;

    const { error } = await supabase.rpc("schedule_visit_for_lead", {
      p_lead_id: leadId,
      p_property_id: propertyId || null,
      p_property_code: propertyCode,
      p_broker_name: brokerName,
      p_visit_date: visitDateStr,
      p_visit_time: time,
      p_ai_insights: `${summary} — Imóvel ${propertyCode}`,
    });

    if (error) {
      setIsSubmitting(false);
      toast.error("Erro ao agendar visita. Tente novamente.");
      return;
    }

    trackSchedule({
      content_name: `Visita (form sidebar) — ${propertyCode}`,
      content_ids: propertyId ? [propertyId] : [propertyCode],
    });

    setIsSubmitting(false);
    setStep(3);
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
              {step < 3 ? "Escolha data e horário" : ""}
            </DialogTitle>
            {step < 3 && (
              <DialogDescription className="text-body text-sm text-muted-foreground">
                {step === 1 && "Seus dados já estão registrados — falta só o melhor momento."}
                {step === 2 && selectedDate && `Horários em ${format(selectedDate, "d 'de' MMMM", { locale: ptBR })}`}
              </DialogDescription>
            )}
          </DialogHeader>

          {step < 3 && (
            <div className="flex gap-1.5 mb-6">
              {[1, 2].map((s) => (
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
            {step === 1 && (
              <motion.div key="q1" {...stepVariants} transition={{ duration: 0.25 }}>
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

            {step === 2 && (
              <motion.div key="q2" {...stepVariants} transition={{ duration: 0.25 }}>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const past = selectedDate ? isSlotPast(selectedDate, slot) : false;
                    return (
                      <button
                        key={slot}
                        disabled={past || isSubmitting}
                        onClick={() => {
                          if (past || isSubmitting || !selectedDate) return;
                          setSelectedTime(slot);
                          submit(selectedDate, slot);
                        }}
                        className={`py-3 text-body text-sm rounded-full border transition-all duration-200 ${
                          past
                            ? "border-border/40 text-muted-foreground/40 cursor-not-allowed line-through"
                            : selectedTime === slot
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-foreground hover:bg-muted hover:border-muted-foreground/30"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>

                {isSubmitting && (
                  <div className="flex items-center justify-center gap-2 mt-6 text-body text-xs text-muted-foreground">
                    <Loader2 className="animate-spin" size={14} />
                    Confirmando…
                  </div>
                )}

                {!isSubmitting && (
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 mt-6 text-body text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Alterar data
                  </button>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="q3"
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
                  Visita Agendada
                </h3>
                <p className="text-body text-sm text-muted-foreground leading-relaxed max-w-[300px]">
                  {selectedDate && selectedTime && (
                    <>
                      {format(selectedDate, "d 'de' MMMM", { locale: ptBR })} às {selectedTime}. <br />
                      {brokerFirstName} confirmará em breve.
                    </>
                  )}
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

export default QuickScheduleModal;
