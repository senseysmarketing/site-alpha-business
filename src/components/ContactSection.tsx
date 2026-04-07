import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle } from "lucide-react";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, phone: formatPhone(e.target.value) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const insights = formData.address ? `Endereço do imóvel: ${formData.address}` : null;

    const { error } = await supabase.from("leads").insert({
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone.replace(/\D/g, "") || null,
      origin: "anuncio_proprio",
      pipeline_stage: "novos",
      score: "morno",
      ai_insights: insights,
    });

    setLoading(false);

    if (error) {
      toast({ title: "Erro ao enviar", description: "Tente novamente.", variant: "destructive" });
      return;
    }

    setSuccess(true);
  };

  const inputClass =
    "w-full bg-background border border-border text-foreground placeholder:text-muted-foreground px-4 py-3 text-sm text-body rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-colors";

  if (success) {
    return (
      <section id="contato" className="bg-muted/30 py-20 md:py-32">
        <div className="max-w-xl mx-auto text-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            <CheckCircle className="w-16 h-16 text-primary" strokeWidth={1} />
            <h3 className="text-display text-2xl md:text-3xl font-light text-foreground">
              Recebemos seu contato
            </h3>
            <p className="text-body text-sm text-muted-foreground leading-relaxed max-w-md">
              Nossa curadoria técnica analisará as informações e retornaremos em breve via WhatsApp.
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="contato" className="bg-muted/30 py-20 md:py-32">
      <div className="max-w-2xl mx-auto px-6">
        <motion.p
          className="text-body text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Anuncie
        </motion.p>
        <motion.h2
          className="text-display text-3xl md:text-5xl font-light text-foreground mb-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Seu imóvel ainda não está na{" "}
          <em className="italic">Alpha Business</em>?
        </motion.h2>
        <motion.p
          className="text-body text-sm text-muted-foreground leading-relaxed mb-10 max-w-lg mx-auto text-center"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Envie suas informações e nossa equipe entrará em contato para uma avaliação exclusiva.
        </motion.p>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nome completo"
            required
            className={inputClass}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="E-mail"
              required
              className={inputClass}
            />
            <input
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="Telefone"
              required
              className={inputClass}
            />
          </div>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Endereço completo do imóvel"
            rows={3}
            className={`${inputClass} resize-none`}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground text-body text-xs tracking-[0.15em] uppercase py-3 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar"}
          </button>
        </motion.form>
      </div>
    </section>
  );
};

export default ContactSection;
