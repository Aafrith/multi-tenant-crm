import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
      }}>
        <span className="spinner" style={{ width: 40, height: 40, color: "#4f46e5" }} />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
