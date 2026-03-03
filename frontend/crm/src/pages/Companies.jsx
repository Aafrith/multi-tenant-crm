import { useEffect, useState, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

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

export default function Companies() {
  const { profile } = useContext(AuthContext);
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
  const canDelete = profile?.role === "ADMIN";
  const canEdit = profile?.role !== undefined;

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Companies</h1>
            <p className="text-gray-500 text-sm">{count} record{count !== 1 ? "s" : ""} found</p>
          </div>
          <button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Add Company
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search companies..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={industry}
            onChange={(e) => { setIndustry(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Industries</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No companies found</p>
              <p className="text-sm mt-1">Try adjusting your search or add a new company.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Logo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Industry</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Country</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {c.logo_url ? (
                        <img src={c.logo_url} alt={c.name} className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {c.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.industry}</td>
                    <td className="px-4 py-3 text-gray-600">{c.country}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        to={`/companies/${c.id}`}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        View
                      </Link>
                      {canEdit && (
                        <button
                          onClick={() => openEdit(c)}
                          className="text-yellow-600 hover:underline text-xs font-medium"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteTarget(c)}
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
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
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

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal title={editTarget ? "Edit Company" : "Add Company"} onClose={() => setShowModal(false)}>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-4">
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                {...register("name", { required: "Name is required" })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Acme Corp"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
              <select
                {...register("industry", { required: "Industry is required" })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
              {errors.industry && <p className="text-red-500 text-xs mt-1">{errors.industry.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <input
                {...register("country", { required: "Country is required" })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="United States"
              />
              {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
              <input
                type="file"
                accept="image/*"
                {...register("logo")}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border file:border-gray-300 file:rounded-md file:text-sm file:bg-white file:cursor-pointer"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                {saving ? "Saving..." : editTarget ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
