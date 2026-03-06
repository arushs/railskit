# frozen_string_literal: true

# ActiveRecord Encryption — required by devise-two-factor for OTP secret storage.
# Set via env vars in production. Dev/test use deterministic fallbacks.

Rails.application.configure do
  fallback_key = "railskit-dev-key-" + ("0" * 16)

  config.active_record.encryption.primary_key = ENV.fetch("ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY") {
    if Rails.application.credentials.respond_to?(:active_record_encryption)
      Rails.application.credentials.dig(:active_record_encryption, :primary_key)
    end || fallback_key
  }
  config.active_record.encryption.deterministic_key = ENV.fetch("ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY") {
    if Rails.application.credentials.respond_to?(:active_record_encryption)
      Rails.application.credentials.dig(:active_record_encryption, :deterministic_key)
    end || fallback_key
  }
  config.active_record.encryption.key_derivation_salt = ENV.fetch("ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT") {
    if Rails.application.credentials.respond_to?(:active_record_encryption)
      Rails.application.credentials.dig(:active_record_encryption, :key_derivation_salt)
    end || fallback_key
  }
end
