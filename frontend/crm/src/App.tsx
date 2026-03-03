import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";
import Contacts from "./pages/Contacts";
import ActivityLogs from "./pages/ActivityLogs";

import PrivateRoute from "./routes/PrivateRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/companies"
        element={
          <PrivateRoute>
            <Companies />
          </PrivateRoute>
        }
      />

      <Route
        path="/companies/:id"
        element={
          <PrivateRoute>
            <CompanyDetail />
          </PrivateRoute>
        }
      />

      <Route
        path="/contacts"
        element={
          <PrivateRoute>
            <Contacts />
          </PrivateRoute>
        }
      />

      <Route
        path="/logs"
        element={
          <PrivateRoute>
            <ActivityLogs />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
