import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, useScroll, useSpring } from "framer-motion";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { renderMarkdownContent } from "@/lib/markdown";

const categoryLabels: Record<string, string> = {
  "inside-alphaville": "Inside Alphaville",
  "arquitetura-design": "Arquitetura & Design",
  "investimento": "Investimento",
  "guia-condominios": "Guia de Condomínios",
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-body text-sm text-muted-foreground animate-pulse">Carregando...</div>
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-body text-muted-foreground">Artigo não encontrado.</p>
          <Link to="/blog" className="text-body text-sm text-foreground underline">
            Voltar ao Blog
          </Link>
        </div>
      </>
    );
  }

  const formattedDate = new Date(post.published_at).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const contentBlocks = post.content.split("\n\n").filter(Boolean);

  return (
    <>
      <Header />

      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-bordeaux z-[60] origin-left"
        style={{ scaleX }}
      />

      <main className="bg-[hsl(30_33%_97%)]">
        <section className="relative h-[60vh] flex items-end overflow-hidden">
          <div className="absolute inset-0">
            <div className="w-full h-full bg-gradient-to-br from-bordeaux to-foreground" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2A070C]/90 via-[#2A070C]/40 to-transparent" />
          </div>

          <div className="relative z-10 w-full max-w-3xl mx-auto px-6 md:px-12 pb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-body text-xs tracking-[0.15em] uppercase text-cashmere/60 hover:text-cashmere transition-colors mb-6"
              >
                <ArrowLeft size={14} />
                Voltar ao Blog
              </Link>

              <span className="block text-body text-xs tracking-[0.3em] uppercase text-cashmere/50 mb-4">
                {categoryLabels[post.category] ?? post.category}
              </span>

              <h1 className="text-display text-3xl md:text-5xl font-light text-cashmere leading-[1.1] mb-4">
                {post.title}
              </h1>

              {post.subtitle && (
                <p className="text-body text-lg text-cashmere/60 mb-6">{post.subtitle}</p>
              )}

              <div className="flex items-center gap-4 text-cashmere/40">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  <span className="text-body text-xs">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} />
                  <span className="text-body text-xs">{post.reading_time_min} min de leitura</span>
                </div>
                <span className="text-body text-xs">{post.author_name}</span>
              </div>
            </motion.div>
          </div>
        </section>

        <article className="max-w-3xl mx-auto px-6 md:px-12 py-16 md:py-24">
          {contentBlocks.map((block, i) => {
            const isHeading = block.startsWith("## ");
            if (isHeading) {
              return (
                <motion.h2
                  key={i}
                  className="text-display text-2xl md:text-3xl font-light text-foreground mt-12 mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6 }}
                >
                  {block.replace("## ", "")}
                </motion.h2>
              );
            }
            return (
              <motion.p
                key={i}
                className="text-body text-base leading-relaxed text-muted-foreground mb-6"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5 }}
              >
                {block}
              </motion.p>
            );
          })}
        </article>
      </main>
      <Footer />
    </>
  );
};

export default BlogPost;