import { useForm } from "react-hook-form";
import api from "../api/axios";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { register, handleSubmit } = useForm();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const res = await api.post("/auth/login/", data);
      login(res.data.access);
      navigate("/");
    } catch {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 rounded w-96 shadow"
      >

        <h1 className="text-2xl mb-4 font-bold text-center">
          Login
        </h1>

        <input
          {...register("username")}
          placeholder="Username"
          className="w-full border p-2 mb-3"
        />

        <input
          type="password"
          {...register("password")}
          placeholder="Password"
          className="w-full border p-2 mb-3"
        />

        <button
          className="bg-blue-600 text-white w-full py-2"
        >
          Login
        </button>

      </form>
    </div>
  );
}