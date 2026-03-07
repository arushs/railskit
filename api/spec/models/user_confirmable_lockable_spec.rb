# frozen_string_literal: true

require "rails_helper"
require "ostruct"

RSpec.describe User do
  describe "confirmable" do
    it "new users have confirmed_at set by factory default" do
      user = create(:user)
      expect(user.confirmed?).to be true
    end

    it "unconfirmed trait creates unconfirmed user" do
      user = create(:user, :unconfirmed)
      expect(user.confirmed?).to be false
    end

    it "confirmation_required? respects config" do
      user = build(:user, :unconfirmed)
      # With default config (require_email_confirmation: true), confirmation is required
      expect(user.confirmation_required?).to be true
    end
  end

  describe "lockable" do
    it "locked trait creates locked user" do
      user = create(:user, :locked)
      expect(user.access_locked?).to be true
    end

    it "locks after max failed attempts" do
      user = create(:user, :confirmed)
      10.times { user.increment_failed_attempts }
      user.save!
      expect(user.failed_attempts).to eq(10)
    end

    it "unlock_token is set on locked user" do
      user = create(:user, :confirmed)
      user.lock_access!
      expect(user.unlock_token).to be_present
    end
  end

  describe "from_omniauth" do
    it "auto-confirms OAuth users" do
      auth = OpenStruct.new(
        provider: "google_oauth2",
        uid: "12345",
        info: OpenStruct.new(email: "test@example.com", name: "Test User", image: nil)
      )
      user = User.from_omniauth(auth)
      expect(user.confirmed?).to be true
    end
  end
end
