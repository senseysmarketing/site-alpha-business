import { motion } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

const categoryLabels: Record<string, string> = {
  "inside-alphaville": "Inside Alphaville",
  "arquitetura-design": "Arquitetura & Design",
  "investimento": "Investimento",
  "guia-condominios": "Guia de Condomínios",
};

interface BlogHeroProps {
  post: Tables<"blog_posts">;
}

const BlogHero = ({ post }: BlogHeroProps) => {
  return (
    <section className="relative h-[85vh] flex items-end overflow-hidden">
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gradient-to-br from-bordeaux to-foreground" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2A070C]/90 via-[#2A070C]/40 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-24 pb-16 md:pb-24">
        <motion.span
          className="inline-block text-body text-xs tracking-[0.3em] uppercase text-cashmere/70 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {categoryLabels[post.category] ?? post.category}
        </motion.span>

        <motion.h1
          className="text-display text-4xl md:text-6xl lg:text-7xl font-light text-cashmere max-w-4xl leading-[1.1] mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          {post.title}
        </motion.h1>

        {post.subtitle && (
          <motion.p
            className="text-body text-lg md:text-xl text-cashmere/60 max-w-2xl mb-8"
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