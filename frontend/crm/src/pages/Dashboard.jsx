import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

function StatCard({ title, value, color, to }) {
  const content = (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${to ? "hover:shadow-md transition-shadow cursor-pointer" : ""}`}>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value ?? "—"}</p>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
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
        // silent fail — data might load partially
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const actionBadge = (action) => {
    const map = {
      CREATE: "bg-green-100 text-green-700",
      UPDATE: "bg-yellow-100 text-yellow-700",
      DELETE: "bg-red-100 text-red-700",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[action] || "bg-gray-100 text-gray-600"}`}>
        {action}
      </span>
    );
  };

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {profile?.first_name || profile?.username}
          </h1>
          <p className="text-gray-500 mt-1">
            {profile?.organization?.name} &middot;{" "}
            <span className="font-medium text-blue-600 capitalize">
              {profile?.organization?.subscription_plan}
            </span>{" "}
            plan
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard title="Total Companies" value={stats.companies} color="text-blue-700" to="/companies" />
              <StatCard title="Total Contacts" value={stats.contacts} color="text-green-700" />
              <StatCard title="Activity Logs" value={stats.logs} color="text-purple-700" to="/logs" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                <Link to="/logs" className="text-blue-600 text-sm hover:underline">
                  View all →
                </Link>
              </div>
              {recentLogs.length === 0 ? (
                <p className="text-gray-400 text-sm">No activity recorded yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {recentLogs.map((log) => (
                    <li key={log.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {actionBadge(log.action)}
                        <span className="text-sm text-gray-700">
                          <span className="font-medium">{log.model}</span> #{log.object_id}
                        </span>
                        {log.user_name && (
                          <span className="text-xs text-gray-400">by {log.user_name}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
