# frozen_string_literal: true

require "rails_helper"

RSpec.describe User do
  subject(:user) { build(:user) }

  # -- Devise modules --
  describe "devise modules" do
    it { is_expected.to respond_to(:email) }
    it { is_expected.to respond_to(:encrypted_password) }
    it { is_expected.to respond_to(:reset_password_token) }       # recoverable
    it { is_expected.to respond_to(:remember_created_at) }         # rememberable
    it { is_expected.to respond_to(:sign_in_count) }               # trackable
    it { is_expected.to respond_to(:valid_password?) }             # database_authenticatable
  end

  # -- Validations --
  describe "validations" do
    it { is_expected.to validate_presence_of(:email) }
    it { is_expected.to validate_inclusion_of(:plan).in_array(%w[free starter pro enterprise]) }

    it "validates uniqueness of email (case-insensitive)" do
      create(:user, email: "test@example.com")
      duplicate = build(:user, email: "TEST@example.com")
      expect(duplicate).not_to be_valid
    end

    it "validates password length" do
      user.password = "short"
      expect(user).not_to be_valid
    end
  end

  # -- Associations --
  describe "associations" do
    it { is_expected.to have_many(:chats).dependent(:destroy) }
  end

  # -- OAuth --
  describe ".from_omniauth" do
    let(:auth) do
      OmniAuth::AuthHash.new(
        provider: "google_oauth2",
        uid: "123456",
        info: {
          email: "oauth@example.com",
          name: "OAuth User",
          image: "https://example.com/avatar.jpg"
        }
      )
    end

    it "creates a new user from OAuth data" do
      expect { described_class.from_omniauth(auth) }.to change(described_class, :count).by(1)
      user = described_class.last
      expect(user.email).to eq("oauth@example.com")
      expect(user.provider).to eq("google_oauth2")
      expect(user.uid).to eq("123456")
    end

    it "returns existing user if provider/uid match" do
      described_class.from_omniauth(auth)
      expect { described_class.from_omniauth(auth) }.not_to change(described_class, :count)
    end
  end

  # -- Magic link --
  describe "magic link" do
    let(:user) { create(:user) }

    describe "#generate_magic_link_token!" do
      it "sets token and timestamp" do
        token = user.generate_magic_link_token!
        expect(token).to be_present
        expect(user.reload.magic_link_token).to eq(token)
        expect(user.magic_link_sent_at).to be_within(2.seconds).of(Time.current)
      end
    end

    describe "#magic_link_valid?" do
      it "returns true for fresh token" do
        user.update!(magic_link_token: "abc", magic_link_sent_at: 5.minutes.ago)
        expect(user.magic_link_valid?).to be true
      end

      it "returns false for expired token" do
        user.update!(magic_link_token: "abc", magic_link_sent_at: 20.minutes.ago)
        expect(user.magic_link_valid?).to be false
      end

      it "returns false when token is nil" do
        expect(user.magic_link_valid?).to be false
      end
    end

    describe "#consume_magic_link!" do
      it "clears token and timestamp" do
        user.update!(magic_link_token: "abc", magic_link_sent_at: Time.current)
        user.consume_magic_link!
        expect(user.reload.magic_link_token).to be_nil
        expect(user.magic_link_sent_at).to be_nil
      end
    end
  end

  # -- JWT --
  describe "#jwt_payload" do
    it "includes sub, email, and plan" do
      user = create(:user, plan: "pro")
      payload = user.jwt_payload
      expect(payload["sub"]).to eq(user.id)
      expect(payload["email"]).to eq(user.email)
      expect(payload["plan"]).to eq("pro")
    end
  end
end
