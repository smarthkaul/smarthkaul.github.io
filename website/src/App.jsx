import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Layout from "./pages/Layout";
import CourtStage from "./pages/CourtStage";
import Pagenotfound from "./pages/Pagenotfound";
import { SECTIONS } from "./data/sections";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<CourtStage />} />
          {SECTIONS.map((s) => (
            <Route key={s.id} path={s.id} element={<CourtStage />} />
          ))}
          <Route path="*" element={<Pagenotfound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
