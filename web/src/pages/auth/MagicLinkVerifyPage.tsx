import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../hooks/useAuth";

export function MagicLinkVerifyPage() {
  const { verifyMagicLink } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Invalid magic link");
      return;
    }

    verifyMagicLink(token).then((result) => {
      if (result.ok) {
        navigate("/dashboard", { replace: true });
      } else {
        setError(result.error || "Invalid or expired magic link");
      }
    });
  }, [searchParams, verifyMagicLink, navigate]);

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
        <p className="text-zinc-400">Verifying magic link...</p>
      )}
    </div>
  );
}
