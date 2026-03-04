import { useState, type FormEvent } from "react";
import { Navigate, Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import config from "@/config";

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await signIn(email, password); if (!result.ok) throw new Error(result.error);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md dark:bg-zinc-900/50 bg-white">
        <CardHeader className="p-6 text-center">
          <CardTitle className="text-2xl text-zinc-900 dark:text-white">
            Sign in to {config.app.name}
          </CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Enter your credentials to access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in\u2026" : "Sign In"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
