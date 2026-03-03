import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

function StatCard({ title, value, icon, accent, to }) {
  const inner = (
    <div className="card" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", transition: "box-shadow .18s", cursor: to ? "pointer" : "default" }}>
      <div style={{ width: 48, height: 48, borderRadius: ".75rem", background: accent + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: ".78rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: ".25rem" }}>{title}</p>
        <p style={{ fontSize: "2rem", fontWeight: 800, color: accent, lineHeight: 1 }}>
          {value ?? <span className="spinner" style={{ width: 20, height: 20, display: "inline-block" }} />}
        </p>
      </div>
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: "none" }}>{inner}</Link> : inner;
}

const QUICK_ACTIONS = {
  ADMIN: [
    { to: "/companies", label: "Manage Companies", desc: "Add, edit, or delete companies",  icon: "🏢", color: "#4f46e5" },
    { to: "/contacts",  label: "Manage Contacts",  desc: "Add, edit contacts across org",   icon: "👥", color: "#0ea5e9" },
    { to: "/users",     label: "Manage Users",     desc: "Add team members & assign roles", icon: "🔑", color: "#7c3aed" },
    { to: "/logs",      label: "Activity Logs",    desc: "Audit every create/edit/delete",  icon: "📋", color: "#8b5cf6" },
  ],
  MANAGER: [
    { to: "/companies", label: "Manage Companies", desc: "Add or edit companies",           icon: "🏢", color: "#4f46e5" },
    { to: "/contacts",  label: "Manage Contacts",  desc: "Add or edit contacts",            icon: "👥", color: "#0ea5e9" },
    { to: "/logs",      label: "Activity Logs",    desc: "View audit trail",                icon: "📋", color: "#8b5cf6" },
  ],
  STAFF: [
    { to: "/companies", label: "View Companies",   desc: "Browse company directory",        icon: "🏢", color: "#4f46e5" },
    { to: "/contacts",  label: "View Contacts",    desc: "Browse contact directory",        icon: "👥", color: "#0ea5e9" },
  ],
};

const STAFF_ACCESS = [
  { label: "View Companies",     allowed: true  },
  { label: "View Contacts",      allowed: true  },
  { label: "Add / Edit Records", allowed: false },
  { label: "Delete Records",     allowed: false },
  { label: "View Audit Logs",    allowed: false },
  { label: "Manage Users",       allowed: false },
];

export default function Dashboard() {
  const { profile, role } = useContext(AuthContext);
  const [stats, setStats] = useState({ companies: null, contacts: null, logs: null, users: null });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const isAdmin   = role === "ADMIN";
        const isManager = role === "MANAGER";

        const [compRes, contactRes] = await Promise.all([
          api.get("/companies/?page_size=1"),
          api.get("/contacts/?page_size=1"),
        ]);

        let logCount   = null;
        let logResults = [];
        let userCount  = null;

        if (isAdmin || isManager) {
          const logRes = await api.get("/logs/?page_size=5");
          logCount   = logRes.data.count;
          logResults = logRes.data.results || [];
        }
        if (isAdmin) {
          const userRes = await api.get("/users/");
          const items = userRes.data.results ?? userRes.data;
          userCount = Array.isArray(items) ? items.length : null;
        }

        setStats({
          companies: compRes.data.count,
          contacts:  contactRes.data.count,
          logs:      logCount,
          users:     userCount,
        });
        setRecentLogs(logResults);
      } catch {
        // partial load — silent
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [role]);

  const actionBadge = (action) => {
    const cls = { CREATE: "badge-green", UPDATE: "badge-yellow", DELETE: "badge-red" };
    return <span className={`badge ${cls[action] || "badge-gray"}`}>{action}</span>;
  };

  const planColor = { FREE: "#94a3b8", PRO: "#4f46e5", ENTERPRISE: "#0ea5e9" };
  const plan = profile?.organization?.subscription_plan?.toUpperCase() || "FREE";
  const quickActions = QUICK_ACTIONS[role] || QUICK_ACTIONS.STAFF;
  const roleColor = role === "ADMIN" ? "#6d28d9" : role === "MANAGER" ? "#1d4ed8" : "#15803d";

  return (
    <>
      <Navbar />
      <main className="page">
        {/* Welcome header */}
        <div className="page-header" style={{ paddingBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", marginBottom: "2rem" }}>
          <div>
            <h1 className="page-title">
              Welcome back, {profile?.first_name || profile?.username || "..."} 👋
            </h1>
            <p className="page-sub" style={{ marginTop: ".35rem" }}>
              {profile?.organization?.name}&ensp;
              <span style={{ display: "inline-block", background: planColor[plan] + "1a", color: planColor[plan], border: `1px solid ${planColor[plan]}44`, borderRadius: "999px", fontSize: ".72rem", fontWeight: 700, padding: ".15em .65em", textTransform: "uppercase", letterSpacing: ".06em" }}>
                {plan}
              </span>
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem", padding: ".5rem 1rem", background: "#f8fafc", borderRadius: ".75rem", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: ".75rem", color: "#94a3b8" }}>Signed in as</span>
            <span style={{ fontSize: ".8125rem", fontWeight: 700, color: roleColor }}>{role}</span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: "4rem" }}>
            <span className="spinner" style={{ width: 36, height: 36 }} />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
              <StatCard title="Companies"     value={stats.companies} icon="🏢" accent="#4f46e5" to="/companies" />
              <StatCard title="Contacts"      value={stats.contacts}  icon="👥" accent="#0ea5e9" to="/contacts" />
              {(role === "ADMIN" || role === "MANAGER") && (
                <StatCard title="Activity Logs" value={stats.logs}   icon="📋" accent="#8b5cf6" to="/logs" />
              )}
              {role === "ADMIN" && (
                <StatCard title="Team Members"  value={stats.users}  icon="🔑" accent="#7c3aed" to="/users" />
              )}
            </div>

            {/* Quick actions */}
            <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>Quick Actions</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                {quickActions.map((a) => (
                  <Link key={a.to} to={a.to} style={{ textDecoration: "none" }}>
                    <div
                      style={{ display: "flex", alignItems: "flex-start", gap: ".75rem", padding: "1rem", borderRadius: ".75rem", border: "1px solid #e2e8f0", transition: "border-color .15s, box-shadow .15s", cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.boxShadow = `0 0 0 3px ${a.color}18`; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: ".5rem", background: a.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                        {a.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: ".875rem", fontWeight: 700, color: "#0f172a", marginBottom: ".2rem" }}>{a.label}</div>
                        <div style={{ fontSize: ".75rem", color: "#94a3b8", lineHeight: 1.4 }}>{a.desc}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent activity — ADMIN and MANAGER only */}
            {(role === "ADMIN" || role === "MANAGER") && (
              <div className="card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                  <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Recent Activity</h2>
                  <Link to="/logs" style={{ fontSize: ".82rem", color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>View all →</Link>
                </div>
                {recentLogs.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: ".875rem", textAlign: "center", padding: "2rem 0" }}>No activity recorded yet.</p>
                ) : (
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {recentLogs.map((log, idx) => (
                      <li key={log.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: ".75rem 0", borderTop: idx === 0 ? "none" : "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                          {actionBadge(log.action)}
                          <span style={{ fontSize: ".875rem", color: "#334155" }}>
                            <strong style={{ color: "#0f172a" }}>{log.model}</strong>&nbsp;#{log.object_id}
                          </span>
                          {log.user_name && <span style={{ fontSize: ".78rem", color: "#94a3b8" }}>by {log.user_name}</span>}
                        </div>
                        <span style={{ fontSize: ".75rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* STAFF: access level info */}
            {role === "STAFF" && (
              <div className="card" style={{ padding: "1.5rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginBottom: ".75rem" }}>Your Access Level</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: ".75rem" }}>
                  {STAFF_ACCESS.map(({ label, allowed }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: ".5rem", padding: ".625rem .875rem", borderRadius: ".625rem", background: allowed ? "#f0fdf4" : "#fef2f2", border: `1px solid ${allowed ? "#bbf7d0" : "#fecaca"}` }}>
                      <span>{allowed ? "✅" : "🚫"}</span>
                      <span style={{ fontSize: ".8125rem", fontWeight: 500, color: allowed ? "#15803d" : "#dc2626" }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
