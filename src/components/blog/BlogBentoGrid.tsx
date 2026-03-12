import BlogCard from "./BlogCard";
import type { Tables } from "@/integrations/supabase/types";

interface BlogBentoGridProps {
  posts: Tables<"blog_posts">[];
}

const BlogBentoGrid = ({ posts }: BlogBentoGridProps) => {
  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-body text-muted-foreground">Nenhum artigo encontrado.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {posts.map((post, i) => {
        if (i === 0) {
          return (
            <div key={post.id} className="md:col-span-8">
              <BlogCard post={post} index={i} large />
            </div>
          );
        }
        if (i === 1) {
          return (
            <div key={post.id} className="md:col-span-4">
              <BlogCard post={post} index={i} />
            </div>
          );
        }
        if (i === 2 || i === 3) {
          return (
            <div key={post.id} className="md:col-span-6">
              <BlogCard post={post} index={i} />
            </div>
          );
        }
        return (
          <div key={post.id} className="md:col-span-4">
            <BlogCard post={post} index={i} />
          </div>
        );
      })}
    </div>
  );
};

export default BlogBentoGrid;