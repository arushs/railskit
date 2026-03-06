/**
 * Blog post registry — re-exports from the blog engine.
 * This file exists for backward compatibility. The canonical source
 * is now `@/lib/blog` which parses front matter from .md files.
 */
export type { BlogPost, BlogCategory } from "@/lib/blog";
export { getAllPosts as blogPosts, getCategories, getPostsByCategory } from "@/lib/blog";

/** All valid category names for filtering and URL generation */
export const BLOG_CATEGORIES = [
  "Guides",
  "Engineering",
  "Product",
  "AI",
] as const;
