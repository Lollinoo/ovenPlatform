// Navigation bar component for the application
// Provides responsive navigation with mobile menu support
import { useState } from "react";
import "../styles/theme.css";
import "../styles/Navbar.css";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <a href="/">OvenPlatform</a>
        </div>

        <div className="navbar-toggle" onClick={toggleMenu}>
          <span className={`toggle-icon ${isOpen ? "open" : ""}`}></span>
        </div>

        <ul className={`navbar-menu ${isOpen ? "active" : ""}`}>
          <li className="navbar-item">
            <a href="/" className="navbar-link">
              Streams
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
