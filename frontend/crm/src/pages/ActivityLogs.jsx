import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

const ACTION_BADGE = {
  CREATE: "badge-green",
  UPDATE: "badge-yellow",
  DELETE: "badge-red",
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterAction, setFilterAction] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [search, setSearch] = useState("");

  const PAGE_SIZE = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, page_size: PAGE_SIZE });
      if (filterAction) params.set("action", filterAction);
      if (filterModel) params.set("model", filterModel);
      if (search) params.set("search", search);
      const res = await api.get(`/logs/?${params}`);
      setLogs(res.data.results || []);
      setCount(res.data.count || 0);
    } catch {
      setError("Failed to load activity logs.");
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterModel, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(count / PAGE_SIZE);

  // Visible page window (max 5)
  const pageWindow = () => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i).filter((p) => p >= 1 && p <= totalPages);
  };

  return (
    <>
      <Navbar />
      <main className="page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Activity Logs</h1>
            <p className="page-sub">{count} log entr{count !== 1 ? "ies" : "y"}</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem", marginBottom: "1rem" }}>
          <input
            className="input"
            style={{ flex: "1 1 200px" }}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍  Search by user, model…"
          />
          <select
            className="input"
            style={{ flex: "0 1 160px" }}
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
          </select>
          <select
            className="input"
            style={{ flex: "0 1 160px" }}
            value={filterModel}
            onChange={(e) => { setFilterModel(e.target.value); setPage(1); }}
          >
            <option value="">All Models</option>
            <option value="Company">Company</option>
            <option value="Contact">Contact</option>
          </select>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        {/* Table card */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
              <span className="spinner" style={{ width: 32, height: 32 }} />
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3.5rem 1rem", color: "#94a3b8" }}>
              <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: ".5rem" }}>No activity logs found</p>
              <p style={{ fontSize: ".875rem" }}>Logs are created when you add, edit or delete companies and contacts.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Model</th>
                    <th>Object ID</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ color: "#94a3b8", whiteSpace: "nowrap", fontSize: ".8rem" }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 600, color: "#0f172a" }}>{log.user_name || "System"}</td>
                      <td>
                        <span className={`badge ${ACTION_BADGE[log.action] || "badge-gray"}`}>{log.action}</span>
                      </td>
                      <td style={{ color: "#64748b" }}>{log.model}</td>
                      <td style={{ color: "#94a3b8", fontFamily: "monospace" }}>#{log.object_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <span style={{ fontSize: ".8125rem", color: "#64748b" }}>
              Page {page} of {totalPages} &middot; {count} total
            </span>
            <div className="pagination-btns">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
              {pageWindow().map((pg) => (
                <button key={pg} className={`page-btn${pg === page ? " active" : ""}`} onClick={() => setPage(pg)}>
                  {pg}
                </button>
              ))}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next ›</button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

