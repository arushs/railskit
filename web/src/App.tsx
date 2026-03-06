import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "./contexts/AuthContext";
import { TeamProvider } from "./contexts/TeamContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SignInPage } from "./pages/auth/SignInPage";
import { SignUpPage } from "./pages/auth/SignUpPage";
import { MagicLinkPage } from "./pages/auth/MagicLinkPage";
import { MagicLinkVerifyPage } from "./pages/auth/MagicLinkVerifyPage";
import { OAuthCallbackPage } from "./pages/auth/OAuthCallbackPage";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import RagPage from "./pages/dashboard/RagPage";
import { TeamsListPage } from "./pages/teams/TeamsListPage";
import { TeamSettingsPage } from "./pages/teams/TeamSettingsPage";
import { AcceptInvitationPage } from "./pages/teams/AcceptInvitationPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TeamProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth/sign-in" element={<SignInPage />} />
          <Route path="/auth/sign-up" element={<SignUpPage />} />
          <Route path="/auth/magic-link" element={<MagicLinkPage />} />
          <Route path="/auth/magic-link/verify" element={<MagicLinkVerifyPage />} />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* RAG Pipeline */}
          <Route
            path="/agents/rag"
            element={
              <ProtectedRoute>
                <RagPage />
              </ProtectedRoute>
            }
          />

          {/* Teams */}
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <TeamsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/:teamId/settings"
            element={
              <ProtectedRoute>
                <TeamSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/invitations/:token" element={<AcceptInvitationPage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </TeamProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
