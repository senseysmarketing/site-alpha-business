import { motion } from "framer-motion";
import { Clock, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { useBlogCategories } from "@/hooks/useBlogCategories";
import CoverImage from "./CoverImage";

interface BlogCardProps {
  post: Tables<"blog_posts">;
  index: number;
  large?: boolean;
}

const BlogCard = ({ post, index, large = false }: BlogCardProps) => {
  const [hovered, setHovered] = useState(false);
  const { labelOf } = useBlogCategories();

  const formattedDate = new Date(post.published_at).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.08, duration: 0.6 }}
    >
      <Link
        to={`/blog/${post.slug}`}
        className="group block border border-border hover:border-muted-foreground/30 transition-colors duration-500"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className={`relative overflow-hidden ${large ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
          <CoverImage
            desktop={post.cover_image}
            mobile={post.cover_image_mobile}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            fallbackClassName="w-full h-full bg-gradient-to-br from-cashmere to-greige transition-transform duration-700 group-hover:scale-105"
          />
          
          {post.is_exclusive && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-bordeaux/90 text-cashmere px-3 py-1.5 backdrop-blur-sm">
              <Lock size={10} />
              <span className="text-body text-[10px] tracking-[0.2em] uppercase">Exclusivo</span>
            </div>
          )}

          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-foreground/10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-body text-xs tracking-[0.2em] uppercase text-cashmere bg-foreground/60 px-4 py-2 backdrop-blur-sm">
              Ler Mais
            </span>
          </motion.div>
        </div>

        <div className="p-5 md:p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
              {labelOf(post.category)}
            </span>
            <span className="text-muted-foreground/30">•</span>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock size={11} />
              <span className="text-body text-[10px]">{post.reading_time_min} min</span>
            </div>
          </div>

          <h3 className={`text-display font-light text-foreground mb-2 leading-tight ${large ? "text-2xl md:text-3xl" : "text-lg md:text-xl"}`}>
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="text-body text-sm text-muted-foreground line-clamp-2 mb-4">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-body text-[11px] text-muted-foreground">{formattedDate}</span>
            <span className="text-body text-[11px] text-muted-foreground">{post.author_name}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default BlogCard;