import { useEffect, useState, useCallback, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

const CONTACT_ROLES = ["DECISION_MAKER", "INFLUENCER", "END_USER", "OTHER"];

const ROLE_BADGE = {
  DECISION_MAKER: "badge-purple",
  INFLUENCER:     "badge-blue",
  END_USER:       "badge-green",
  OTHER:          "badge-gray",
};

export default function Contacts() {
  const { profile } = useContext(AuthContext);
  const [contacts, setContacts] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const PAGE_SIZE = 15;

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, page_size: PAGE_SIZE });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      const res = await api.get(`/contacts/?${params}`);
      setContacts(res.data.results || []);
      setCount(res.data.count || 0);
    } catch {
      setError("Failed to load contacts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const totalPages = Math.ceil(count / PAGE_SIZE);

  const pageWindow = () => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i)
      .filter((p) => p >= 1 && p <= totalPages);
  };

  return (
    <>
      <Navbar />
      <main className="page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Contacts</h1>
            <p className="page-sub">{count} contact{count !== 1 ? "s" : ""} across all companies</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem", marginBottom: "1rem" }}>
          <input
            className="input"
            style={{ flex: "1 1 200px" }}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍  Search by name or email…"
          />
          <select
            className="input"
            style={{ flex: "0 1 180px" }}
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Roles</option>
            {CONTACT_ROLES.map((r) => (
              <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        {/* Table card */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
              <span className="spinner" style={{ width: 32, height: 32 }} />
            </div>
          ) : contacts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3.5rem 1rem", color: "#94a3b8" }}>
              <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: ".5rem" }}>No contacts found</p>
              <p style={{ fontSize: ".875rem" }}>Try adjusting your search or add contacts via a company page.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Company</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: "#0f172a" }}>{c.full_name}</td>
                      <td style={{ color: "#4f46e5" }}>{c.email}</td>
                      <td style={{ color: "#94a3b8" }}>{c.phone || "—"}</td>
                      <td>
                        <span className={`badge ${ROLE_BADGE[c.role] || "badge-gray"}`}>
                          {c.role?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        {c.company ? (
                          <Link
                            to={`/companies/${c.company}`}
                            style={{ color: "#4f46e5", textDecoration: "none", fontWeight: 500, fontSize: ".875rem" }}
                          >
                            {c.company_name || `Company #${c.company}`}
                          </Link>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>
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
