import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle } from "lucide-react";
import contactImage from "@/assets/private-collection.jpg";

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
    "w-full bg-muted/60 border-0 text-foreground px-4 py-3 text-sm text-body rounded-md focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-colors";

  if (success) {
    return (
      <section id="contato" className="py-8 md:py-12 px-6">
        <div className="max-w-xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            <CheckCircle className="w-16 h-16 text-primary" strokeWidth={1} />
            <h3 className="text-display text-2xl md:text-3xl font-normal text-foreground">
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
    <section id="contato" className="py-8 md:py-12 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
        <motion.div
          className="relative aspect-[4/5] rounded-lg overflow-hidden bg-muted"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src={contactImage}
            alt="Anuncie seu imóvel com a Alpha Business"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </motion.div>

        <div>
          <motion.h2
            className="text-display text-2xl md:text-4xl font-normal text-foreground leading-tight mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Seu imóvel ainda não está na Alpha Business?
          </motion.h2>

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7 }}
          >
            <div>
              <label htmlFor="name" className="text-body text-sm font-medium text-foreground mb-2 block">
                Nome completo
              </label>
              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="email" className="text-body text-sm font-medium text-foreground mb-2 block">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="phone" className="text-body text-sm font-medium text-foreground mb-2 block">
                Telefone
              </label>
              <input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="address" className="text-body text-sm font-medium text-foreground mb-2 block">
                Endereço completo do imóvel
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-foreground text-background text-body text-sm px-8 py-3 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
