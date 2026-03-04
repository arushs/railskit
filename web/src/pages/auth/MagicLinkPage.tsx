import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";

export function MagicLinkPage() {
  const { user, requestMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await requestMagicLink(email);
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Magic Link</h1>
          <p className="text-zinc-400 mt-1">Sign in without a password</p>
        </div>

        {sent ? (
          <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 text-center">
            <p className="text-green-400 font-medium">Check your email!</p>
            <p className="text-zinc-400 text-sm mt-1">
              We sent a sign-in link to <strong className="text-white">{email}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-zinc-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-medium py-2 rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition"
            >
              {loading ? "Sending..." : "Send Magic Link"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-zinc-500">
          <Link to="/auth/sign-in" className="text-white hover:underline">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
