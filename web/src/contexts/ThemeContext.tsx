import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Theme = "light" | "dark";
export type ColorTheme = "blue" | "purple" | "green" | "orange" | "rose";

export const COLOR_THEMES: { id: ColorTheme; label: string; swatch: string }[] = [
  { id: "blue", label: "Blue", swatch: "#818cf8" },
  { id: "purple", label: "Purple", swatch: "#a78bfa" },
  { id: "green", label: "Green", swatch: "#34d399" },
  { id: "orange", label: "Orange", swatch: "#fb923c" },
  { id: "rose", label: "Rose", swatch: "#f472b6" },
];

interface ThemeContextType {
  theme: Theme;
  colorTheme: ColorTheme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = "railskit-theme";
const COLOR_STORAGE_KEY = "railskit-color-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialColorTheme(): ColorTheme {
  if (typeof window === "undefined") return "blue";
  const stored = localStorage.getItem(COLOR_STORAGE_KEY);
  if (stored && COLOR_THEMES.some((t) => t.id === stored)) return stored as ColorTheme;
  return "blue";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(getInitialColorTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-color-theme", colorTheme);
    localStorage.setItem(COLOR_STORAGE_KEY, colorTheme);
  }, [colorTheme]);

  const toggleTheme = () => setThemeState((t) => (t === "dark" ? "light" : "dark"));
  const setTheme = (t: Theme) => setThemeState(t);
  const setColorTheme = (ct: ColorTheme) => setColorThemeState(ct);

  return (
    <ThemeContext.Provider value={{ theme, colorTheme, toggleTheme, setTheme, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
