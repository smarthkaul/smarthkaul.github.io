import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Layout from "./pages/Layout";
import Pagenotfound from "./pages/Pagenotfound";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="*" element={<Pagenotfound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
