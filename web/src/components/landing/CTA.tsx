/**
 * CTA — The final push. If they've scrolled this far, they're interested.
 *
 * Copywriting tips:
 * - Restate the core value prop, but shorter and punchier.
 * - Create urgency without being sleazy. "Start building today" > "Limited time offer!!!"
 * - Terminal-style code snippet = instant dev credibility.
 * - One primary CTA. Don't dilute with options.
 */

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CTA() {
  return (
    <section className="py-20 sm:py-28 bg-zinc-950 relative overflow-hidden">
      {/* Background effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          Your next project starts here
        </h2>
        <p className="mt-4 text-zinc-400 text-lg max-w-xl mx-auto">
          One command. Full-stack Rails + React. Production-ready in minutes.
        </p>

        {/* Terminal snippet */}
        <div className="mt-8 inline-block bg-zinc-900 rounded-xl border border-zinc-800 px-6 py-4 font-mono text-sm">
          <span className="text-zinc-500">$</span>{" "}
          <span className="text-green-400">git clone</span>{" "}
          <span className="text-zinc-300">github.com/arushs/railskit</span>{" "}
          <span className="text-zinc-500">&& cd railskit &&</span>{" "}
          <span className="text-green-400">bin/setup</span>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#pricing"
            className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto")}
          >
            Get Started — Free
          </a>
          <a
            href="/docs"
            className={cn(buttonVariants({ variant: "ghost" }), "w-full sm:w-auto")}
          >
            Read the docs →
          </a>
        </div>
      </div>
    </section>
  );
}
