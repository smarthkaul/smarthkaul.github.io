import { Link } from "react-router-dom";
import SectionMenu from "./court/SectionMenu";

const Navbar = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-wimbledon/80 backdrop-blur-md border-b border-wimbledon-dark">
    <nav className="flex items-center justify-between h-16 px-6 sm:px-12 lg:px-24">
      <Link
        to="/"
        className="font-display font-bold text-cream text-lg tracking-tight hover:text-ball transition-colors"
      >
        SK
      </Link>
      <SectionMenu />
    </nav>
  </header>
);

export default Navbar;
