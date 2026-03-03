import { useEffect, useState, useContext, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

const CONTACT_ROLES = ["DECISION_MAKER", "INFLUENCER", "END_USER", "OTHER"];
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

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, role } = useContext(AuthContext);

  const [company, setCompany] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactCount, setContactCount] = useState(0);
  const [contactPage, setContactPage] = useState(1);
  const [contactSearch, setContactSearch] = useState("");

  const [showEditCompany, setShowEditCompany] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [deleteContact, setDeleteContact] = useState(null);
  const [deleteCompanyConfirm, setDeleteCompanyConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const companyForm = useForm();
  const contactForm = useForm();

  const PAGE_SIZE = 10;
  const canCreate = role === "ADMIN" || role === "MANAGER";
  const canEdit   = role === "ADMIN" || role === "MANAGER";
  const canDelete = role === "ADMIN";

  const fetchCompany = useCallback(async () => {
    setLoadingCompany(true);
    try {
      const res = await api.get(`/companies/${id}/`);
      setCompany(res.data);
      companyForm.reset({
        name: res.data.name,
        industry: res.data.industry,
        country: res.data.country,
      });
    } catch {
      navigate("/companies");
    } finally {
      setLoadingCompany(false);
    }
  }, [id, navigate, companyForm]);

  const fetchContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const params = new URLSearchParams({ company: id, page: contactPage, page_size: PAGE_SIZE });
      if (contactSearch) params.set("search", contactSearch);
      const res = await api.get(`/contacts/?${params}`);
      setContacts(res.data.results || []);
      setContactCount(res.data.count || 0);
    } catch {
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  }, [id, contactPage, contactSearch]);

  useEffect(() => { fetchCompany(); }, [fetchCompany]);
  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  // Company edit
  const onUpdateCompany = async (data) => {
    setSaving(true);
    setFormError("");
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("industry", data.industry);
      formData.append("country", data.country);
      if (data.logo?.[0]) formData.append("logo", data.logo[0]);
      const res = await api.patch(`/companies/${id}/`, formData);
      setCompany(res.data);
      setShowEditCompany(false);
    } catch (err) {
      const msg = err.response?.data;
      setFormError(typeof msg === "object" ? Object.values(msg).flat().join(" ") : "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteCompany = async () => {
    try {
      await api.delete(`/companies/${id}/`);
      navigate("/companies");
    } catch (err) {
      alert(err.response?.data?.detail || "Delete failed.");
    }
  };

  // Contact CRUD
  const openAddContact = () => {
    setEditContact(null);
    contactForm.reset({ full_name: "", email: "", phone: "", role: "OTHER" });
    setFormError("");
    setShowContactModal(true);
  };

  const openEditContact = (contact) => {
    setEditContact(contact);
    contactForm.reset({
      full_name: contact.full_name,
      email: contact.email,
      phone: contact.phone || "",
      role: contact.role,
    });
    setFormError("");
    setShowContactModal(true);
  };

  const onSubmitContact = async (data) => {
    setSaving(true);
    setFormError("");
    try {
      if (editContact) {
        await api.patch(`/contacts/${editContact.id}/`, data);
      } else {
        await api.post("/contacts/", { ...data, company: id });
      }
      setShowContactModal(false);
      fetchContacts();
    } catch (err) {
      const msg = err.response?.data;
      setFormError(typeof msg === "object" ? Object.values(msg).flat().join(" ") : "Failed to save contact.");
    } finally {
      setSaving(false);
    }
  };

  const onDeleteContact = async () => {
    try {
      await api.delete(`/contacts/${deleteContact.id}/`);
      setDeleteContact(null);
      fetchContacts();
    } catch (err) {
      alert(err.response?.data?.detail || "Delete failed.");
    }
  };

  const contactTotalPages = Math.ceil(contactCount / PAGE_SIZE);

  if (loadingCompany) {
    return (
      <>
        <Navbar />
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "5rem" }}>
          <span className="spinner" style={{ width: 36, height: 36 }} />
        </div>
      </>
    );
  }

  if (!company) return null;

  const ROLE_BADGE_MAP = {
    DECISION_MAKER: "badge-purple",
    INFLUENCER:     "badge-blue",
    END_USER:       "badge-green",
    OTHER:          "badge-gray",
  };

  return (
    <>
      <Navbar />
      <main className="page">
        {/* Breadcrumb */}
        <nav style={{ fontSize: ".8125rem", color: "#94a3b8", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: ".5rem" }}>
          <Link to="/companies" style={{ color: "#4f46e5", textDecoration: "none", fontWeight: 600 }}>Companies</Link>
          <span>›</span>
          <span style={{ color: "#64748b" }}>{company.name}</span>
        </nav>

        {/* Company Header Card */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} style={{ height: 64, width: 64, borderRadius: ".75rem", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div className="avatar" style={{ width: 64, height: 64, fontSize: "1.5rem", borderRadius: ".75rem", background: "#ede9fe", color: "#4f46e5", flexShrink: 0 }}>
                  {company.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: ".4rem" }}>{company.name}</h1>
                <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", alignItems: "center" }}>
                  <span className="badge badge-purple">{company.industry}</span>
                  <span className="badge badge-gray">🌍 {company.country}</span>
                  <span style={{ fontSize: ".78rem", color: "#94a3b8" }}>Added {new Date(company.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: ".625rem", flexShrink: 0 }}>
              {canEdit && (
                <button className="btn btn-ghost" onClick={() => setShowEditCompany(true)}>✏️ Edit</button>
              )}
              {canDelete && (
                <button className="btn btn-danger" onClick={() => setDeleteCompanyConfirm(true)}>Delete</button>
              )}
            </div>
          </div>
        </div>

        {/* Contacts Section */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Section header */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1.125rem 1.5rem", borderBottom: "1px solid #e2e8f0" }}>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Contacts</h2>
              <p style={{ fontSize: ".78rem", color: "#94a3b8", marginTop: ".2rem" }}>{contactCount} contact{contactCount !== 1 ? "s" : ""}</p>
            </div>
            <div style={{ display: "flex", gap: ".625rem", alignItems: "center" }}>
              <input
                className="input"
                value={contactSearch}
                onChange={(e) => { setContactSearch(e.target.value); setContactPage(1); }}
                placeholder="🔍  Search contacts…"
                style={{ minWidth: 180 }}
              />
              {canCreate && <button className="btn btn-primary" onClick={openAddContact}>+ Add</button>}
            </div>
          </div>

          {loadingContacts ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2.5rem 0" }}>
              <span className="spinner" style={{ width: 28, height: 28 }} />
            </div>
          ) : contacts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#94a3b8" }}>
              <p style={{ fontWeight: 600, marginBottom: ".35rem" }}>No contacts yet.</p>
              <p style={{ fontSize: ".875rem" }}>Add your first contact to get started.</p>
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
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: "#0f172a" }}>{c.full_name}</td>
                      <td style={{ color: "#4f46e5" }}>{c.email}</td>
                      <td style={{ color: "#94a3b8" }}>{c.phone || "—"}</td>
                      <td>
                        <span className={`badge ${ROLE_BADGE_MAP[c.role] || "badge-gray"}`}>
                          {c.role?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end" }}>
                          {canEdit && (
                            <button className="btn btn-ghost btn-sm" onClick={() => openEditContact(c)}>Edit</button>
                          )}
                          {canDelete && (
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteContact(c)}>Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {contactTotalPages > 1 && (
            <div className="pagination" style={{ borderTop: "1px solid #e2e8f0", padding: ".875rem 1.5rem" }}>
              <span style={{ fontSize: ".8125rem", color: "#64748b" }}>Page {contactPage} of {contactTotalPages}</span>
              <div className="pagination-btns">
                <button className="page-btn" disabled={contactPage === 1} onClick={() => setContactPage((p) => p - 1)}>‹ Prev</button>
                <button className="page-btn" disabled={contactPage === contactTotalPages} onClick={() => setContactPage((p) => p + 1)}>Next ›</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit Company Modal */}
      {showEditCompany && (
        <Modal title="Edit Company" onClose={() => setShowEditCompany(false)}>
          {formError && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{formError}</div>}
          <form onSubmit={companyForm.handleSubmit(onUpdateCompany)}>
            <FormField label="Company Name *" error={companyForm.formState.errors.name?.message}>
              <input className="input" style={{ width: "100%" }} {...companyForm.register("name", { required: "Required" })} />
            </FormField>
            <FormField label="Industry *" error={companyForm.formState.errors.industry?.message}>
              <select className="input" style={{ width: "100%" }} {...companyForm.register("industry", { required: "Required" })}>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </FormField>
            <FormField label="Country *" error={companyForm.formState.errors.country?.message}>
              <input className="input" style={{ width: "100%" }} {...companyForm.register("country", { required: "Required" })} />
            </FormField>
            <FormField label="Logo (optional)">
              <input type="file" accept="image/*" {...companyForm.register("logo")} style={{ fontSize: ".8125rem", color: "#64748b", width: "100%" }} />
            </FormField>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: ".75rem", paddingTop: ".5rem" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowEditCompany(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : "Update"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Company Modal */}
      {deleteCompanyConfirm && (
        <Modal title="Delete Company" onClose={() => setDeleteCompanyConfirm(false)}>
          <p style={{ color: "#64748b", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Are you sure you want to delete <strong style={{ color: "#0f172a" }}>{company.name}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: ".75rem" }}>
            <button className="btn btn-ghost" onClick={() => setDeleteCompanyConfirm(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={onDeleteCompany}>Delete</button>
          </div>
        </Modal>
      )}

      {/* Add / Edit Contact Modal */}
      {showContactModal && (
        <Modal title={editContact ? "Edit Contact" : "Add Contact"} onClose={() => setShowContactModal(false)}>
          {formError && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{formError}</div>}
          <form onSubmit={contactForm.handleSubmit(onSubmitContact)}>
            <FormField label="Full Name *" error={contactForm.formState.errors.full_name?.message}>
              <input className="input" style={{ width: "100%" }} placeholder="John Doe" {...contactForm.register("full_name", { required: "Name is required" })} />
            </FormField>
            <FormField label="Email *" error={contactForm.formState.errors.email?.message}>
              <input type="email" className="input" style={{ width: "100%" }} placeholder="john@example.com"
                {...contactForm.register("email", {
                  required: "Email is required",
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email format" },
                })}
              />
            </FormField>
            <FormField label="Phone (optional)" error={contactForm.formState.errors.phone?.message}>
              <input className="input" style={{ width: "100%" }} placeholder="12345678"
                {...contactForm.register("phone", {
                  validate: (v) => !v || /^\d{8,15}$/.test(v) || "Phone must be 8–15 digits",
                })}
              />
            </FormField>
            <FormField label="Role">
              <select className="input" style={{ width: "100%" }} {...contactForm.register("role")}>
                {CONTACT_ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
              </select>
            </FormField>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: ".75rem", paddingTop: ".5rem" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowContactModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : editContact ? "Update" : "Add Contact"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Contact Modal */}
      {deleteContact && (
        <Modal title="Delete Contact" onClose={() => setDeleteContact(null)}>
          <p style={{ color: "#64748b", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            Delete contact <strong style={{ color: "#0f172a" }}>{deleteContact.full_name}</strong>? This action cannot be undone.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: ".75rem" }}>
            <button className="btn btn-ghost" onClick={() => setDeleteContact(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={onDeleteContact}>Delete</button>
          </div>
        </Modal>
      )}
    </>
  );
}

