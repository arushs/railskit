import { cn } from "../../lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1 text-sm text-zinc-100",
        "placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
