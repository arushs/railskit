/**
 * RailsKit frontend configuration.
 *
 * Values come from three sources (highest priority first):
 *   1. VITE_RAILSKIT_* environment variables (set at build time)
 *   2. A generated JSON file (railskit.generated.json) produced by
 *      `rails railskit:generate_frontend_config`
 *   3. Hard-coded defaults matching railskit.yml
 */

// --- Defaults (mirrors railskit.yml) ---
const defaults = {
  app: {
    name: "RailsKit",
    domain: "localhost",
  },
  database: {
    adapter: "postgresql",
  },
  auth: {
    provider: "devise",
    google_oauth: true,
    magic_links: true,
  },
  payments: {
    provider: "stripe",
  },
  email: {
    provider: "resend",
  },
  ai: {
    provider: "openai",
    model: "gpt-4o",
  },
  theme: {
    primary_color: "#6366f1",
    dark_mode: true,
  },
} as const;

// --- Types ---
export interface RailsKitConfig {
  app: { name: string; domain: string };
  database: { adapter: string };
  auth: { provider: string; google_oauth: boolean; magic_links: boolean };
  payments: { provider: string };
  email: { provider: string };
  ai: { provider: string; model: string };
  theme: { primary_color: string; dark_mode: boolean };
}

// --- Try to import the generated JSON (tree-shaken if missing) ---
let generated: Partial<RailsKitConfig> = {};
try {
  // Vite resolves this at build time; if the file doesn't exist the catch fires.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  generated = await import("./railskit.generated.json");
} catch {
  // No generated config — that's fine, we'll use defaults + env vars.
}

// --- Env var overrides (VITE_RAILSKIT_*) ---
function env(key: string): string | undefined {
  return import.meta.env?.[`VITE_RAILSKIT_${key}`] as string | undefined;
}

function envBool(key: string): boolean | undefined {
  const v = env(key);
  if (v === undefined) return undefined;
  return v === "true" || v === "1";
}

function merge<T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>,
): T {
  const result = { ...base };
  for (const key of Object.keys(override) as (keyof T)[]) {
    const val = override[key];
    if (
      val !== undefined &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      val !== null
    ) {
      result[key] = merge(
        base[key] as Record<string, unknown>,
        val as Record<string, unknown>,
      ) as T[keyof T];
    } else if (val !== undefined) {
      result[key] = val as T[keyof T];
    }
  }
  return result;
}

// Build the final config: defaults ← generated JSON ← env vars
const envOverrides: Partial<RailsKitConfig> = {
  app: {
    name: env("APP_NAME") ?? defaults.app.name,
    domain: env("APP_DOMAIN") ?? defaults.app.domain,
  },
  auth: {
    provider: env("AUTH_PROVIDER") ?? defaults.auth.provider,
    google_oauth:
      envBool("AUTH_GOOGLE_OAUTH") ?? defaults.auth.google_oauth,
    magic_links: envBool("AUTH_MAGIC_LINKS") ?? defaults.auth.magic_links,
  },
  payments: {
    provider: env("PAYMENTS_PROVIDER") ?? defaults.payments.provider,
  },
  ai: {
    provider: env("AI_PROVIDER") ?? defaults.ai.provider,
    model: env("AI_MODEL") ?? defaults.ai.model,
  },
  theme: {
    primary_color: env("THEME_PRIMARY_COLOR") ?? defaults.theme.primary_color,
    dark_mode: envBool("THEME_DARK_MODE") ?? defaults.theme.dark_mode,
  },
};

export const config: RailsKitConfig = merge(
  merge(defaults as unknown as RailsKitConfig, generated),
  envOverrides,
);

export default config;
