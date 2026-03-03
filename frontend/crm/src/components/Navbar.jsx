import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { logout, profile } = useContext(AuthContext);
  const location = useLocation();

  const navLink = (to, label) => {
    const active = location.pathname === to || location.pathname.startsWith(to + "/");
    return (
      <Link
        to={to}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          active
            ? "bg-blue-800 text-white"
            : "text-blue-100 hover:bg-blue-700 hover:text-white"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-blue-700 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-white font-bold text-lg tracking-wide">
            CRM System
          </span>
          <div className="flex gap-1">
            {navLink("/", "Dashboard")}
            {navLink("/companies", "Companies")}
            {navLink("/logs", "Activity Logs")}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {profile && (
            <div className="text-right">
              <p className="text-white text-sm font-medium">
                {profile.first_name || profile.username}
              </p>
              <p className="text-blue-200 text-xs">
                {profile.role} &mdash; {profile.organization?.name}
              </p>
            </div>
          )}
          <button
            onClick={logout}
            className="bg-blue-800 hover:bg-blue-900 text-white text-sm px-3 py-1.5 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
