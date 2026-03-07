import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { teamsApi } from "@/lib/teams-api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);

  async function handleAccept() {
    if (!token) return;
    setAccepting(true);
    setError(null);
    try {
      const res = await teamsApi.acceptInvitation(token);
      if (res.ok) {
        setAccepted(true);
        setTeamName(res.data.team.name);
        // Redirect to teams after a moment
        setTimeout(() => navigate("/teams"), 2000);
      } else {
        const errData = res.data as unknown as { error?: string };
        setError(errData.error || "Failed to accept invitation");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setAccepting(false);
    }
  }

  // Auto-accept if user is authenticated
  useEffect(() => {
    if (!authLoading && user && token && !accepted && !error) {
      handleAccept();
    }
  }, [authLoading, user, token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  // Not authenticated — prompt to sign in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <Card className="w-full max-w-md dark:bg-zinc-900/50 bg-white">
          <CardHeader className="text-center p-6">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 rounded-full bg-theme-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-theme-primary" />
              </div>
            </div>
            <CardTitle className="text-zinc-900 dark:text-white">
              Team Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 text-center space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Sign in to accept this invitation and join the team.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                to={`/auth/sign-in?redirect=/invitations/${token}`}
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-xl bg-theme-primary text-white hover:bg-theme-accent shadow-lg transition-all"
              >
                Sign In
              </Link>
              <Link
                to={`/auth/sign-up?redirect=/invitations/${token}`}
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-xl bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 transition-all"
              >
                Create Account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md dark:bg-zinc-900/50 bg-white">
        <CardHeader className="text-center p-6">
          <div className="flex justify-center mb-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                accepted
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : error
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-theme-primary/10"
              }`}
            >
              {accepted ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              ) : error ? (
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              ) : accepting ? (
                <Loader2 className="w-6 h-6 animate-spin text-theme-primary" />
              ) : (
                <Users className="w-6 h-6 text-theme-primary" />
              )}
            </div>
          </div>
          <CardTitle className="text-zinc-900 dark:text-white">
            {accepted
              ? "You're In!"
              : error
              ? "Invitation Error"
              : "Joining Team…"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 text-center space-y-4">
          {accepted ? (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                You've joined <span className="font-medium text-zinc-900 dark:text-white">{teamName}</span>.
                Redirecting…
              </p>
              <Link
                to="/teams"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-xl bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 transition-all"
              >
                Go to Teams
              </Link>
            </>
          ) : error ? (
            <>
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
              <Link
                to="/teams"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-xl bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 transition-all"
              >
                Go to Teams
              </Link>
            </>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Accepting invitation…
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
