import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BlogHero from "@/components/blog/BlogHero";
import BlogFilters from "@/components/blog/BlogFilters";
import BlogBentoGrid from "@/components/blog/BlogBentoGrid";
import MarketSidebar from "@/components/blog/MarketSidebar";

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const featuredPost = posts?.find((p) => p.is_featured) ?? posts?.[0];

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    let result = posts.filter((p) => p.id !== featuredPost?.id);
    if (activeCategory !== "all") {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q)
      );
    }
    return result;
  }, [posts, featuredPost, activeCategory, searchQuery]);

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

  return (
    <>
      <Header />
      <main className="bg-[hsl(30_33%_97%)]">
        {featuredPost && <BlogHero post={featuredPost} />}

        <BlogFilters
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-9">
              <BlogBentoGrid posts={filteredPosts} />
            </div>
            <div className="lg:col-span-3">
              <MarketSidebar />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Blog;