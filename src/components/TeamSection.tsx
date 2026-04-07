import { motion } from "framer-motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  avatar?: string;
}

const defaultTeam: TeamMember[] = [
  { name: "Rafael Oliveira", role: "CEO & Fundador" },
  { name: "Ana Paula", role: "Diretora Comercial" },
  { name: "Carlos Santos", role: "Corretor Sênior" },
  { name: "Mariana Costa", role: "Arquiteta" },
  { name: "Pedro Almeida", role: "Corretor" },
];

const TeamSection = () => {
  const { data: teamData } = useSiteSettings<{ members: TeamMember[] }>("team");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    slidesToScroll: 1,
  });

  const members = teamData?.members?.length ? teamData.members : defaultTeam;

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  return (
    <section className="section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <motion.p
              className="text-body text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Quem somos
            </motion.p>
            <motion.h2
              className="text-display text-3xl md:text-4xl font-light"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              Nossa <strong className="font-semibold">Equipe</strong>
            </motion.h2>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button onClick={scrollPrev} className="w-10 h-10 border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors rounded-md">
              <ChevronLeft size={18} />
            </button>
            <button onClick={scrollNext} className="w-10 h-10 border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors rounded-md">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-8">
            {members.map((member, i) => (
              <motion.div
                key={i}
                className="flex-[0_0_45%] md:flex-[0_0_20%] min-w-0 flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-4 bg-muted">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-card flex items-center justify-center text-display text-2xl font-light text-muted-foreground">
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="text-display text-sm font-medium text-foreground mb-1">
                  {member.name}
                </h3>
                <p className="text-body text-xs text-muted-foreground">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Dots mobile */}
        <div className="flex justify-center gap-2 mt-6 md:hidden">
          {members.map((_, i) => (
            <button
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${i === selectedIndex ? "bg-primary w-6" : "bg-muted-foreground/30"}`}
              onClick={() => emblaApi?.scrollTo(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
