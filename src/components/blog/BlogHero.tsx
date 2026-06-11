import { motion } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import { useBlogCategories } from "@/hooks/useBlogCategories";

interface BlogHeroProps {
  post: Tables<"blog_posts">;
}

const BlogHero = ({ post }: BlogHeroProps) => {
  const { labelOf } = useBlogCategories();
  return (
    <section className="relative min-h-[60vh] md:min-h-[68vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        {post.cover_image ? (
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-bordeaux to-foreground" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/95 via-[#0A0A0A]/55 to-[#0A0A0A]/15" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16 md:py-20">
        <motion.span
          className="inline-block text-body text-xs tracking-[0.3em] uppercase text-cashmere/70 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {labelOf(post.category)}
        </motion.span>

        <motion.h1
          className="text-display font-light text-cashmere max-w-4xl !leading-[1.15] mb-6"
          style={{ fontSize: "clamp(1.75rem, 2.6vw + 0.85rem, 3.75rem)", lineHeight: 1.15 }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          {post.title}
        </motion.h1>

        {post.subtitle && (
          <motion.p
            className="text-body text-cashmere/60 max-w-2xl mb-8"
            style={{ fontSize: "clamp(0.95rem, 0.5vw + 0.85rem, 1.25rem)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {post.subtitle}
          </motion.p>
        )}

        <motion.div
          className="flex items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 text-cashmere/50">
            <Clock size={14} />
            <span className="text-body text-xs">{post.reading_time_min} min de leitura</span>
          </div>
          <span className="text-cashmere/30">•</span>
          <span className="text-body text-xs text-cashmere/50">{post.author_name}</span>

          <Link
            to={`/blog/${post.slug}`}
            className="ml-auto inline-flex items-center gap-2 text-body text-xs tracking-[0.15em] uppercase text-cashmere hover:text-cashmere/80 transition-colors line-reveal pb-1"
          >
            Ler matéria
            <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default BlogHero;