import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import LandingPage from "./pages/LandingPage";
import { DashboardLayout } from "./components/dashboard/Layout";
import DashboardOverview from "./pages/DashboardOverview";
import ConversationsPage from "./pages/ConversationsPage";
import ConversationDetail from "./pages/ConversationDetail";
import CostsPage from "./pages/CostsPage";
import ToolsPage from "./pages/ToolsPage";
import ModelsPage from "./pages/ModelsPage";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="conversations" element={<ConversationsPage />} />
          <Route path="conversations/:id" element={<ConversationDetail />} />
          <Route path="costs" element={<CostsPage />} />
          <Route path="tools" element={<ToolsPage />} />
          <Route path="models" element={<ModelsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
