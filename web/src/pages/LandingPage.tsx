import {
  Navbar,
  Hero,
  ProblemSolution,
  Features,
  Pricing,
  FAQ,
  Testimonials,
  CTA,
  Footer,
} from "../components/landing";
import SEO from "../components/seo/SEO";
import {
  websiteJsonLd,
  organizationJsonLd,
  softwareJsonLd,
  faqJsonLd,
} from "../components/seo/structured-data";

/**
 * LandingPage — The complete page composition.
 *
 * Section order is deliberate:
 * 1. Hero: Hook them with the value prop + demo
 * 2. Problem/Solution: Agitate the pain, present the cure
 * 3. Features: Show what's in the box
 * 4. Testimonials: Social proof builds trust
 * 5. Pricing: Now that they want it, show the cost
 * 6. FAQ: Handle objections
 * 7. CTA: Final push
 *
 * This order follows the AIDA framework: Attention → Interest → Desire → Action.
 */

const FAQ_DATA = [
  {
    question: "What is RailsKit?",
    answer:
      "RailsKit is a production-ready Rails + React starter kit with authentication, billing, AI agents, and deployment configs pre-wired.",
  },
  {
    question: "Do I need to know AI to use RailsKit?",
    answer:
      "No. RailsKit abstracts AI complexity behind simple generators and a streaming hook. Run rails generate agent and you're up.",
  },
  {
    question: "Can I use my own billing provider?",
    answer:
      "RailsKit ships with Stripe integration. The adapter pattern makes it straightforward to swap in other providers.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white antialiased">
      <SEO
        canonical="/"
        jsonLd={[
          websiteJsonLd(),
          organizationJsonLd(),
          softwareJsonLd(),
          faqJsonLd(FAQ_DATA),
        ]}
      />
      <Navbar />
      <main>
        <Hero />
        <ProblemSolution />
        <Features />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
