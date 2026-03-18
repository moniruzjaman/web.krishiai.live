import { Routes, Route, Navigate } from "react-router-dom";
import Layout       from "./components/Layout";
import Home         from "./pages/Home";
import Chat         from "./pages/Chat";
import Analyzer     from "./pages/Analyzer";
import Tools        from "./pages/Tools";
import Learn        from "./pages/Learn";
import Profile      from "./pages/Profile";
import NotFound     from "./pages/NotFound";
import PlantHealth  from "./pages/tools/PlantHealth";
import SoilAudit    from "./pages/tools/SoilAudit";
import CropLibrary  from "./pages/tools/CropLibrary";
import Pesticide    from "./pages/tools/Pesticide";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index                     element={<Home />} />
        <Route path="chat"               element={<Chat />} />
        <Route path="analyzer"           element={<Analyzer />} />
        <Route path="tools"              element={<Tools />} />
        <Route path="tools/plant-health" element={<PlantHealth />} />
        <Route path="tools/soil"         element={<SoilAudit />} />
        <Route path="tools/crop-library" element={<CropLibrary />} />
        <Route path="tools/pesticide"    element={<Pesticide />} />
        <Route path="learn"              element={<Learn />} />
        <Route path="profile"            element={<Profile />} />
        <Route path="404"                element={<NotFound />} />
        <Route path="*"                  element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}
