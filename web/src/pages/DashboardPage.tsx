import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router";

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth/sign-in");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="text-sm text-zinc-400 hover:text-white transition"
          >
            Sign out
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="flex items-center gap-4">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                {user?.name?.[0] || user?.email[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium">{user?.name || "No name set"}</p>
              <p className="text-sm text-zinc-400">{user?.email}</p>
            </div>
          </div>
          <div className="text-sm text-zinc-500">
            Plan: <span className="text-zinc-300 capitalize">{user?.plan}</span>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">🎉 Auth is working!</h2>
          <p className="text-zinc-400 text-sm">
            This is a protected route. You're seeing it because you're authenticated.
          </p>
        </div>
      </div>
    </div>
  );
}
