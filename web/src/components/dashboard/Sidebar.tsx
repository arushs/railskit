import { NavLink } from "react-router";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  DollarSign,
  Wrench,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { to: "/dashboard/conversations", icon: MessageSquare, label: "Conversations" },
  { to: "/dashboard/costs", icon: DollarSign, label: "Costs" },
  { to: "/dashboard/tools", icon: Wrench, label: "Tools" },
  { to: "/dashboard/models", icon: BarChart3, label: "Models" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-4">
        {!collapsed && (
          <span className="text-lg font-bold text-white tracking-tight">
            🚀 RailsKit
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              )
            }
          >
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-zinc-800 px-4 py-3">
        {!collapsed && (
          <div className="text-xs text-zinc-600">
            Agent Dashboard v0.1
          </div>
        )}
      </div>
    </aside>
  );
}
