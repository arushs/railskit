import { useTheme, COLOR_THEMES, type ColorTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export default function ThemePicker({ className }: { className?: string }) {
  const { colorTheme, setColorTheme } = useTheme();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {COLOR_THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => setColorTheme(t.id as ColorTheme)}
          className={cn(
            "relative h-8 w-8 rounded-full border-2 transition-all",
            "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2",
            "dark:focus:ring-offset-zinc-900",
            colorTheme === t.id
              ? "border-zinc-900 dark:border-white scale-110"
              : "border-transparent"
          )}
          style={{ backgroundColor: t.swatch }}
          aria-label={`${t.label} theme`}
          title={t.label}
        >
          {colorTheme === t.id && (
            <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-sm" />
          )}
        </button>
      ))}
    </div>
  );
}
