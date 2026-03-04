export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
}

/**
 * Blog post registry.
 * Markdown files live in this directory. Add new posts here and import the .md file
 * in the BlogPostPage component's loader.
 */
export const blogPosts: BlogPost[] = [
  {
    slug: "getting-started",
    title: "Getting Started with RailsKit",
    description:
      "A quick guide to setting up RailsKit and shipping your first AI-powered Rails app.",
    date: "2026-03-04",
    author: "RailsKit Team",
    tags: ["guide", "quickstart"],
  },
  {
    slug: "why-rails-for-ai",
    title: "Why Rails is Perfect for AI Applications",
    description:
      "Rails brings rapid full-stack development to the AI ecosystem. Here's why it matters.",
    date: "2026-03-04",
    author: "RailsKit Team",
    tags: ["opinion", "rails", "ai"],
  },
];
