# frozen_string_literal: true

# Seed plans — replace stripe_price_id with your actual Stripe price IDs.
plans = [
  {
    name: "Starter", slug: "starter", stripe_price_id: "price_starter_free",
    interval: "month", amount_cents: 0, sort_order: 0,
    features: { "monorepo" => true, "docker" => true, "community_support" => true }
  },
  {
    name: "Pro Monthly", slug: "pro-monthly", stripe_price_id: "price_pro_monthly",
    interval: "month", amount_cents: 4900, sort_order: 1,
    features: { "monorepo" => true, "docker" => true, "auth" => true, "stripe" => true,
                "admin_dashboard" => true, "email_templates" => true,
                "priority_support" => true, "lifetime_updates" => true }
  },
  {
    name: "Pro Annual", slug: "pro-annual", stripe_price_id: "price_pro_annual",
    interval: "year", amount_cents: 3900, sort_order: 2,
    features: { "monorepo" => true, "docker" => true, "auth" => true, "stripe" => true,
                "admin_dashboard" => true, "email_templates" => true,
                "priority_support" => true, "lifetime_updates" => true }
  },
  {
    name: "Team Monthly", slug: "team-monthly", stripe_price_id: "price_team_monthly",
    interval: "month", amount_cents: 14_900, sort_order: 3,
    features: { "monorepo" => true, "docker" => true, "auth" => true, "stripe" => true,
                "admin_dashboard" => true, "email_templates" => true,
                "priority_support" => true, "lifetime_updates" => true,
                "multi_tenant" => true, "team_management" => true, "rbac" => true,
                "audit_logging" => true, "cicd" => true, "dedicated_support" => true }
  },
  {
    name: "Team Annual", slug: "team-annual", stripe_price_id: "price_team_annual",
    interval: "year", amount_cents: 11_900, sort_order: 4,
    features: { "monorepo" => true, "docker" => true, "auth" => true, "stripe" => true,
                "admin_dashboard" => true, "email_templates" => true,
                "priority_support" => true, "lifetime_updates" => true,
                "multi_tenant" => true, "team_management" => true, "rbac" => true,
                "audit_logging" => true, "cicd" => true, "dedicated_support" => true }
  }
]

plans.each do |attrs|
  Plan.find_or_create_by!(slug: attrs[:slug]) do |plan|
    plan.assign_attributes(attrs)
  end
end

puts "Seeded #{plans.size} plans"
