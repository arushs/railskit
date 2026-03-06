import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { teamsApi } from "@/lib/teams-api";
import { CheckCircle, XCircle, Loader2, Users } from "lucide-react";

export function AcceptInvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [_teamSlug, setTeamSlug] = useState("");

  useEffect(() => {
    if (!token) return;

    const accept = async () => {
      const res = await teamsApi.acceptInvitation(token);
      if (res.ok) {
        setStatus("success");
        setMessage(res.data.message || "Invitation accepted!");
        setTeamSlug(res.data.team?.slug || "");
      } else {
        setStatus("error");
        setMessage((res.data as any)?.error || "Failed to accept invitation");
      }
    };

    accept();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-400" />
            <h2 className="mt-4 text-lg font-semibold text-white">Accepting invitation...</h2>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="mx-auto h-10 w-10 text-emerald-400" />
            <h2 className="mt-4 text-lg font-semibold text-white">{message}</h2>
            <p className="mt-2 text-sm text-zinc-400">You're now a member of the team.</p>
            <button
              onClick={() => navigate("/teams")}
              className="mt-6 flex items-center justify-center gap-2 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Users className="h-4 w-4" />
              Go to teams
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-red-400" />
            <h2 className="mt-4 text-lg font-semibold text-white">Invitation failed</h2>
            <p className="mt-2 text-sm text-zinc-400">{message}</p>
            <Link
              to="/auth/sign-in"
              className="mt-6 inline-block rounded-lg bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Sign in to continue
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
