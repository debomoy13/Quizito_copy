import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const QuizContext = createContext();

export const api = axios.create({
  baseURL: "https://quizito-backend.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("quizito_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor
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
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("quizito_user");
      return u ? JSON.parse(u) : null;
    } catch (error) {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("quizito_token"));
  const [loading, setLoading] = useState(true);

  // Listen for storage changes (when Auth.jsx saves to localStorage)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const newToken = localStorage.getItem("quizito_token");
        const newUser = localStorage.getItem("quizito_user");
        
        setToken(newToken);
        setUser(newUser ? JSON.parse(newUser) : null);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    };

    // Listen for storage events
    window.addEventListener("storage", handleStorageChange);
    
    // Also check on focus (when tab becomes active)
    window.addEventListener("focus", handleStorageChange);

    // Initial load
    handleStorageChange();
    setLoading(false);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, []);

  const updateAuth = (newToken, newUser) => {
    if (newToken) {
      localStorage.setItem("quizito_token", newToken);
    }
    if (newUser) {
      localStorage.setItem("quizito_user", JSON.stringify(newUser));
    }
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("quizito_token");
    localStorage.removeItem("quizito_user");
    setToken(null);
    setUser(null);
    window.location.href = "/auth";
  };

  // Check token validity on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/verify");
        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        // Token invalid, clear it
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
        updateAuth, // Add this function
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
};
