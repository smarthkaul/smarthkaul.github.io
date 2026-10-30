import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";

// ColdOpen (components/court/ColdOpen.jsx) is deliberately not rendered on the
// isometric prototype: it draws the top-down court and walks the player to a
// baseline position that no longer exists. Re-cut it for the isometric court
// before mounting it again.
const Layout = () => (
  <>
    <Navbar />
    <main className="court-turf min-h-screen">
      <Outlet />
    </main>
    <Footer />
  </>
);

export default Layout;
