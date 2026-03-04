import { NavLink } from "react-router";
import {
  LayoutDashboard,
  Settings,
  CreditCard,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/avatar";
import DarkModeToggle from "./DarkModeToggle";
import config from "@/config";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
  { to: "/dashboard/billing", icon: CreditCard, label: "Billing" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-transform duration-200 lg:static lg:translate-x-0",
          "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-lg font-bold text-zinc-900 dark:text-white">
            {config.app.name}
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard"}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
          <DarkModeToggle className="w-full justify-start gap-2" />

          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar
              src={user?.avatar_url}
              fallback={user?.name || user?.email || "U"}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                {user?.name || "User"}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
