# frozen_string_literal: true

require "test_helper"

class RailsKitConfigTest < ActiveSupport::TestCase
  test "config loads with defaults" do
    config = RailsKit.config
    assert_equal "MyApp", config.app.name
    assert_equal "devise", config.auth.provider
    assert_equal "stripe", config.payments.provider
    assert_equal "resend", config.email.provider
    assert_equal "zinc", config.theme.color_scheme
  end

  test "config exposes plans as array" do
    plans = RailsKit.config.payments.plans
    assert_kind_of Array, plans
    assert plans.any? { |p| p.id == "free" }
  end

  test "frontend_safe excludes stripe price IDs" do
    safe = RailsKit.config.frontend_safe
    safe["payments"]["plans"].each do |plan|
      refute plan.key?("stripe_monthly_price_id")
      refute plan.key?("stripe_yearly_price_id")
    end
  end

  test "frontend_safe includes app, theme, seo, features" do
    safe = RailsKit.config.frontend_safe
    %w[app theme seo features auth payments].each do |key|
      assert safe.key?(key), "Expected #{key} in frontend_safe config"
    end
  end

  test "hash-style access works" do
    assert_equal RailsKit.config[:app]["name"], RailsKit.config.app.name
  end

  test "reload! refreshes config" do
    RailsKit.reload!
    assert_equal "MyApp", RailsKit.config.app.name
  end
end
