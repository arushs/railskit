import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30",
        success: "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30",
        warning: "bg-amber-600/20 text-amber-400 border border-amber-500/30",
        destructive: "bg-red-600/20 text-red-400 border border-red-500/30",
        secondary: "bg-zinc-600/20 text-zinc-400 border border-zinc-500/30",
        outline: "border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
