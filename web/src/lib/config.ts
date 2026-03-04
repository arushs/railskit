// ============================================================================
// RailsKit Frontend Configuration
// ============================================================================
// Mirrors railskit.yml — provides typed config for the React app.
//
// Two modes:
//   1. Static defaults (works offline, instant)
//   2. Dynamic fetch from /api/config (syncs with backend railskit.yml)
//
// Usage:
//   import { config, loadConfig } from './config';
//   await loadConfig(); // optional — fetches from API
//   console.log(config.app.name);
// ============================================================================

// --- Types ------------------------------------------------------------------

export interface AppConfig {
  name: string;
  tagline: string;
  domain: string;
  support_email: string;
}

export interface AuthConfig {
  enable_registration: boolean;
  enable_magic_link: boolean;
  oauth: {
    google: boolean;
    github: boolean;
  };
}

export interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
}

export interface PaymentsConfig {
  provider: "stripe" | "lemon_squeezy" | "none";
  plans: Plan[];
}

export interface ThemeConfig {
  color_scheme: "zinc" | "slate" | "stone" | "neutral" | "gray";
  primary_color: string;
  dark_mode: boolean;
  font: string;
  border_radius: string;
  logo_url: string;
}

export interface SeoConfig {
  title: string;
  description: string;
  og_image: string;
  twitter_handle: string;
  google_analytics_id: string;
}

export interface FeaturesConfig {
  blog: boolean;
  admin_panel: boolean;
  teams: boolean;
  api_keys: boolean;
  notifications: boolean;
}

export interface RailsKitConfig {
  app: AppConfig;
  auth: AuthConfig;
  payments: PaymentsConfig;
  theme: ThemeConfig;
  seo: SeoConfig;
  features: FeaturesConfig;
}

// --- Defaults (match railskit.yml) ------------------------------------------

const defaults: RailsKitConfig = {
  app: {
    name: "MyApp",
    tagline: "Ship your SaaS in a weekend",
    domain: "localhost",
    support_email: "support@example.com",
  },
  auth: {
    enable_registration: true,
    enable_magic_link: false,
    oauth: {
      google: false,
      github: false,
    },
  },
  payments: {
    provider: "stripe",
    plans: [
      {
        id: "free",
        name: "Free",
        price_monthly: 0,
        price_yearly: 0,
        features: ["1 project", "Basic analytics", "Community support"],
      },
      {
        id: "pro",
        name: "Pro",
        price_monthly: 29,
        price_yearly: 290,
        features: [
          "Unlimited projects",
          "Advanced analytics",
          "Priority support",
          "API access",
        ],
      },
      {
        id: "enterprise",
        name: "Enterprise",
        price_monthly: 99,
        price_yearly: 990,
        features: [
          "Everything in Pro",
          "SSO / SAML",
          "Dedicated support",
          "Custom integrations",
        ],
      },
    ],
  },
  theme: {
    color_scheme: "zinc",
    primary_color: "#6366f1",
    dark_mode: true,
    font: "Inter",
    border_radius: "0.5rem",
    logo_url: "",
  },
  seo: {
    title: "MyApp — Ship your SaaS in a weekend",
    description:
      "The fastest way to launch your SaaS. Rails API + React + Vite.",
    og_image: "/og-image.png",
    twitter_handle: "",
    google_analytics_id: "",
  },
  features: {
    blog: false,
    admin_panel: false,
    teams: false,
    api_keys: false,
    notifications: false,
  },
};

// --- Mutable config singleton -----------------------------------------------

function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>
): T {
  const result = { ...base };
  for (const key of Object.keys(override) as (keyof T)[]) {
    const baseVal = base[key];
    const overVal = override[key];
    if (
      baseVal &&
      overVal &&
      typeof baseVal === "object" &&
      typeof overVal === "object" &&
      !Array.isArray(baseVal)
    ) {
      (result as Record<string, unknown>)[key as string] = deepMerge(
        baseVal as Record<string, unknown>,
        overVal as Record<string, unknown>
      );
    } else if (overVal !== undefined) {
      (result as Record<string, unknown>)[key as string] = overVal;
    }
  }
  return result;
}

// The live config object — starts with defaults, updated by loadConfig()
export let config: RailsKitConfig = { ...defaults };

/**
 * Fetch config from the Rails API and merge with defaults.
 * Call this once at app startup (e.g., in main.tsx before render).
 * Falls back silently to defaults if the API is unreachable.
 */
export async function loadConfig(): Promise<RailsKitConfig> {
  try {
    const apiBase = import.meta.env.VITE_API_URL || "";
    const res = await fetch(`${apiBase}/api/config`);
    if (res.ok) {
      const data = await res.json();
      config = deepMerge(defaults, data);
    }
  } catch {
    // API unreachable — use defaults silently
    console.warn("[RailsKit] Could not fetch config from API, using defaults");
  }
  return config;
}

// --- Convenience helpers ----------------------------------------------------

/** Get the current app name */
export const appName = () => config.app.name;

/** Check if a feature flag is enabled */
export const isFeatureEnabled = (feature: keyof FeaturesConfig) =>
  config.features[feature];

/** Check if an OAuth provider is enabled */
export const isOAuthEnabled = (provider: "google" | "github") =>
  config.auth.oauth[provider];

/** Get plan by ID */
export const getPlan = (id: string) =>
  config.payments.plans.find((p) => p.id === id);

/** Get all plans */
export const getPlans = () => config.payments.plans;

/** Get primary color for inline styles / CSS variables */
export const primaryColor = () => config.theme.primary_color;
