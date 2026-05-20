import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import { PageSkeleton } from "./components/LoadingSkeleton";

const Home = lazy(() => import("./pages/Home"));
const Chat = lazy(() => import("./pages/Chat"));
const Analyzer = lazy(() => import("./pages/Analyzer"));
const Tools = lazy(() => import("./pages/Tools"));
const Learn = lazy(() => import("./pages/Learn"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PlantHealth = lazy(() => import("./pages/tools/PlantHealth"));
const SoilAudit = lazy(() => import("./pages/tools/SoilAudit"));
const CropLibrary = lazy(() => import("./pages/tools/CropLibrary"));
const Pesticide = lazy(() => import("./pages/tools/Pesticide"));

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="chat" element={<Chat />} />
            <Route path="analyzer" element={<Analyzer />} />
            <Route path="tools" element={<Tools />} />
            <Route path="tools/plant-health" element={<PlantHealth />} />
            <Route path="tools/soil" element={<SoilAudit />} />
            <Route path="tools/crop-library" element={<CropLibrary />} />
            <Route path="tools/pesticide" element={<Pesticide />} />
            <Route path="learn" element={<Learn />} />
            <Route path="profile" element={<Profile />} />
            <Route path="404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
