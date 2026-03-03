import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

const ACTION_COLORS = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 text-red-700",
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

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString();
  };

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Activity Logs</h1>
          <p className="text-gray-500 text-sm">{count} log entr{count !== 1 ? "ies" : "y"}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by user, action..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
          </select>
          <select
            value={filterModel}
            onChange={(e) => { setFilterModel(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Models</option>
            <option value="Company">Company</option>
            <option value="Contact">Contact</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* Logs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No activity logs found</p>
              <p className="text-sm mt-1">Logs are created when you add, edit or delete companies and contacts.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Model</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Object ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {log.user_name || "System"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-600"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{log.model}</td>
                    <td className="px-4 py-3 text-gray-500">#{log.object_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} &middot; {count} total entries
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page - 2 + i;
                if (pg > totalPages) return null;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${
                      pg === page
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
