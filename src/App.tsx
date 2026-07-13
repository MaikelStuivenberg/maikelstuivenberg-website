import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ContactPage } from "@/pages/ContactPage";
import { HomePage } from "@/pages/HomePage";
import { PrivacyPage } from "@/pages/PrivacyPage";

export function App() {
  return (
    <Routes>
      <Route index element={<Navigate to="/home" replace />} />
      <Route path="home" element={<HomePage />} />
      <Route element={<AppShell />}>
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="contact" element={<ContactPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
