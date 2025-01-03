import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header>
      <Link to="/">
        <li>Home</li>
      </Link>
      <Link to="/TODO">
        <li>To DO</li>
      </Link>
    </header>
  );
};

export default Navbar;
