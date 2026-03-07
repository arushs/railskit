import { useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { authApi } from "../../lib/api";

type SetupStep = "idle" | "scanning" | "verifying" | "complete";

export function AccountSecurityPage() {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<SetupStep>("idle");
  const [otpUri, setOtpUri] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  const handleEnable2FA = useCallback(async () => {
    clearMessages();
    setLoading(true);
    const res = await authApi.twoFactor.enable();
    setLoading(false);

    if (res.ok) {
      setOtpUri(res.data.otp_uri);
      setStep("scanning");
    } else {
      const err = res.data as unknown as { error?: string };
      setError(err.error || "Failed to enable 2FA");
    }
  }, []);

  const handleVerify = useCallback(async () => {
    clearMessages();
    setLoading(true);
    const res = await authApi.twoFactor.verify(verifyCode);
    setLoading(false);

    if (res.ok) {
      setBackupCodes(res.data.backup_codes);
      setStep("complete");
      refreshUser();
    } else {
      const err = res.data as unknown as { error?: string };
      setError(err.error || "Invalid code");
    }
  }, [verifyCode, refreshUser]);

  const handleDisable = useCallback(async () => {
    clearMessages();
    if (!password) {
      setError("Password required to disable 2FA");
      return;
    }
    setLoading(true);
    const res = await authApi.twoFactor.disable(password);
    setLoading(false);

    if (res.ok) {
      setMessage("Two-factor authentication disabled");
      setPassword("");
      setStep("idle");
      refreshUser();
    } else {
      const err = res.data as unknown as { error?: string };
      setError(err.error || "Failed to disable 2FA");
    }
  }, [password, refreshUser]);

  const handleRegenerateBackupCodes = useCallback(async () => {
    clearMessages();
    if (!password) {
      setError("Password required to regenerate backup codes");
      return;
    }
    setLoading(true);
    const res = await authApi.twoFactor.regenerateBackupCodes(password);
    setLoading(false);

    if (res.ok) {
      setBackupCodes(res.data.backup_codes);
      setMessage("New backup codes generated");
      setPassword("");
    } else {
      const err = res.data as unknown as { error?: string };
      setError(err.error || "Failed to regenerate codes");
    }
  }, [password]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Security</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-4 rounded-lg">
          {message}
        </div>
      )}

      {/* Two-Factor Authentication Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Two-Factor Authentication
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add an extra layer of security with TOTP authenticator app.
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              user?.two_factor_enabled
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            {user?.two_factor_enabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        {/* Enable Flow */}
        {!user?.two_factor_enabled && step === "idle" && (
          <button
            onClick={handleEnable2FA}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
          >
            {loading ? "Setting up..." : "Enable 2FA"}
          </button>
        )}

        {step === "scanning" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.):
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Or manually enter this URI:
              </p>
              <code className="text-xs break-all text-gray-700 dark:text-gray-300">{otpUri}</code>
            </div>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Enter code from app
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="000000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  maxLength={6}
                />
              </div>
              <button
                onClick={handleVerify}
                disabled={loading || verifyCode.length < 6}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </div>
            <button
              onClick={() => setStep("idle")}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        )}

        {step === "complete" && backupCodes.length > 0 && (
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                ⚠️ Save Your Backup Codes
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                Store these codes safely. Each can only be used once. If you lose your authenticator, these are your only way in.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <code
                    key={i}
                    className="px-3 py-1 bg-white dark:bg-gray-800 rounded border text-sm font-mono text-center"
                  >
                    {code}
                  </code>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                setStep("idle");
                setBackupCodes([]);
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              I've saved my codes
            </button>
          </div>
        )}

        {/* Disable Flow */}
        {user?.two_factor_enabled && step === "idle" && (
          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password (required for changes)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Enter your password"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRegenerateBackupCodes}
                disabled={loading || !password}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
              >
                Regenerate Backup Codes
              </button>
              <button
                onClick={handleDisable}
                disabled={loading || !password}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors text-sm"
              >
                Disable 2FA
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Email Confirmation Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Email Verification
        </h2>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              user?.confirmed ? "bg-green-500" : "bg-yellow-500"
            }`}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {user?.confirmed ? "Email verified" : "Email not verified"}
          </span>
        </div>
      </section>

      {/* Account Info */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Account Info
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Email: {user?.email}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Plan: {user?.plan}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Member since: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
        </p>
      </section>
    </div>
  );
}
