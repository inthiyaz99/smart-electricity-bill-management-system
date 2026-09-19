import { Link, useNavigate, useLocation } from "react-router-dom"
import { useState } from "react"
import { Icons } from "./Icons"

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = JSON.parse(localStorage.getItem("smartbillUser"))

  const handleLogout = async () => {
    if (user) {
      try {
        await fetch(
          `http://localhost:8080/api/users/logout/${user.id}`,
          {
            method: "POST"
          }
        )
      } catch (error) {
        console.error(error)
      }
    }

    localStorage.removeItem("smartbillUser")
    navigate("/login")
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="brand-icon-wrapper">
          <Icons.Bolt size={24} />
        </div>
        <div className="brand-text-container">
          <h2>SmartBill</h2>
          <span className="brand-badge">ENERGY OS</span>
        </div>
      </Link>

      <div className={`navbar-links ${mobileOpen ? "mobile-open" : ""}`}>
        {user ? (
          <>
            <Link
              to="/"
              className={`nav-link ${isActive("/") ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icons.Activity size={16} />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/meter"
              className={`nav-link ${isActive("/meter") ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icons.Gauge size={16} />
              <span>My Meter</span>
            </Link>

            <Link
              to="/readings"
              className={`nav-link ${isActive("/readings") ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icons.Layers size={16} />
              <span>Readings</span>
            </Link>

            <Link
              to="/bills"
              className={`nav-link ${isActive("/bills") ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icons.Receipt size={16} />
              <span>Bills</span>
            </Link>

            <Link
              to="/profile"
              className={`nav-link ${isActive("/profile") ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icons.User size={16} />
              <span>Profile</span>
            </Link>

            <Link
              to="/login-history"
              className={`nav-link ${isActive("/login-history") ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icons.History size={16} />
              <span>History</span>
            </Link>

            <button
              className="logout-btn"
              onClick={handleLogout}
              type="button"
            >
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className={`nav-link ${isActive("/login") ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>

            <Link
              to="/register"
              className={`nav-link ${isActive("/register") ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              Register
            </Link>
          </>
        )}
      </div>

      <div className="nav-right-cluster">
        {user && (
          <div className="nav-status-chip">
            <span className="status-dot-pulse"></span>
            <span>Grid Online</span>
          </div>
        )}

        <button
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          type="button"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <Icons.X size={20} /> : <Icons.Menu size={20} />}
        </button>
      </div>
    </nav>
  )
}

export default Navbar