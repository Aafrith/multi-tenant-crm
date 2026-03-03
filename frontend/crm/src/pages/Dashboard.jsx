import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

const STAT_ICONS = {
  companies: "🏢",
  contacts:  "👥",
  logs:      "📋",
};

function StatCard({ title, value, icon, accent, to }) {
  const inner = (
    <div className="card" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", transition: "box-shadow .18s", cursor: to ? "pointer" : "default" }}>
      <div style={{ width: 48, height: 48, borderRadius: ".75rem", background: accent + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: ".78rem", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: ".25rem" }}>{title}</p>
        <p style={{ fontSize: "2rem", fontWeight: 800, color: accent, lineHeight: 1 }}>{value ?? <span className="spinner" style={{ width: 20, height: 20, display: "inline-block" }} />}</p>
      </div>
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: "none" }}>{inner}</Link> : inner;
}

export default function Dashboard() {
  const { profile } = useContext(AuthContext);
  const [stats, setStats] = useState({ companies: null, contacts: null, logs: null });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [compRes, contactRes, logRes] = await Promise.all([
          api.get("/companies/?page_size=1"),
          api.get("/contacts/?page_size=1"),
          api.get("/logs/?page_size=5"),
        ]);
        setStats({
          companies: compRes.data.count,
          contacts: contactRes.data.count,
          logs: logRes.data.count,
        });
        setRecentLogs(logRes.data.results || []);
      } catch {
        // silent — data loads partially
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const actionBadge = (action) => {
    const cls = { CREATE: "badge-green", UPDATE: "badge-yellow", DELETE: "badge-red" };
    return <span className={`badge ${cls[action] || "badge-gray"}`}>{action}</span>;
  };

  const planColor = { FREE: "#94a3b8", PRO: "#4f46e5", ENTERPRISE: "#0ea5e9" };
  const plan = profile?.organization?.subscription_plan?.toUpperCase() || "FREE";

  return (
    <>
      <Navbar />
      <main className="page">
        {/* Welcome header */}
        <div className="page-header" style={{ paddingBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", marginBottom: "2rem" }}>
          <div>
            <h1 className="page-title">
              Welcome back, {profile?.first_name || profile?.username || "…"} 👋
            </h1>
            <p className="page-sub" style={{ marginTop: ".35rem" }}>
              {profile?.organization?.name}&ensp;
              <span style={{ display: "inline-block", background: planColor[plan] + "1a", color: planColor[plan], border: `1px solid ${planColor[plan]}44`, borderRadius: "999px", fontSize: ".72rem", fontWeight: 700, padding: ".15em .65em", textTransform: "uppercase", letterSpacing: ".06em" }}>
                {plan}
              </span>
            </p>
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
              <StatCard title="Companies"     value={stats.companies} icon={STAT_ICONS.companies} accent="#4f46e5" to="/companies" />
              <StatCard title="Contacts"      value={stats.contacts}  icon={STAT_ICONS.contacts}  accent="#0ea5e9" />
              <StatCard title="Activity Logs" value={stats.logs}      icon={STAT_ICONS.logs}      accent="#8b5cf6" to="/logs" />
            </div>

            {/* Recent activity */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Recent Activity</h2>
                <Link to="/logs" style={{ fontSize: ".82rem", color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>
                  View all →
                </Link>
              </div>

              {recentLogs.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: ".875rem", textAlign: "center", padding: "2rem 0" }}>
                  No activity recorded yet.
                </p>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {recentLogs.map((log, idx) => (
                    <li key={log.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: ".75rem 0",
                      borderTop: idx === 0 ? "none" : "1px solid #f1f5f9",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                        {actionBadge(log.action)}
                        <span style={{ fontSize: ".875rem", color: "#334155" }}>
                          <strong style={{ color: "#0f172a" }}>{log.model}</strong>
                          &nbsp;#{log.object_id}
                        </span>
                        {log.user_name && (
                          <span style={{ fontSize: ".78rem", color: "#94a3b8" }}>by {log.user_name}</span>
                        )}
                      </div>
                      <span style={{ fontSize: ".75rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}

