import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import TODO from "./pages/TODO";
import Layout from "./pages/Layout";
import Pagenotfound from "./pages/Pagenotfound";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="todo" element={<TODO />} />
          <Route path="*" element={<Pagenotfound />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
