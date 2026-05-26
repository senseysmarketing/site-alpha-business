import { motion } from "framer-motion";
import { Instagram, Play } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface InstaPost {
  url: string;
  thumbnail: string;
}

interface ContactSettings {
  phone: string;
  email: string;
  instagram: string;
  instagram_secondary?: string;
  address: string;
}

const InstitutionalSection = () => {
  const { data: contactData } = useSiteSettings<ContactSettings>("contact");
  const { data: instaPostsData } = useSiteSettings<{ posts: InstaPost[] }>("instagram_posts");

  const handlePrimary = (contactData?.instagram?.replace("@", "") || "AlphavilleSP").trim();

  const handles = [
    { display: `@${handlePrimary}`, url: `https://instagram.com/${handlePrimary}` },
  ];

  const decodeHtmlEntities = (str: string) =>
    str?.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'") || "";
  const instaPosts = (instaPostsData?.posts || []).map((p) => ({
    ...p,
    thumbnail: decodeHtmlEntities(p.thumbnail),
  }));

  const displayPosts = instaPosts;
  const fallbackUrl = handles[0].url;

  return (
    <section id="about" className="section-padding">
      <div className="max-w-7xl mx-auto">
        {/* Header — uma linha */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
          <h2 className="text-display text-2xl md:text-3xl font-normal">
            Redes Sociais
          </h2>
          <div className="flex items-center gap-3 text-body text-sm text-foreground/80">
            <Instagram size={16} className="text-foreground/70" />
            <span>Siga-nos:</span>
            {handles.map((h, i) => (
              <a
                key={i}
                href={h.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                {h.display}
              </a>
            ))}
          </div>
        </div>

        {/* Carrossel */}
        {displayPosts.length > 0 ? (
          <Carousel opts={{ align: "start", dragFree: true, loop: false }} className="relative">
            <CarouselContent className="-ml-4">
              {displayPosts.map((post, i) => (
                <CarouselItem
                  key={i}
                  className="pl-4 basis-[80%] sm:basis-1/2 md:basis-1/3"
                >
                  <motion.a
                    href={post.url || fallbackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block overflow-hidden rounded-lg aspect-[4/5] bg-gradient-to-br from-muted to-card"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(i, 3) * 0.1, duration: 0.5 }}
                  >
                    {post.thumbnail && (
                      <img
                        src={post.thumbnail}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                      />
                    )}
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-md bg-white/85 flex items-center justify-center shadow-sm">
                      <Play className="w-3.5 h-3.5 text-foreground fill-foreground" />
                    </div>
                  </motion.a>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="aspect-[4/5] bg-gradient-to-br from-muted to-card rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default InstitutionalSection;
