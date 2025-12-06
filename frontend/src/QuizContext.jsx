import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const QuizContext = createContext();

export const api = axios.create({
  baseURL: "https://quizito-backend.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("quizito_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const QuizProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("quizito_user");
    return u ? JSON.parse(u) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("quizito_token"));

  return (
    <QuizContext.Provider
      value={{
        api,
        user,
        token,
        setUser,
        setToken,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => useContext(QuizContext);
