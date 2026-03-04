/** JSON-LD structured data generators for RailsKit pages */

const SITE_URL = "https://railskit.dev";

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "RailsKit",
    url: SITE_URL,
    description:
      "Ship AI-powered Rails apps in minutes. Authentication, billing, agents, and deployment — all wired up.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/blog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RailsKit",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      "https://github.com/arushs/railskit",
      "https://x.com/railskit",
    ],
  };
}

export function softwareJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "RailsKit",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Cross-platform",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "0",
      highPrice: "299",
      priceCurrency: "USD",
      offerCount: "3",
    },
  };
}

interface PricingTier {
  name: string;
  price: number;
  description: string;
  features: string[];
}

export function pricingJsonLd(tiers: PricingTier[]) {
  return tiers.map((tier) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: `RailsKit ${tier.name}`,
    description: tier.description,
    offers: {
      "@type": "Offer",
      price: tier.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/#pricing`,
    },
  }));
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function blogPostJsonLd(post: {
  title: string;
  slug: string;
  description: string;
  date: string;
  author?: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: post.author ?? "RailsKit Team",
    },
    publisher: {
      "@type": "Organization",
      name: "RailsKit",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
    },
    ...(post.image ? { image: post.image } : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}
