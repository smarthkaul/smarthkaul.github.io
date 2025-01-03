import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
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
          <Route index element={<Home />}></Route>
          <Route path="todo" element={<TODO />}></Route>
          <Route path="*" element={<Pagenotfound />}></Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
