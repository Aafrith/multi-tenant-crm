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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useContext(AuthContext);

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
  const canDelete = profile?.role === "ADMIN";
  const canEdit = profile?.role !== undefined;

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
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  if (!company) return null;

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-4">
          <Link to="/companies" className="hover:text-blue-600">Companies</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-medium">{company.name}</span>
        </nav>

        {/* Company Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row item-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                  {company.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{company.name}</h1>
                <div className="flex gap-3 mt-1 text-sm text-gray-500">
                  <span>{company.industry}</span>
                  <span>•</span>
                  <span>{company.country}</span>
                  <span>•</span>
                  <span>Added {new Date(company.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <button
                  onClick={() => setShowEditCompany(true)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => setDeleteCompanyConfirm(true)}
                  className="px-3 py-1.5 text-sm bg-red-50 border border-red-200 rounded-lg text-red-600 hover:bg-red-100"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contacts Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Contacts</h2>
              <p className="text-sm text-gray-500">{contactCount} contact{contactCount !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex gap-3">
              <input
                value={contactSearch}
                onChange={(e) => { setContactSearch(e.target.value); setContactPage(1); }}
                placeholder="Search contacts..."
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={openAddContact}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
              >
                + Add Contact
              </button>
            </div>
          </div>

          {loadingContacts ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>No contacts yet.</p>
              <p className="text-sm mt-1">Add your first contact to get started.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email}</td>
                    <td className="px-4 py-3 text-gray-500">{c.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {c.role?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {canEdit && (
                        <button
                          onClick={() => openEditContact(c)}
                          className="text-yellow-600 hover:underline text-xs font-medium"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteContact(c)}
                          className="text-red-600 hover:underline text-xs font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {contactTotalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">Page {contactPage} of {contactTotalPages}</p>
              <div className="flex gap-2">
                <button
                  disabled={contactPage === 1}
                  onClick={() => setContactPage((p) => p - 1)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={contactPage === contactTotalPages}
                  onClick={() => setContactPage((p) => p + 1)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Company Modal */}
      {showEditCompany && (
        <Modal title="Edit Company" onClose={() => setShowEditCompany(false)}>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">{formError}</div>
          )}
          <form onSubmit={companyForm.handleSubmit(onUpdateCompany)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                {...companyForm.register("name", { required: "Required" })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
              <select
                {...companyForm.register("industry", { required: "Required" })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <input
                {...companyForm.register("country", { required: "Required" })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
              <input
                type="file"
                accept="image/*"
                {...companyForm.register("logo")}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:rounded-md file:text-sm file:bg-white"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowEditCompany(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg">
                {saving ? "Saving..." : "Update"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Company Modal */}
      {deleteCompanyConfirm && (
        <Modal title="Delete Company" onClose={() => setDeleteCompanyConfirm(false)}>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete <strong>{company.name}</strong>? All contacts will remain but the company will be removed.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteCompanyConfirm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={onDeleteCompany} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete</button>
          </div>
        </Modal>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <Modal title={editContact ? "Edit Contact" : "Add Contact"} onClose={() => setShowContactModal(false)}>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">{formError}</div>
          )}
          <form onSubmit={contactForm.handleSubmit(onSubmitContact)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                {...contactForm.register("full_name", { required: "Name is required" })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
              {contactForm.formState.errors.full_name && (
                <p className="text-red-500 text-xs mt-1">{contactForm.formState.errors.full_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                {...contactForm.register("email", {
                  required: "Email is required",
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email format" },
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
              />
              {contactForm.formState.errors.email && (
                <p className="text-red-500 text-xs mt-1">{contactForm.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                {...contactForm.register("phone", {
                  validate: (v) => !v || (/^\d{8,15}$/.test(v)) || "Phone must be 8-15 digits (numbers only)",
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12345678"
              />
              {contactForm.formState.errors.phone && (
                <p className="text-red-500 text-xs mt-1">{contactForm.formState.errors.phone.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                {...contactForm.register("role")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CONTACT_ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowContactModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg">
                {saving ? "Saving..." : editContact ? "Update" : "Add Contact"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Contact Modal */}
      {deleteContact && (
        <Modal title="Delete Contact" onClose={() => setDeleteContact(null)}>
          <p className="text-gray-600 mb-6">
            Delete <strong>{deleteContact.full_name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteContact(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={onDeleteContact} className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete</button>
          </div>
        </Modal>
      )}
    </>
  );
}
