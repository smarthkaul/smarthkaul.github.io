import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Layout from "./pages/Layout";
import CourtStage from "./pages/CourtStage";
import Pagenotfound from "./pages/Pagenotfound";
import { SECTIONS } from "./data/sections";

// Lazy so the Firebase SDK it pulls in only downloads on the Reviews page.
const Reviews = lazy(() => import("./pages/Reviews"));

const reviews = (mode) => (
  <Suspense fallback={<div className="min-h-screen court-turf" />}>
    <Reviews mode={mode} />
  </Suspense>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<CourtStage />} />
          {SECTIONS.map((s) => (
            <Route key={s.id} path={s.id} element={<CourtStage />} />
          ))}
          <Route path="projects/:slug" element={<CourtStage />} />
          <Route path="reviews" element={reviews("list")} />
          <Route path="reviews/new" element={reviews("new")} />
          <Route path="reviews/:id" element={reviews("detail")} />
          <Route path="reviews/:id/edit" element={reviews("edit")} />
          <Route path="*" element={<Pagenotfound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
