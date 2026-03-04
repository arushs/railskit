import { useEffect, useState } from "react";
import { healthCheck } from "./lib/api";

function App() {
  const [health, setHealth] = useState<{
    status: string;
    timestamp: string;
    version: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    healthCheck()
      .then((res) => {
        if (res.ok) setHealth(res.data);
        else setError("API returned an error");
      })
      .catch(() => setError("Could not connect to API"));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">🚀 RailsKit</h1>
        <p className="text-zinc-400">Rails 8 API + React + Vite</p>
        <div className="mt-8 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <h2 className="text-sm font-mono text-zinc-500 mb-2">API Health</h2>
          {health ? (
            <div className="space-y-1 text-sm">
              <p>
                Status:{" "}
                <span className="text-green-400 font-semibold">{health.status}</span>
              </p>
              <p className="text-zinc-500">Rails {health.version}</p>
              <p className="text-zinc-600 text-xs">{health.timestamp}</p>
            </div>
          ) : error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : (
            <p className="text-zinc-500 text-sm">Checking...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
