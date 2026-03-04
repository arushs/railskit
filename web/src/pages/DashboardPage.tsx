import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Activity, Users, Zap } from "lucide-react";

const stats = [
  { label: "Total Revenue", value: "$12,345", icon: CreditCard, change: "+12%" },
  { label: "Active Users", value: "1,234", icon: Users, change: "+8%" },
  { label: "API Requests", value: "45.2K", icon: Activity, change: "+23%" },
  { label: "Uptime", value: "99.9%", icon: Zap, change: "0%" },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Here's what's happening with your project today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, change }) => (
          <Card key={label} className="dark:bg-zinc-900/50 bg-white">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</div>
              <p className="mt-1 text-xs text-emerald-500">{change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="dark:bg-zinc-900/50 bg-white">
        <CardHeader className="p-6">
          <CardTitle className="text-zinc-900 dark:text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-4">
            {[
              { action: "New user signed up", time: "2 minutes ago" },
              { action: "Payment received \u2014 $49.00", time: "1 hour ago" },
              { action: "API key generated", time: "3 hours ago" },
              { action: "Webhook configured", time: "5 hours ago" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 last:border-0 last:pb-0"
              >
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{item.action}</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
