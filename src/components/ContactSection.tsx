import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import privateImg from "@/assets/private-collection.jpg";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    type: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const assuntoMap: Record<string, string> = {
      visita: "Agendar Visita",
      imovel: "Enviar Imóvel para Avaliação",
    };

    const insights = [
      assuntoMap[formData.type] ? `Assunto: ${assuntoMap[formData.type]}` : "",
      formData.message ? `Mensagem: ${formData.message}` : "",
    ].filter(Boolean).join(" | ");

    const { error } = await supabase.from("leads").insert({
      name: formData.name,
      phone: formData.phone || null,
      email: formData.email || null,
      origin: "fale_conosco",
      pipeline_stage: "novos",
      score: "morno",
      ai_insights: insights || null,
    });

    setLoading(false);

    if (error) {
      toast({ title: "Erro ao enviar", description: "Tente novamente.", variant: "destructive" });
      return;
    }

    toast({ title: "Mensagem enviada!", description: "Entraremos em contato em breve." });
    setFormData({ name: "", phone: "", email: "", type: "", message: "" });
  };

  const inputClass =
    "w-full bg-transparent border border-cashmere/15 text-cashmere placeholder:text-cashmere/40 px-4 py-3 text-sm text-body focus:outline-none focus:border-cashmere/40 transition-colors";

  return (
    <section id="contato" className="bg-bordeaux">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[700px]">
        {/* Image */}
        <div className="relative h-[350px] lg:h-auto overflow-hidden">
          <img
            src={privateImg}
            alt="Fale conosco"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-bordeaux/30" />
        </div>

        {/* Form */}
        <div className="flex flex-col justify-center px-6 md:px-12 lg:px-20 py-16 lg:py-0">
          <motion.p
            className="text-body text-xs tracking-[0.4em] uppercase text-cashmere/50 mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Contato
          </motion.p>
          <motion.h2
            className="text-display text-3xl md:text-5xl font-light text-cashmere mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Fale <em className="italic">conosco</em>
          </motion.h2>
          <motion.p
            className="text-body text-sm text-cashmere/60 leading-relaxed mb-10 max-w-md"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Agende uma visita exclusiva ou envie seu imóvel para avaliação. Nossa equipe está pronta para atendê-lo.
          </motion.p>

          <motion.form
            onSubmit={handleSubmit}
            className="space-y-5 max-w-lg"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="WhatsApp"
                required
                className={inputClass}
              />
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="E-mail"
                required
                className={inputClass}
              />
            </div>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className={`${inputClass} appearance-none bg-bordeaux`}
            >
              <option value="" disabled className="text-cashmere bg-bordeaux">
                Selecione o assunto
              </option>
              <option value="visita" className="text-cashmere bg-bordeaux">
                Agendar Visita
              </option>
              <option value="imovel" className="text-cashmere bg-bordeaux">
                Enviar Imóvel para Avaliação
              </option>
            </select>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Sua mensagem"
              rows={4}
              className={`${inputClass} resize-none`}
            />
            <button
              type="submit"
              className="text-body text-xs tracking-[0.15em] uppercase px-8 py-3 border border-cashmere/30 text-cashmere hover:bg-cashmere/10 transition-colors duration-300"
            >
              Enviar mensagem
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;