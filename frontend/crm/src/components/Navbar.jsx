import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { logout } = useContext(AuthContext);

  return (
    <div className="bg-blue-700 text-white p-4 flex justify-between">

      <div className="space-x-4">

        <Link to="/">Dashboard</Link>
        <Link to="/companies">Companies</Link>
        <Link to="/logs">Logs</Link>

      </div>

      <button onClick={logout}>
        Logout
      </button>

    </div>
  );
}