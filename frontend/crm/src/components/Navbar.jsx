import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ROLE_BADGE = {
  ADMIN:   { bg: "#ede9fe", color: "#6d28d9", label: "Admin" },
  MANAGER: { bg: "#dbeafe", color: "#1d4ed8", label: "Manager" },
  STAFF:   { bg: "#dcfce7", color: "#15803d", label: "Staff" },
};

const BASE_NAV = [
  { to: "/",          label: "Dashboard",     icon: "⊞",  roles: ["ADMIN","MANAGER","STAFF"] },
  { to: "/companies", label: "Companies",     icon: "🏢",  roles: ["ADMIN","MANAGER","STAFF"] },
  { to: "/contacts",  label: "Contacts",      icon: "👥",  roles: ["ADMIN","MANAGER","STAFF"] },
  { to: "/users",     label: "Users",         icon: "🔑",  roles: ["ADMIN"] },
  { to: "/logs",      label: "Activity Logs", icon: "📋",  roles: ["ADMIN","MANAGER"] },
];

export default function Navbar() {
  const { logout, profile, role } = useContext(AuthContext);
  const navigate = useNavigate();

  const roleBadge = ROLE_BADGE[role] || ROLE_BADGE.STAFF;
  const initials = (profile?.first_name?.[0] || profile?.username?.[0] || "U").toUpperCase();
  const navItems = BASE_NAV.filter((item) => !role || item.roles.includes(role));

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <header style={{
      background: "#fff",
      borderBottom: "1.5px solid #e2e8f0",
      position: "sticky",
      top: 0,
      zIndex: 40,
    }}>
      <div style={{
        maxWidth: "80rem",
        margin: "0 auto",
        padding: "0 1.5rem",
        height: "3.75rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.5rem",
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: ".625rem", flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32,
            background: "#4f46e5",
            borderRadius: ".5rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: ".9rem",
          }}>🏢</div>
          <span style={{ fontWeight: 700, fontSize: "1.0625rem", color: "#0f172a", letterSpacing: "-.01em" }}>
            CRM<span style={{ color: "#4f46e5" }}>System</span>
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ display: "flex", gap: ".25rem", flex: 1, justifyContent: "center" }}>
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              style={({ isActive }) => ({
                display: "inline-flex",
                alignItems: "center",
                gap: ".375rem",
                padding: ".4rem .875rem",
                borderRadius: ".5rem",
                fontSize: ".875rem",
                fontWeight: 500,
                textDecoration: "none",
                transition: "background .15s, color .15s",
                background: isActive ? "#ede9fe" : "transparent",
                color: isActive ? "#4f46e5" : "#64748b",
              })}
            >
              <span style={{ fontSize: ".9375rem" }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right: user + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: ".875rem", flexShrink: 0 }}>
          {profile && (
            <div style={{ display: "flex", alignItems: "center", gap: ".625rem" }}>
              {/* Avatar */}
              <div style={{
                width: 34, height: 34,
                background: "#ede9fe",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#4338ca", fontWeight: 700, fontSize: ".875rem",
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ lineHeight: 1.35 }}>
                <div style={{ fontSize: ".875rem", fontWeight: 600, color: "#0f172a" }}>
                  {profile.first_name
                    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
                    : profile.username}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: ".375rem", marginTop: ".1rem" }}>
                  <span style={{
                    fontSize: ".6875rem", fontWeight: 600,
                    padding: ".1rem .45rem", borderRadius: "9999px",
                    background: roleBadge.bg, color: roleBadge.color,
                    letterSpacing: ".02em",
                  }}>{roleBadge.label}</span>
                  <span style={{ fontSize: ".75rem", color: "#94a3b8" }}>
                    {profile.organization?.name}
                  </span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            style={{
              display: "inline-flex", alignItems: "center", gap: ".3rem",
              padding: ".4rem .875rem",
              border: "1.5px solid #e2e8f0",
              borderRadius: ".5rem",
              background: "transparent",
              color: "#64748b",
              fontSize: ".8125rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background .15s, color .15s, border-color .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fecaca"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
          >
            ⏻ Logout
          </button>
        </div>
      </div>
    </header>
  );
}

