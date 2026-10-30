import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";

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
