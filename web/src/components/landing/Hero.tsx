import { useState, useEffect } from "react";

/**
 * Hero — The first thing visitors see. Make it count.
 *
 * Copywriting tips:
 * - Lead with the outcome, not the tool: "Ship in minutes" > "Rails 8 boilerplate"
 * - Subheadline should answer "how?" or "for whom?"
 * - Interactive demo widget builds trust — "this actually works"
 * - Social proof near CTA reduces friction (GitHub stars, user count)
 * - Two CTAs: primary (action) + secondary (learn more / see demo)
 */

const TYPING_COMMANDS = [
  { prompt: "$ bin/setup", output: "✓ Installing dependencies...\n✓ Database created\n✓ Seeds loaded\n✓ Ready in 42s" },
  { prompt: "$ bin/dev", output: "→ Rails API on :3000\n→ React app on :5173\n→ Hot reload active\n✓ Ship it 🚀" },
  { prompt: "$ rails g scaffold Post", output: "✓ Migration created\n✓ Model + controller\n✓ API routes configured\n✓ TypeScript types generated" },
];

function TerminalDemo() {
  const [cmdIndex, setCmdIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [showOutput, setShowOutput] = useState(false);
  const [history, setHistory] = useState<Array<{ prompt: string; output: string }>>([]);

  const current = TYPING_COMMANDS[cmdIndex];

  useEffect(() => {
    if (charIndex < current.prompt.length) {
      const timer = setTimeout(() => setCharIndex((i) => i + 1), 50);
      return () => clearTimeout(timer);
    }
    if (!showOutput) {
      const timer = setTimeout(() => setShowOutput(true), 400);
      return () => clearTimeout(timer);
    }
    // After showing output, queue next command
    const timer = setTimeout(() => {
      setHistory((h) => [...h, current]);
      setCmdIndex((i) => (i + 1) % TYPING_COMMANDS.length);
      setCharIndex(0);
      setShowOutput(false);
      // Reset history after full cycle to avoid infinite growth
      if (cmdIndex === TYPING_COMMANDS.length - 1) {
        setHistory([]);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [charIndex, showOutput, current, cmdIndex]);

  return (
    <div className="w-full max-w-xl mx-auto rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl shadow-indigo-500/5">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-2 text-xs text-zinc-500 font-mono">railskit</span>
      </div>
      {/* Terminal body */}
      <div className="p-4 font-mono text-sm space-y-2 min-h-[200px]">
        {/* History */}
        {history.map((h, i) => (
          <div key={i} className="space-y-1">
            <div className="text-green-400">{h.prompt}</div>
            <div className="text-zinc-500 whitespace-pre-line text-xs">{h.output}</div>
          </div>
        ))}
        {/* Current line */}
        <div className="text-green-400">
          {current.prompt.slice(0, charIndex)}
          {!showOutput && (
            <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-0.5 align-middle" />
          )}
        </div>
        {showOutput && (
          <div className="text-zinc-400 whitespace-pre-line text-xs animate-in fade-in duration-300">
            {current.output}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/10 via-zinc-950 to-zinc-950 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Rails 8 + React 19 + TypeScript
          </div>

          {/* Headline — lead with the outcome */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
            Stop scaffolding.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Start shipping.
            </span>
          </h1>

          {/* Subheadline — answer "how?" */}
          <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            The production-ready Rails 8 API + React monorepo.
            Auth, payments, deploy configs — already done.
            Run one command. Build your product.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#pricing"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-500/25"
            >
              Get Started — Free
            </a>
            <a
              href="https://github.com/arushs/railskit"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all border border-zinc-700"
            >
              ⭐ Star on GitHub
            </a>
          </div>

          {/* Social proof */}
          <p className="mt-6 text-sm text-zinc-500">
            Open source · MIT License · Built for developers who ship
          </p>
        </div>

        {/* Interactive demo widget */}
        <TerminalDemo />
      </div>
    </section>
  );
}
