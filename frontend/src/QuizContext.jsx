import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const QuizContext = createContext();

export const api = axios.create({
  baseURL: "https://quizito-backend.onrender.com/api/",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout
});

// Add response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("Request timeout");
      throw new Error("Request timeout. Please check your connection.");
    }
    if (!error.response) {
      console.error("No response from server");
      throw new Error("Cannot connect to server. Check your internet.");
    }
    throw error;
  }
);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("quizito_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`📡 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

export const QuizProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("quizito_user");
    return u ? JSON.parse(u) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("quizito_token"));

  const logout = () => {
    localStorage.removeItem("quizito_token");
    localStorage.removeItem("quizito_user");
    setUser(null);
    setToken(null);
  };

  return (
    <QuizContext.Provider
      value={{
        api,
        user,
        token,
        setUser,
        setToken,
        logout,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => useContext(QuizContext);
