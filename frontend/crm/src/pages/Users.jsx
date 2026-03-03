import { useEffect, useState, useContext, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

const ROLES = ["ADMIN", "MANAGER", "STAFF"];

const ROLE_BADGE = {
  ADMIN:   { cls: "badge-purple", label: "Admin" },
  MANAGER: { cls: "badge-blue",   label: "Manager" },
  STAFF:   { cls: "badge-green",  label: "Staff" },
};

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

export default function Users() {
  const { role: currentRole, user: currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

  // Only ADMIN can access this page
  useEffect(() => {
    if (currentRole && currentRole !== "ADMIN") navigate("/");
  }, [currentRole, navigate]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/users/");
      setUsers(res.data.results || res.data);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setEditTarget(null);
    reset({ username: "", email: "", first_name: "", last_name: "", role: "STAFF", password: "", is_active: true });
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditTarget(u);
    reset({ username: u.username, email: u.email || "", first_name: u.first_name || "", last_name: u.last_name || "", role: u.role, password: "", is_active: u.is_active });
    setFormError("");
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    setFormError("");
    const payload = { ...data };
    if (!payload.password) delete payload.password; // don't send empty password on edit
    try {
      if (editTarget) {
        await api.patch(`/users/${editTarget.id}/`, payload);
      } else {
        await api.post("/users/", payload);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data;
      setFormError(
        typeof msg === "object"
          ? Object.entries(msg).map(([k, v]) => `${k}: ${[v].flat().join(", ")}`).join(" | ")
          : "Failed to save user."
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/users/${deleteTarget.id}/`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Delete failed.");
    }
  };

  const selfId = currentUser?.user_id;

  return (
    <>
      <Navbar />
      <main className="page">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Organization Users</h1>
            <p className="page-sub">{users.length} member{users.length !== 1 ? "s" : ""} in your organization</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ Add User</button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
              <span className="spinner" style={{ width: 32, height: 32 }} />
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3.5rem 1rem", color: "#94a3b8" }}>
              <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: ".5rem" }}>No users found</p>
              <p style={{ fontSize: ".875rem" }}>Add your first team member.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const badge = ROLE_BADGE[u.role] || ROLE_BADGE.STAFF;
                    const isSelf = String(u.id) === String(selfId);
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: ".625rem" }}>
                            <div className="avatar" style={{ background: "#ede9fe", color: "#4f46e5", width: 34, height: 34, fontSize: ".85rem" }}>
                              {(u.first_name?.[0] || u.username?.[0] || "U").toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: "#0f172a", fontSize: ".875rem" }}>
                                {u.first_name ? `${u.first_name} ${u.last_name || ""}`.trim() : u.username}
                                {isSelf && <span style={{ marginLeft: ".4rem", fontSize: ".7rem", color: "#94a3b8" }}>(you)</span>}
                              </div>
                              <div style={{ fontSize: ".75rem", color: "#94a3b8" }}>@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: "#4f46e5", fontSize: ".875rem" }}>{u.email || "—"}</td>
                        <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                        <td>
                          <span className={`badge ${u.is_active ? "badge-green" : "badge-red"}`}>
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end" }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)}>Edit</button>
                            {!isSelf && (
                              <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(u)}>Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal title={editTarget ? "Edit User" : "Add User"} onClose={() => setShowModal(false)}>
          {formError && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{formError}</div>}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
              <FormField label="First Name" error={errors.first_name?.message}>
                <input className="input" style={{ width: "100%" }} placeholder="Jane" {...register("first_name")} />
              </FormField>
              <FormField label="Last Name" error={errors.last_name?.message}>
                <input className="input" style={{ width: "100%" }} placeholder="Doe" {...register("last_name")} />
              </FormField>
            </div>
            <FormField label="Username *" error={errors.username?.message}>
              <input className={`input${errors.username ? " input-error" : ""}`} style={{ width: "100%" }} placeholder="jane_doe" {...register("username", { required: "Username is required" })} />
            </FormField>
            <FormField label="Email" error={errors.email?.message}>
              <input type="email" className="input" style={{ width: "100%" }} placeholder="jane@company.com" {...register("email")} />
            </FormField>
            <FormField label="Role *" error={errors.role?.message}>
              <select className="input" style={{ width: "100%" }} {...register("role", { required: "Role is required" })}>
                {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
              </select>
            </FormField>
            <FormField label={editTarget ? "New Password (leave blank to keep)" : "Password *"} error={errors.password?.message}>
              <input
                type="password"
                className={`input${errors.password ? " input-error" : ""}`}
                style={{ width: "100%" }}
                placeholder={editTarget ? "Leave blank to keep current" : "Min 6 characters"}
                {...register("password", editTarget ? {} : { required: "Password is required", minLength: { value: 6, message: "Min 6 characters" } })}
              />
            </FormField>
            {editTarget && (
              <FormField label="Status">
                <label style={{ display: "flex", alignItems: "center", gap: ".5rem", cursor: "pointer", fontSize: ".875rem", color: "#374151" }}>
                  <input type="checkbox" {...register("is_active")} style={{ width: 16, height: 16, accentColor: "#4f46e5" }} />
                  Active account
                </label>
              </FormField>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: ".75rem", paddingTop: ".5rem" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : editTarget ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <Modal title="Delete User" onClose={() => setDeleteTarget(null)}>
          <p style={{ color: "#64748b", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            Are you sure you want to delete <strong style={{ color: "#0f172a" }}>
              {deleteTarget.first_name ? `${deleteTarget.first_name} ${deleteTarget.last_name || ""}`.trim() : deleteTarget.username}
            </strong>? This cannot be undone.
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
