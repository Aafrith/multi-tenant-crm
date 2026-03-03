import { useEffect, useState, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Education", "Other"];

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.125rem 1.5rem", borderBottom: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem", lineHeight: 1, color: "#94a3b8", padding: ".2rem .4rem", borderRadius: ".4rem" }}>×</button>
        </div>
        <div style={{ padding: "1.5rem" }}>{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children, error }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: ".8125rem", fontWeight: 600, color: "#374151", marginBottom: ".4rem" }}>{label}</label>
      {children}
      {error && <p style={{ color: "#dc2626", fontSize: ".75rem", marginTop: ".3rem" }}>{error}</p>}
    </div>
  );
}


export default function Companies() {
  const { profile, role } = useContext(AuthContext);
  const [companies, setCompanies] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const PAGE_SIZE = 10;

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, page_size: PAGE_SIZE });
      if (search) params.set("search", search);
      if (industry) params.set("industry", industry);
      const res = await api.get(`/companies/?${params}`);
      setCompanies(res.data.results || []);
      setCount(res.data.count || 0);
    } catch {
      setError("Failed to load companies. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, search, industry]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const openCreate = () => {
    setEditTarget(null);
    reset({ name: "", industry: "", country: "" });
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (company) => {
    setEditTarget(company);
    reset({ name: company.name, industry: company.industry, country: company.country });
    setFormError("");
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    setFormError("");
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("industry", data.industry);
      formData.append("country", data.country);
      if (data.logo?.[0]) formData.append("logo", data.logo[0]);

      if (editTarget) {
        await api.patch(`/companies/${editTarget.id}/`, formData);
      } else {
        await api.post("/companies/", formData);
      }
      setShowModal(false);
      fetchCompanies();
    } catch (err) {
      const msg = err.response?.data;
      setFormError(
        typeof msg === "object"
          ? Object.values(msg).flat().join(" ")
          : "Failed to save company."
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/companies/${deleteTarget.id}/`);
      setDeleteTarget(null);
      fetchCompanies();
    } catch (err) {
      alert(err.response?.data?.detail || "Delete failed.");
    }
  };

  const totalPages = Math.ceil(count / PAGE_SIZE);
  const canCreate = role === "ADMIN" || role === "MANAGER";
  const canEdit   = role === "ADMIN" || role === "MANAGER";
  const canDelete = role === "ADMIN";

  return (
    <>
      <Navbar />
      <main className="page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Companies</h1>
            <p className="page-sub">{count} record{count !== 1 ? "s" : ""}</p>
          </div>
          {canCreate && <button className="btn btn-primary" onClick={openCreate}>+ Add Company</button>}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem", marginBottom: "1rem" }}>
          <input
            className="input"
            style={{ flex: "1 1 200px" }}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍  Search companies…"
          />
          <select
            className="input"
            style={{ flex: "0 1 180px" }}
            value={industry}
            onChange={(e) => { setIndustry(e.target.value); setPage(1); }}
          >
            <option value="">All Industries</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        {/* Table card */}
        <div className="card" style={{ overflow: "hidden", padding: 0 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
              <span className="spinner" style={{ width: 32, height: 32 }} />
            </div>
          ) : companies.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3.5rem 1rem", color: "#94a3b8" }}>
              <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: ".5rem" }}>No companies found</p>
              <p style={{ fontSize: ".875rem" }}>Adjust your search or add a new company.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Logo</th>
                    <th>Name</th>
                    <th>Industry</th>
                    <th>Country</th>
                    <th>Created</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.id}>
                      <td>
                        {c.logo_url ? (
                          <img src={c.logo_url} alt={c.name} style={{ height: 32, width: 32, borderRadius: ".5rem", objectFit: "cover" }} />
                        ) : (
                          <div className="avatar" style={{ background: "#ede9fe", color: "#4f46e5" }}>
                            {c.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: "#0f172a" }}>{c.name}</td>
                      <td>
                        <span className="badge badge-purple">{c.industry}</span>
                      </td>
                      <td>{c.country}</td>
                      <td style={{ color: "#94a3b8" }}>{new Date(c.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end" }}>
                          <Link
                            to={`/companies/${c.id}`}
                            className="btn btn-ghost btn-sm"
                            style={{ textDecoration: "none", fontSize: ".75rem" }}
                          >
                            View
                          </Link>
                          {canEdit && (
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                          )}
                          {canDelete && (
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(c)}>Delete</button>
                          )}
                        </div>
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
            <span style={{ fontSize: ".8125rem", color: "#64748b" }}>Page {page} of {totalPages}</span>
            <div className="pagination-btns">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button key={pg} className={`page-btn${pg === page ? " active" : ""}`} onClick={() => setPage(pg)}>{pg}</button>
              ))}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next ›</button>
            </div>
          </div>
        )}
      </main>

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal title={editTarget ? "Edit Company" : "Add Company"} onClose={() => setShowModal(false)}>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: formError ? "1rem" : 0 }}>
            <FormField label="Company Name *" error={errors.name?.message}>
              <input className={`input${errors.name ? " input-error" : ""}`} style={{ width: "100%" }} placeholder="Acme Corp" {...register("name", { required: "Name is required" })} />
            </FormField>
            <FormField label="Industry *" error={errors.industry?.message}>
              <select className={`input${errors.industry ? " input-error" : ""}`} style={{ width: "100%" }} {...register("industry", { required: "Industry is required" })}>
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </FormField>
            <FormField label="Country *" error={errors.country?.message}>
              <input className={`input${errors.country ? " input-error" : ""}`} style={{ width: "100%" }} placeholder="United States" {...register("country", { required: "Country is required" })} />
            </FormField>
            <FormField label="Logo (optional)">
              <input type="file" accept="image/*" {...register("logo")}
                style={{ fontSize: ".8125rem", color: "#64748b", width: "100%" }}
              />
            </FormField>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: ".75rem", paddingTop: ".5rem" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : editTarget ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <Modal title="Delete Company" onClose={() => setDeleteTarget(null)}>
          <p style={{ color: "#64748b", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            Are you sure you want to delete <strong style={{ color: "#0f172a" }}>{deleteTarget.name}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: ".75rem" }}>
            <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
          </div>
        </Modal>
      )}
    </>
  );
}

