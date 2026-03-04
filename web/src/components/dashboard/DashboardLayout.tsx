import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { MessageSquare, DollarSign, Wrench, LayoutDashboard, ArrowLeft } from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/conversations", label: "Conversations", icon: MessageSquare },
  { to: "/dashboard/costs", label: "Costs", icon: DollarSign },
  { to: "/dashboard/tools", label: "Tools", icon: Wrench },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  function isActive(to: string, end?: boolean) {
    if (end) return location.pathname === to;
    return location.pathname.startsWith(to);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="h-5 w-px bg-zinc-800" />
          <span className="text-sm font-semibold text-white">Agent Dashboard</span>
          <nav className="ml-auto flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to, item.end);
              return (
                <Link key={item.to} to={item.to} className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
                )}>
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
