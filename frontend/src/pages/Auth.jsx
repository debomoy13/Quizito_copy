import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const BASE_URL = "https://quizito-backend.onrender.com";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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

      // Prepare URL and data
      const url = mode === "login" 
        ? `${BASE_URL}/api/auth/login`
        : `${BASE_URL}/api/auth/register`;

      const data = mode === "login"
        ? { email: form.email, password: form.password }
        : { username: form.username, email: form.email, password: form.password };

      console.log("🚀 Sending to:", url);
      console.log("📦 Data:", data);

      const response = await axios.post(url, data);
      const result = response.data;

      console.log("✅ Response:", result);

      if (!result.success) {
        toast.error(result.message || "Authentication failed");
        setLoading(false);
        return;
      }

      // Save token and user
      localStorage.setItem("quizito_token", result.token);
      localStorage.setItem("quizito_user", JSON.stringify(result.user));

      toast.success(mode === "login" ? "Logged in! 🎉" : "Account created! 🎉");
      navigate("/");

    } catch (error) {
      console.error("❌ Error:", error);
      
      if (error.response) {
        // Server responded with error
        toast.error(error.response.data?.message || "Authentication failed");
      } else if (error.request) {
        // No response received
        toast.error("Cannot connect to server. Check your internet.");
      } else {
        // Other errors
        toast.error("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="p-8 bg-white rounded-2xl shadow-2xl w-full max-w-md">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">QUIZITO</h1>
          <p className="text-gray-600 mt-2">
            {mode === "login" ? "Welcome back!" : "Join Quizito today!"}
          </p>
        </div>

        <div className="flex mb-6 bg-gray-100 p-1 rounded-xl">
          <button 
            className={`flex-1 py-3 rounded-lg font-medium ${mode === "login" ? "bg-white text-blue-600 shadow" : "text-gray-600"}`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button 
            className={`flex-1 py-3 rounded-lg font-medium ${mode === "register" ? "bg-white text-blue-600 shadow" : "text-gray-600"}`}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <input
              name="username"
              placeholder="Username"
              value={form.username}
              className="w-full p-3 border border-gray-300 rounded-lg"
              onChange={handleChange}
              required
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            className="w-full p-3 border border-gray-300 rounded-lg"
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            className="w-full p-3 border border-gray-300 rounded-lg"
            onChange={handleChange}
            required
          />

          {mode === "register" && (
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              className="w-full p-3 border border-gray-300 rounded-lg"
              onChange={handleChange}
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-3 rounded-lg font-semibold ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"} text-white`}
          >
            {loading ? "Processing..." : (mode === "login" ? "Login" : "Register")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
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
