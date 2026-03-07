import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Is this really free?",
    a: "The Starter tier is completely free and open source under MIT License. You get the full monorepo scaffold. Pro and Team add premium features like auth, payments, and admin dashboards.",
  },
  {
    q: "What Ruby and Node versions do I need?",
    a: "Ruby 3.3+ and Node 20+. The repo includes .ruby-version and .nvmrc files, plus a Docker setup if you prefer containers.",
  },
  {
    q: "Can I use a different database?",
    a: "PostgreSQL is the default and recommended. Rails supports MySQL and SQLite — you'd just update database.yml and the Docker config.",
  },
  {
    q: "How do I deploy this?",
    a: "Anywhere that runs Docker. We include configs for Render, Fly.io, and Railway out of the box with production-optimized multi-stage builds.",
  },
  {
    q: "Can I use this for commercial products?",
    a: "Absolutely. MIT License — personal projects, SaaS products, client work. No attribution required.",
  },
  {
    q: "Do I get updates?",
    a: "Starter gets community updates via GitHub. Pro and Team get priority updates and migration guides for major Rails/React versions.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-24 sm:py-32 border-t border-white/[0.04]">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[13px] font-medium text-indigo-400 tracking-wide uppercase mb-3">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Common questions
          </h2>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6">
          <Accordion type="single" collapsible defaultValue="item-0">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-[14px] text-white hover:text-indigo-400">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-[13px] text-zinc-400 leading-relaxed pb-1">
                    {faq.a}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-8">
          <p className="text-[13px] text-zinc-500">
            Still have questions?{" "}
            <a
              href="mailto:hello@railskit.dev"
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
            >
              Reach out
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
