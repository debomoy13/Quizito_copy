import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuiz } from "../components/QuizContext";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { api, setUser, setToken } = useQuiz();

  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!form.email || !form.password || (mode === "register" && !form.username)) {
        toast.error("Please fill all fields");
        setLoading(false);
        return;
      }

      if (mode === "register" && form.password !== form.confirmPassword) {
        toast.error("Passwords do not match");
        setLoading(false);
        return;
      }

      const endpoint = mode === "login"
        ? "/auth/login"
        : "/auth/register";

      const payload = mode === "login"
        ? { email: form.email, password: form.password }
        : { username: form.username, email: form.email, password: form.password };

      const res = await api.post(endpoint, payload);

      if (!res.data.success) {
        toast.error(res.data.message || "Auth failed");
        setLoading(false);
        return;
      }

      const { token, user } = res.data;

      localStorage.setItem("quizito_token", token);
      localStorage.setItem("quizito_user", JSON.stringify(user));

      setToken(token);
      setUser(user);

      toast.success(mode === "login" ? "Logged in!" : "Account created!");

      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-6 bg-white rounded-xl shadow-xl w-full max-w-sm">

        <h2 className="text-2xl font-bold mb-4">
          {mode === "login" ? "Login" : "Register"}
        </h2>

        <div className="flex mb-4">
          <button className={`flex-1 p-2 ${mode === "login" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                  onClick={() => setMode("login")}>
            Login
          </button>
          <button className={`flex-1 p-2 ${mode === "register" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                  onClick={() => setMode("register")}>
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <input
              name="username"
              placeholder="Username"
              className="w-full p-2 border rounded"
              onChange={handleChange}
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full p-2 border rounded"
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full p-2 border rounded"
            onChange={handleChange}
          />

          {mode === "register" && (
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              className="w-full p-2 border rounded"
              onChange={handleChange}
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Processing..." : mode === "login" ? "Login" : "Register"}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Auth;
