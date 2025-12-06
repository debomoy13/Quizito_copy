// src/pages/Auth.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuiz } from "../components/QuizContext";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { api, user, token, setUser, setToken } = useQuiz();

  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (token && user) {
      navigate("/", { replace: true });
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!form.email || !form.password || (mode === "register" && !form.name)) {
        toast.error("Please fill all required fields.");
        setLoading(false);
        return;
      }

      if (mode === "register" && form.password !== form.confirmPassword) {
        toast.error("Passwords do not match.");
        setLoading(false);
        return;
      }

      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";

      const payload =
        mode === "login"
          ? { email: form.email, password: form.password }
          : { username: form.name, email: form.email, password: form.password };

      const res = await api.post(endpoint, payload);

      if (!res.data?.success) {
        toast.error(res.data?.message || "Authentication failed");
        setLoading(false);
        return;
      }

      const { token: jwt, user: userData } = res.data;

      localStorage.setItem("quizito_token", jwt);
      localStorage.setItem("quizito_user", JSON.stringify(userData));

      if (setToken) setToken(jwt);
      if (setUser) setUser(userData);

      toast.success(mode === "login" ? "Logged in!" : "Account created!");

      const redirect =
        location.state?.from?.pathname ||
        localStorage.getItem("quizito_redirect") ||
        "/";

      localStorage.removeItem("quizito_redirect");
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-blue-100">
        
        {/* LEFT PANEL */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white p-8">
          <div>
            <h1 className="text-3xl font-extrabold">Quizito</h1>
            <p className="mt-2 text-indigo-100 text-sm">
              AI-powered quizzes for students & teachers.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">
              {mode === "login" ? "Welcome back 👋" : "Create your account 🚀"}
            </h2>
            <p className="text-indigo-100 mb-6 text-sm">
              {mode === "login"
                ? "Login to join live quizzes & track your progress."
                : "Sign up to create quizzes and view analytics."}
            </p>
          </div>

          <p className="text-xs text-indigo-200">Made with ❤️</p>
        </div>

        {/* RIGHT PANEL */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-bold mb-1">
            {mode === "login" ? "Login" : "Sign up"}
          </h2>

          <div className="flex mb-6 rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm rounded-lg ${
                mode === "login" ? "bg-white shadow text-indigo-600" : "text-gray-500"
              }`}
            >
              Login
            </button>

            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm rounded-lg ${
                mode === "register" ? "bg-white shadow text-indigo-600" : "text-gray-500"
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border"
                required
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 text-sm font-semibold rounded-lg bg-indigo-600 text-white"
            >
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Sign up"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
