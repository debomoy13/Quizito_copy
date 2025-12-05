// src/pages/Auth.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useQuiz } from "../components/QuizContext";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { api, user, token, setUser, setToken } = useQuiz();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // If already logged in, send to home
  useEffect(() => {
    if (token && user) {
      navigate("/", { replace: true });
    }
  }, [token, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!form.email || !form.password || (mode === "register" && !form.name)) {
        toast.error("Please fill in all required fields.");
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
          ? {
              email: form.email,
              password: form.password,
            }
          : {
              name: form.name,
              email: form.email,
              password: form.password,
            };

      const res = await api.post(endpoint, payload);

      if (!res.data?.success) {
        toast.error(res.data?.message || "Authentication failed");
        setLoading(false);
        return;
      }

      const { token: jwt, user: userData } = res.data;

      // Save to localStorage
      localStorage.setItem("quizito_token", jwt);
      localStorage.setItem("quizito_user", JSON.stringify(userData));

      // Update context (if setters exist)
      if (setToken) setToken(jwt);
      if (setUser) setUser(userData);

      toast.success(
        mode === "login" ? "Logged in successfully!" : "Account created!"
      );

      // Redirect to previous page or home
      const storedRedirect = localStorage.getItem("quizito_redirect");
      const fromLocation =
        location.state?.from?.pathname ||
        storedRedirect ||
        "/";

      if (storedRedirect) {
        localStorage.removeItem("quizito_redirect");
      }

      navigate(fromLocation, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-blue-100">
        {/* Left side */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white p-8">
          <div>
            <h1 className="text-3xl font-extrabold">Quizito</h1>
            <p className="mt-2 text-indigo-100 text-sm">
              Smart AI-powered quizzes for students, teachers and teams.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">
              {mode === "login"
                ? "Welcome back 👋"
                : "Create your account 🚀"}
            </h2>
            <p className="text-indigo-100 mb-6 text-sm">
              {mode === "login"
                ? "Login to join live quizzes, track your progress and compete on leaderboards."
                : "Sign up to create quizzes, invite friends, and see detailed analytics."}
            </p>
            <ul className="space-y-2 text-sm">
              <li>• Create or join live quiz sessions</li>
              <li>• Real-time leaderboard & analytics</li>
              <li>• Beautiful UI, optimized for exams 👨‍🎓</li>
            </ul>
          </div>

          <p className="text-xs text-indigo-200 mt-6">
            Made with ❤️ for students.
          </p>
        </div>

        {/* Right side – form */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === "login" ? "Login" : "Sign up"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {mode === "login"
                ? "Enter your email and password to continue."
                : "Create an account to get started with Quizito."}
            </p>
          </div>

          <div className="flex mb-6 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                mode === "login"
                  ? "bg-white shadow text-indigo-600"
                  : "text-gray-500"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                mode === "register"
                  ? "bg-white shadow text-indigo-600"
                  : "text-gray-500"
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="Enter your name"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading
                ? mode === "login"
                  ? "Logging in..."
                  : "Creating account..."
                : mode === "login"
                ? "Login"
                : "Sign up"}
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-500 text-center">
            By continuing, you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
