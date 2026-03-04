/**
 * FAQ — Overcome objections before they become reasons to leave.
 *
 * Copywriting tips:
 * - Write questions the way a BUYER would ask them, not a developer.
 *   "Can I use my own database?" > "Database compatibility matrix"
 * - Address the top 5-7 objections. More = clutter.
 * - First question should be the most common one.
 * - Answers should be 1-3 sentences. Link to docs for details.
 * - End with a "Still have questions?" CTA.
 */

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Is this really free?",
    a: "The Starter tier is completely free and open source under MIT License. You get the full monorepo scaffold, Rails 8 API, React frontend, and Docker configs. Pro and Team add premium features like auth, payments, and admin dashboards.",
  },
  {
    q: "What Ruby and Node versions do I need?",
    a: "Ruby 3.3+ and Node 20+. The repo includes .ruby-version and .nvmrc files, plus a Docker setup if you prefer containers.",
  },
  {
    q: "Can I use a different database?",
    a: "PostgreSQL is the default and recommended choice. Rails supports MySQL and SQLite out of the box — you'd just update database.yml and the Docker config. But we optimize for Postgres.",
  },
  {
    q: "How do I deploy this?",
    a: "Anywhere that runs Docker. We include configs for Render, Fly.io, and Railway out of the box. The Dockerfiles are production-optimized with multi-stage builds.",
  },
  {
    q: "Can I use this for a commercial product?",
    a: "Absolutely. MIT License means you can use it for anything — personal projects, SaaS products, client work. No attribution required (but appreciated!).",
  },
  {
    q: "Do I get updates?",
    a: "Starter gets community updates via GitHub. Pro and Team get priority updates and migration guides when Rails or React ship major versions.",
  },
  {
    q: "What if I need help?",
    a: "Starter users can use GitHub Discussions. Pro gets priority email support. Team gets a dedicated Slack channel with the maintainers.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-20 sm:py-28 bg-zinc-900/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-zinc-400 text-lg">
            Everything you need to know before getting started.
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 px-6">
          <Accordion type="single" collapsible defaultValue="item-0">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {faq.a}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Still have questions CTA */}
        <div className="text-center mt-10">
          <p className="text-zinc-400 text-sm">
            Still have questions?{" "}
            <a
              href="mailto:hello@railskit.dev"
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
            >
              Reach out
            </a>{" "}
            or check the{" "}
            <a
              href="/docs"
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
            >
              docs
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
