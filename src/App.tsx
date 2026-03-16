import { Routes, Route, Navigate } from "react-router-dom";
import Layout   from "./components/Layout";
import Home     from "./pages/Home";
import Chat     from "./pages/Chat";
import Analyzer from "./pages/Analyzer";
import NotFound from "./pages/NotFound";

// Placeholder pages for nav routes not yet built
const Soon = ({ title }: { title: string }) => (
  <div style={{ padding: 24, textAlign: "center", color: "#6b7280", paddingTop: 60 }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>🚧</div>
    <div style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 13 }}>শীঘ্রই আসছে…</div>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index           element={<Home />} />
        <Route path="chat"     element={<Chat />} />
        <Route path="analyzer" element={<Analyzer />} />
        <Route path="learn"    element={<Soon title="কৃষি শিখন কেন্দ্র" />} />
        <Route path="profile"  element={<Soon title="প্রোফাইল" />} />
        <Route path="404"      element={<NotFound />} />
        <Route path="*"        element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}
