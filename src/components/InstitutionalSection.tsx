import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Instagram, ArrowUpRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { InstagramEmbed } from "react-social-media-embed";
import { Skeleton } from "@/components/ui/skeleton";

function InstagramEmbedWithSkeleton({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 4000);
    return () => clearTimeout(timer);
  }, [url]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {!loaded && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
      )}
      <div className="w-full h-full">
        <InstagramEmbed url={url} width="100%" captioned />
      </div>
    </div>
  );
}

const categoryLabels: Record<string, string> = {
  "inside-alphaville": "Inside Alphaville",
  "arquitetura-design": "Arquitetura & Design",
  "investimento": "Investimento",
  "guia-condominios": "Guia de Condomínios",
};

interface ContactSettings {
  phone: string;
  email: string;
  instagram: string;
  address: string;
}

const InstitutionalSection = () => {
  const { data: contactData } = useSiteSettings<ContactSettings>("contact");
  const { data: instaPostsData } = useSiteSettings<{ urls: string[] }>("instagram_posts");
  const instagramHandle = contactData?.instagram?.replace("@", "") || "alphabusiness";
  const instagramDisplay = `@${instagramHandle}`;
  const instagramUrl = `https://instagram.com/${instagramHandle}`;
  const instaUrls = instaPostsData?.urls || [];

  const { data: posts } = useQuery({
    queryKey: ["blog-posts-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <section id="about" className="section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 md:gap-12">
          {/* Left — Blog Editorial (2/3) */}
          <div className="lg:col-span-2 flex flex-col">
            <motion.p
              className="text-body text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Alpha em Movimento
            </motion.p>
            <motion.h2
              className="text-display text-3xl md:text-4xl font-light mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Inspiração para
              <br />
              <em className="italic">viver bem</em>
            </motion.h2>

            <motion.p
              className="text-body text-sm text-muted-foreground leading-relaxed mb-8 max-w-md"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Acompanhe as últimas tendências em arquitetura, design de interiores
              e o mercado imobiliário de altíssimo padrão em Alphaville.
            </motion.p>

            {/* Blog post cards */}
            <div className="space-y-4 mb-8">
              {posts?.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group flex gap-5 border border-border hover:border-muted-foreground/30 transition-colors duration-300 p-4"
                  >
                    <div className="flex-shrink-0 w-24 h-24 overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-cashmere to-greige group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                          {categoryLabels[post.category] ?? post.category}
                        </span>
                        <span className="text-muted-foreground/30">•</span>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock size={10} />
                          <span className="text-body text-[10px]">{post.reading_time_min} min</span>
                        </div>
                      </div>
                      <h4 className="text-display text-base font-light text-foreground group-hover:text-bordeaux transition-colors line-clamp-2">
                        {post.title}
                      </h4>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="mt-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-body text-xs tracking-[0.15em] uppercase text-foreground line-reveal pb-1"
              >
                Ver todas as matérias
                <ArrowUpRight size={14} />
              </Link>
            </motion.div>
          </div>

          {/* Right — Instagram (1/3) */}
          <div className="flex flex-col">
            <motion.div
              className="flex items-center gap-3 mb-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <Instagram size={18} className="text-muted-foreground" />
              <span className="text-body text-xs text-muted-foreground">{instagramDisplay}</span>
            </motion.div>

            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const url = instaUrls[i];
                const hasUrl = url && url.trim().length > 0;

                return (
                  <motion.div
                    key={i}
                    className="aspect-square overflow-hidden group cursor-pointer relative"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.5 }}
                  >
                    {hasUrl ? (
                      <InstagramEmbedWithSkeleton url={url} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-cashmere to-greige group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </motion.div>
                );
              })}
            </div>

            <motion.a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-auto pt-4 text-body text-xs tracking-[0.15em] uppercase text-foreground line-reveal pb-1"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Seguir no Instagram
              <ArrowUpRight size={14} />
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstitutionalSection;