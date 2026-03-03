import { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setApiError("");
    setLoading(true);
    try {
      const res = await api.post("/token/", data);
      await login(res.data.access, res.data.refresh);
      navigate("/");
    } catch (err) {
      setApiError(err.response?.data?.detail || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4f46e5 100%)",
    }}>
      {/* Left decorative panel */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem",
        color: "#fff",
      }} className="hidden lg:flex">
        <div style={{ maxWidth: "26rem" }}>
          <div style={{
            width: 56, height: 56,
            background: "rgba(255,255,255,.15)",
            borderRadius: "1rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "1.5rem",
            fontSize: "1.75rem",
          }}>🏢</div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800, lineHeight: 1.2, marginBottom: ".75rem" }}>
            Multi-Tenant<br />CRM System
          </h1>
          <p style={{ color: "rgba(255,255,255,.7)", lineHeight: 1.7, fontSize: "1.0625rem" }}>
            Manage your organizations, companies and contacts — all in one secure, scalable platform.
          </p>
          <div style={{ marginTop: "2.5rem", display: "flex", flexDirection: "column", gap: ".75rem" }}>
            {["Role-based access control", "Multi-tenant data isolation", "Real-time activity logging"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: ".625rem", color: "rgba(255,255,255,.85)" }}>
                <span style={{ color: "#a5b4fc", fontSize: "1.125rem" }}>✓</span>
                <span style={{ fontSize: ".9375rem" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div style={{
        width: "100%",
        maxWidth: "30rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        background: "#fff",
        borderRadius: 0,
      }}>
        <div style={{ width: "100%", maxWidth: "22rem" }}>
          {/* Logo */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{
              width: 44, height: 44,
              background: "#4f46e5",
              borderRadius: ".75rem",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: "1.25rem", marginBottom: "1.25rem",
            }}>🏢</div>
            <h2 style={{ fontSize: "1.625rem", fontWeight: 700, color: "#0f172a", marginBottom: ".3rem" }}>
              Welcome back
            </h2>
            <p style={{ color: "#64748b", fontSize: ".9375rem" }}>
              Sign in to your organization
            </p>
          </div>

          {/* Error alert */}
          {apiError && (
            <div className="alert alert-error" style={{ marginBottom: "1.25rem" }}>
              <strong>Error: </strong>{apiError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
            <div>
              <label style={{ display: "block", fontSize: ".875rem", fontWeight: 500, color: "#334155", marginBottom: ".375rem" }}>
                Username
              </label>
              <input
                {...register("username", { required: "Username is required" })}
                placeholder="Enter your username"
                className={`input ${errors.username ? "input-error" : ""}`}
                autoComplete="username"
              />
              {errors.username && <p style={{ color: "#dc2626", fontSize: ".78125rem", marginTop: ".25rem" }}>{errors.username.message}</p>}
            </div>

            <div>
              <label style={{ display: "block", fontSize: ".875rem", fontWeight: 500, color: "#334155", marginBottom: ".375rem" }}>
                Password
              </label>
              <input
                type="password"
                {...register("password", { required: "Password is required" })}
                placeholder="Enter your password"
                className={`input ${errors.password ? "input-error" : ""}`}
                autoComplete="current-password"
              />
              {errors.password && <p style={{ color: "#dc2626", fontSize: ".78125rem", marginTop: ".25rem" }}>{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ marginTop: ".5rem", width: "100%", borderRadius: ".625rem" }}
            >
              {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: "#fff", borderRightColor: "transparent" }} /> Signing in…</> : "Sign in"}
            </button>
          </form>

          <p style={{ marginTop: "1.75rem", fontSize: ".8125rem", color: "#94a3b8", textAlign: "center" }}>
            Multi-Tenant CRM &mdash; &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
