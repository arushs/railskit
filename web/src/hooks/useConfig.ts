import { config, type RailsKitConfig } from "../lib/config";

/**
 * Access the RailsKit config in any component.
 * Config is loaded once at app startup (main.tsx) and stays in memory.
 *
 * Usage:
 *   const { app, theme, payments } = useConfig();
 *   return <h1>{app.name}</h1>;
 */
export function useConfig(): RailsKitConfig {
  return config;
}
