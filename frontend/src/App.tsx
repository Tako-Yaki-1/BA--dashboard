import { Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import DataManager from "./pages/DataManager";
import Dashboard from "./pages/Dashboard";
import Descriptive from "./pages/Descriptive";
import Predictive from "./pages/Predictive";
import Prescriptive from "./pages/Prescriptive";
import CaseStudy from "./pages/CaseStudy";
import RatingSheet from "./pages/RatingSheet";
import About from "./pages/About";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="case-study" element={<CaseStudy />} />
        <Route path="descriptive" element={<Descriptive />} />
        <Route path="predictive" element={<Predictive />} />
        <Route path="prescriptive" element={<Prescriptive />} />
        <Route path="data" element={<DataManager />} />
        <Route path="rating-sheet" element={<RatingSheet />} />
        <Route path="about" element={<About />} />
      </Route>
    </Routes>
  );
}
