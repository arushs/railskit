import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../hooks/useAuth";

export function OAuthCallbackPage() {
  const { refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(`OAuth failed: ${errorParam}`);
      return;
    }

    // On successful OAuth, the JWT cookie is already set by the API redirect.
    // Just refresh the user and navigate.
    refreshUser().then(() => {
      navigate("/dashboard", { replace: true });
    });
  }, [searchParams, refreshUser, navigate]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      {error ? (
        <div className="text-center space-y-4">
          <p className="text-red-400">{error}</p>
          <a href="/auth/sign-in" className="text-zinc-400 hover:text-white text-sm">
            ← Back to sign in
          </a>
        </div>
      ) : (
        <p className="text-zinc-400">Completing sign in...</p>
      )}
    </div>
  );
}
