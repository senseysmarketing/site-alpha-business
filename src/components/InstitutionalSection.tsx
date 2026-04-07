import { motion } from "framer-motion";
import { Instagram, ArrowUpRight } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface InstaPost {
  url: string;
  thumbnail: string;
}

interface ContactSettings {
  phone: string;
  email: string;
  instagram: string;
  address: string;
}

const InstitutionalSection = () => {
  const { data: contactData } = useSiteSettings<ContactSettings>("contact");
  const { data: instaPostsData } = useSiteSettings<{ posts: InstaPost[] }>("instagram_posts");
  const instagramHandle = contactData?.instagram?.replace("@", "") || "alphabusiness";
  const instagramDisplay = `@${instagramHandle}`;
  const instagramUrl = `https://instagram.com/${instagramHandle}`;
  const decodeHtmlEntities = (str: string) =>
    str?.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'") || "";
  const instaPosts = (instaPostsData?.posts || []).map((p) => ({
    ...p,
    thumbnail: decodeHtmlEntities(p.thumbnail),
  }));

  const displayPosts = instaPosts.slice(0, 3);

  return (
    <section id="about" className="section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <motion.p
              className="text-body text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Redes Sociais
            </motion.p>
            <motion.h2
              className="text-display text-3xl md:text-4xl font-light"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              Siga-nos no <em className="italic">Instagram</em>
            </motion.h2>
          </div>
          <motion.a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 text-body text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Instagram size={16} />
            {instagramDisplay}
          </motion.a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayPosts.length > 0
            ? displayPosts.map((post, i) => (
                <motion.a
                  key={i}
                  href={post.url || instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block overflow-hidden rounded-lg aspect-[4/5]"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  {post.thumbnail ? (
                    <img
                      src={post.thumbnail}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-card" />
                  )}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300" />

                </motion.a>
              ))
            : [0, 1, 2].map((i) => (
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

        <motion.div
          className="flex justify-center mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-body text-xs tracking-[0.15em] uppercase text-foreground line-reveal pb-1"
          >
            Seguir no Instagram
            <ArrowUpRight size={14} />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default InstitutionalSection;
