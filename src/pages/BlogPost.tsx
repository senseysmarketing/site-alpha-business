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
        .lte("published_at", new Date().toISOString())
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

  const renderedContent = renderMarkdownContent(post.content, {
    h2Class: "text-display text-2xl md:text-3xl font-light text-foreground mt-12 mb-6",
    paragraphClass: "text-body text-base leading-relaxed text-muted-foreground mb-6",
    wrapper: (node, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.5 }}
      >
        {node}
      </motion.div>
    ),
  });

  return (
    <>
      <Header />

      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-bordeaux z-[60] origin-left"
        style={{ scaleX }}
      />

      <main className="bg-[hsl(30_33%_97%)]">
        <section className="relative min-h-[52vh] md:min-h-[56vh] flex items-center overflow-hidden pt-28 md:pt-32">
          <div className="absolute inset-0">
            {post.cover_image ? (
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-bordeaux to-foreground" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/95 via-[#0A0A0A]/55 to-[#0A0A0A]/15" />
          </div>


          <div className="relative z-10 w-full max-w-3xl mx-auto px-6 md:px-12 py-12 md:py-16">
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

              <h1
                className="text-display font-light text-cashmere !leading-[1.15] mb-4"
                style={{ fontSize: "clamp(1.6rem, 2.2vw + 0.8rem, 3rem)", lineHeight: 1.15 }}
              >
                {post.title}
              </h1>

              {post.subtitle && (
                <p
                  className="text-body text-cashmere/60 mb-6"
                  style={{ fontSize: "clamp(0.95rem, 0.4vw + 0.85rem, 1.125rem)" }}
                >
                  {post.subtitle}
                </p>
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
          {renderedContent}
        </article>
      </main>
      <Footer />
    </>
  );
};

export default BlogPost;