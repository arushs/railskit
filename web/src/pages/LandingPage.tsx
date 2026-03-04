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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white antialiased">
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
