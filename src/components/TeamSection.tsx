import { motion } from "framer-motion";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useState } from "react";

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
  const [snaps, setSnaps] = useState<number[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    slidesToScroll: 1,
  });

  const members = teamData?.members?.length ? teamData.members : defaultTeam;

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    const onInit = () => setSnaps(emblaApi.scrollSnapList());
    onInit();
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onInit);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onInit);
    };
  }, [emblaApi]);

  return (
    <section className="section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <motion.h2
            className="text-display text-2xl md:text-3xl font-normal text-foreground"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Nossa Equipe
          </motion.h2>
          <a
            href="#contato"
            className="text-body text-sm text-foreground/70 hover:text-primary transition-colors"
          >
            Ver todos
          </a>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-8">
            {members.map((member, i) => (
              <motion.div
                key={i}
                className="flex-[0_0_50%] md:flex-[0_0_25%] min-w-0 flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden mb-4 bg-muted">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-card flex items-center justify-center text-display text-3xl font-light text-muted-foreground">
                      {member.name.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="text-display text-base font-normal text-foreground mb-1">
                  {member.name}
                </h3>
                <p className="text-body text-sm text-muted-foreground">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {snaps.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {snaps.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Ir para slide ${i + 1}`}
                className={
                  i === selectedIndex
                    ? "w-7 h-7 rounded-md bg-primary flex items-center justify-center"
                    : "w-2 h-2 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors"
                }
              >
                {i === selectedIndex && (
                  <span className="w-2 h-2 bg-background rounded-sm" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TeamSection;
