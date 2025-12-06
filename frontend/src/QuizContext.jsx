// src/components/QuizContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const QuizContext = createContext();

// Create axios instance with base URL
export const api = axios.create({
  baseURL: "https://quizito-backend.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Add token to all requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("quizito_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("quizito_token");
      localStorage.removeItem("quizito_user");
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export const QuizProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedToken = localStorage.getItem("quizito_token");
        const storedUser = localStorage.getItem("quizito_user");
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error loading user from storage:", error);
        // Clear invalid data
        localStorage.removeItem("quizito_token");
        localStorage.removeItem("quizito_user");
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // Function to update auth state (called after login/register)
  const updateAuth = (newToken, newUser) => {
    localStorage.setItem("quizito_token", newToken);
    localStorage.setItem("quizito_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  // Function to logout
  const logout = () => {
    localStorage.removeItem("quizito_token");
    localStorage.removeItem("quizito_user");
    setToken(null);
    setUser(null);
    window.location.href = "/auth";
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Quizito...</p>
        </div>
      </div>
    );
  }

  return (
    <QuizContext.Provider
      value={{
        api,
        user,
        token,
        setUser,
        setToken,
        updateAuth,
        logout,
        isAuthenticated: !!user && !!token,
        loading,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

// Custom hook to use the quiz context
export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
};
