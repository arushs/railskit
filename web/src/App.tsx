import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SignInPage } from "./pages/auth/SignInPage";
import { SignUpPage } from "./pages/auth/SignUpPage";
import { MagicLinkPage } from "./pages/auth/MagicLinkPage";
import { MagicLinkVerifyPage } from "./pages/auth/MagicLinkVerifyPage";
import { OAuthCallbackPage } from "./pages/auth/OAuthCallbackPage";
import { DashboardPage } from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import RagPage from "./pages/dashboard/RagPage";
import AdminPage from "./pages/AdminPage";
import TeamsPage from "./pages/TeamsPage";
import TeamSettingsPage from "./pages/TeamSettingsPage";
import AcceptInvitationPage from "./pages/AcceptInvitationPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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

{/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
{/* Teams */}
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <TeamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/:id/settings"
            element={
              <ProtectedRoute>
                <TeamSettingsPage />
              </ProtectedRoute>
            }
          />


{/* Invitation Accept (semi-public — shows sign-in if not authed) */}
          <Route path="/invitations/:token" element={<AcceptInvitationPage />} />
          {/* RAG Pipeline */}
          <Route
            path="/agents/rag"
            element={
              <ProtectedRoute>
                <RagPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
