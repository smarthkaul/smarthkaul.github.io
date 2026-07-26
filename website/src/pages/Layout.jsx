import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ColdOpen from "../components/court/ColdOpen";
import { Outlet } from "react-router-dom";

const Layout = () => (
  <>
    <ColdOpen />
    <Navbar />
    <main className="court-turf min-h-screen">
      <Outlet />
    </main>
    <Footer />
  </>
);

export default Layout;
