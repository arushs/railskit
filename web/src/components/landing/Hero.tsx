import { useState, useEffect } from "react";

const CODE_LINES = [
  { text: "$ bin/setup", color: "text-emerald-400" },
  { text: "  ✓ Dependencies installed", color: "text-zinc-500" },
  { text: "  ✓ Database created & seeded", color: "text-zinc-500" },
  { text: "  ✓ Ready in 38s", color: "text-zinc-500" },
  { text: "", color: "" },
  { text: "$ bin/dev", color: "text-emerald-400" },
  { text: "  → API on :3000  ·  App on :5173", color: "text-zinc-500" },
  { text: "  → Hot reload active ⚡", color: "text-zinc-500" },
];

function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines >= CODE_LINES.length) return;
    const delay = CODE_LINES[visibleLines].text === "" ? 400 : visibleLines === 0 || visibleLines === 5 ? 600 : 200;
    const timer = setTimeout(() => setVisibleLines((v) => v + 1), delay);
    return () => clearTimeout(timer);
  }, [visibleLines]);

  return (
    <div className="w-full max-w-lg rounded-xl overflow-hidden border border-white/[0.06] bg-[#0c0c0e] shadow-2xl shadow-black/50">
      {/* Title bar */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.04]">
        <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
        <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
        <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
        <span className="ml-2 text-[11px] text-zinc-600 font-mono">~/my-app</span>
      </div>
      {/* Body */}
      <div className="p-4 font-mono text-[13px] min-h-[200px] space-y-0.5">
        {CODE_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={`${line.color} leading-relaxed`}>
            {line.text || "\u00A0"}
          </div>
        ))}
        {visibleLines < CODE_LINES.length && (
          <span className="inline-block w-[7px] h-[14px] bg-emerald-400/80 animate-pulse" />
        )}
      </div>
    </div>
  );
}

const STATS = [
  { value: "< 2 min", label: "Setup time" },
  { value: "MIT", label: "License" },
  { value: "Rails 8", label: "Framework" },
  { value: "React 19", label: "Frontend" },
];

export default function Hero() {
  return (
    <section className="relative pt-36 pb-24 sm:pt-44 sm:pb-32 overflow-hidden">
      {/* Gradient mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[900px] h-[700px] rounded-full bg-indigo-600/[0.07] blur-[120px]" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-violet-600/[0.05] blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-600/[0.04] blur-[80px]" />
      </div>

      {/* Grid noise overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-[12px] text-zinc-400 font-medium mb-8">
            <span className="flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            Now with Rails 8 + React 19 + Vite
          </div>

          {/* Headline */}
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold text-white tracking-tight leading-[1.08]">
            Stop wiring infra.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Start building product.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-[17px] sm:text-[19px] text-zinc-400 leading-relaxed max-w-xl mx-auto">
            The production-ready Rails&nbsp;8 + React monorepo.
            Auth, payments, deploy&nbsp;— already&nbsp;done.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-[14px] font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:shadow-indigo-500/30"
            >
              Get Started — Free
            </a>
            <a
              href="https://github.com/arushs/railskit"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-[14px] font-medium text-zinc-300 bg-white/[0.05] hover:bg-white/[0.08] rounded-xl border border-white/[0.08] transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              Star on GitHub
            </a>
          </div>
        </div>

        {/* Terminal demo */}
        <div className="mt-16 flex justify-center">
          <TerminalDemo />
        </div>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
          {STATS.map((stat) => (
            <div key={stat.label} className="px-6 py-5 text-center bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
              <div className="text-[20px] font-semibold text-white tracking-tight">{stat.value}</div>
              <div className="mt-1 text-[12px] text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
