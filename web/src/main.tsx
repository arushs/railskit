import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuthGuard from "./guards/AuthGuard";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import AgentDashboardLayout from "./components/dashboard/AgentDashboardLayout";
import LandingPage from "./pages/LandingPage";
import { SignInPage } from "./pages/auth/SignInPage";
import { SignUpPage } from "./pages/auth/SignUpPage";
import { MagicLinkPage } from "./pages/auth/MagicLinkPage";
import { MagicLinkVerifyPage } from "./pages/auth/MagicLinkVerifyPage";
import { OAuthCallbackPage } from "./pages/auth/OAuthCallbackPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import BillingPage from "./pages/BillingPage";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import ConversationList from "./pages/dashboard/ConversationList";
import ConversationView from "./pages/dashboard/ConversationView";
import CostTracking from "./pages/dashboard/CostTracking";
import ToolUsage from "./pages/dashboard/ToolUsage";
import BlogIndexPage from "./pages/BlogIndexPage";
import BlogPostPage from "./pages/BlogPostPage";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/auth/magic-link" element={<MagicLinkPage />} />
              <Route path="/auth/magic-link/verify" element={<MagicLinkVerifyPage />} />
              <Route path="/auth/callback" element={<OAuthCallbackPage />} />

              {/* Authenticated routes */}
              <Route element={<AuthGuard />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/dashboard/settings" element={<SettingsPage />} />
                  <Route path="/dashboard/billing" element={<BillingPage />} />
                </Route>
              </Route>
              {/* Agent Dashboard */}
              <Route path="/agents" element={<AgentDashboardLayout><DashboardOverview /></AgentDashboardLayout>} />
              <Route path="/agents/conversations" element={<AgentDashboardLayout><ConversationList /></AgentDashboardLayout>} />
              <Route path="/agents/conversations/:id" element={<AgentDashboardLayout><ConversationView /></AgentDashboardLayout>} />
              <Route path="/agents/costs" element={<AgentDashboardLayout><CostTracking /></AgentDashboardLayout>} />
              <Route path="/agents/tools" element={<AgentDashboardLayout><ToolUsage /></AgentDashboardLayout>} />

              {/* Blog */}
              <Route path="/blog" element={<BlogIndexPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>
);
