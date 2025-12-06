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

  // Pre-fill with test data for easier testing
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      if (mode === "login") {
        setForm({
          email: "test@example.com",
          password: "password123",
          username: "",
          confirmPassword: ""
        });
      } else {
        setForm({
          username: "testuser",
          email: "test@example.com",
          password: "password123",
          confirmPassword: "password123"
        });
      }
    }
  }, [mode]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    console.log("📝 Form data:", form);
    console.log("🎯 Mode:", mode);

    try {
      // Validation
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

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        toast.error("Please enter a valid email");
        setLoading(false);
        return;
      }

      // Prepare request
      const endpoint = mode === "login" 
  ? "/auth/login" 
  : "/auth/register";

      const payload = mode === "login"
        ? { 
            email: form.email.toLowerCase().trim(), 
            password: form.password 
          }
        : { 
            username: form.username.trim(), 
            email: form.email.toLowerCase().trim(), 
            password: form.password 
          };

      console.log("🚀 Sending request to:", endpoint);
      console.log("📦 Payload:", payload);

      const res = await api.post(endpoint, payload);
      
      console.log("✅ Response:", res.data);

      if (!res.data.success) {
        toast.error(res.data.message || "Authentication failed");
        setLoading(false);
        return;
      }

      const { token, user } = res.data;

      // Store in localStorage
      localStorage.setItem("quizito_token", token);
      localStorage.setItem("quizito_user", JSON.stringify(user));

      // Update context
      setToken(token);
      setUser(user);

      toast.success(mode === "login" ? "Welcome back! 🎉" : "Account created successfully! 🎉");

      // Redirect to home
      navigate("/", { replace: true });

    } catch (err) {
      console.error("❌ Auth error:", err);
      console.error("Error details:", err.response?.data);
      
      if (err.response) {
        // Server responded with error
        const errorMsg = err.response.data?.message || "Authentication failed";
        toast.error(`Error: ${errorMsg}`);
        
        if (err.response.status === 400) {
          toast.error("Check your input and try again");
        } else if (err.response.status === 401) {
          toast.error("Invalid email or password");
        } else if (err.response.status === 500) {
          toast.error("Server error. Please try again later");
        }
      } else if (err.request) {
        // No response received
        console.error("No response received:", err.request);
        toast.error("Cannot connect to server. Check your internet connection.");
      } else {
        // Other errors
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTest = async () => {
    // Quick test button for debugging
    try {
      console.log("🧪 Testing API connection...");
      const testRes = await api.get("/health");
      console.log("✅ Health check:", testRes.data);
      toast.success(`API is healthy! DB: ${testRes.data.db}`);
      
      // Also test the root endpoint
      const rootRes = await api.get("/");
      console.log("✅ Root endpoint:", rootRes.data);
    } catch (err) {
      console.error("❌ API test failed:", err);
      toast.error("Cannot connect to backend server");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="p-8 bg-white rounded-2xl shadow-2xl w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">QUIZITO</h1>
          <p className="text-gray-600 mt-2">
            {mode === "login" 
              ? "Welcome back! Login to continue." 
              : "Join Quizito today!"}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex mb-6 bg-gray-100 p-1 rounded-xl">
          <button 
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              mode === "login" 
                ? "bg-white text-blue-600 shadow" 
                : "text-gray-600"
            }`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button 
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              mode === "register" 
                ? "bg-white text-blue-600 shadow" 
                : "text-gray-600"
            }`}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                name="username"
                placeholder="Enter username"
                value={form.username}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={handleChange}
                required
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
              placeholder="your@email.com"
              value={form.email}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={handleChange}
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
              placeholder="••••••••"
              value={form.password}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onChange={handleChange}
              required
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={form.confirmPassword}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={handleChange}
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-3 rounded-lg font-semibold transition-all ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            } text-white`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : mode === "login" ? (
              "Login to Quizito"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Quick test button (visible in development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleQuickTest}
              className="w-full p-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
            >
              🧪 Test API Connection
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              For debugging - checks if backend is reachable
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {mode === "login" 
              ? "Don't have an account? " 
              : "Already have an account? "}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Register here" : "Login here"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
