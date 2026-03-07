import { useState } from "react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Docs", href: "/docs" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between h-16 border-b border-white/[0.06]">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-white tracking-tight">
              RailsKit
            </span>
          </a>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-[13px] text-zinc-400 hover:text-white transition-colors rounded-lg"
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://github.com/arushs/railskit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-[13px] text-zinc-400 hover:text-white transition-colors rounded-lg"
            >
              GitHub
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="/auth/sign-in"
              className="text-[13px] text-zinc-400 hover:text-white transition-colors"
            >
              Log in
            </a>
            <a
              href="#pricing"
              className="px-4 py-1.5 text-[13px] font-medium text-white bg-white/10 hover:bg-white/15 rounded-lg border border-white/10 transition-colors"
            >
              Get Started
            </a>
          </div>

          {/* Mobile */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-zinc-400"
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-zinc-950/95 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="px-6 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-[14px] text-zinc-400 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 mt-3 border-t border-white/[0.06]">
              <a
                href="#pricing"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center py-2.5 text-[13px] font-medium text-white bg-white/10 rounded-lg"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
