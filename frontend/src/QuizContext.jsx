// src/QuizContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import toast from "react-hot-toast";

const QuizContext = createContext();

// ------------------------------------------------------
// AXIOS CLIENT (FINAL FIXED VERSION)
// ------------------------------------------------------
const api = axios.create({
  baseURL: "https://quizito-backend.onrender.com/api",   // FULLY CORRECT
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("quizito_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const QuizProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("quizito_user");
    const t = localStorage.getItem("quizito_token");
    return u && t ? JSON.parse(u) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("quizito_token"));
  const [authLoading, setAuthLoading] = useState(false);

  // ------------------------------------------------------
  // SOCKET SETUP (FIXED)
  // ------------------------------------------------------
  useEffect(() => {
    if (!token) return;

    const newSocket = io("https://quizito-backend.onrender.com", {
      transports: ["websocket"],
      auth: { token },
    });

    newSocket.on("connect", () => console.log("🔌 Socket Connected"));
    newSocket.on("disconnect", () => console.log("❌ Socket Disconnected"));

    newSocket.on("auth_error", () => {
      toast.error("Session expired");
      logout();
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [token]);

  // ------------------------------------------------------
  // REGISTER (FINAL)
  // ------------------------------------------------------
  const register = useCallback(async (data) => {
    setAuthLoading(true);
    try {
      const res = await api.post("/auth/register", {
        username: data.username,
        email: data.email,
        password: data.password,
      });

      const { token, user } = res.data;

      localStorage.setItem("quizito_token", token);
      localStorage.setItem("quizito_user", JSON.stringify(user));

      setToken(token);
      setUser(user);

      toast.success("Account created!");
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
      return { success: false };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // ------------------------------------------------------
  // LOGIN (FINAL)
  // ------------------------------------------------------
  const login = useCallback(async (credentials) => {
    setAuthLoading(true);
    try {
      const res = await api.post("/auth/login", credentials);
      const { token, user } = res.data;

      localStorage.setItem("quizito_token", token);
      localStorage.setItem("quizito_user", JSON.stringify(user));

      setUser(user);
      setToken(token);

      toast.success("Logged in!");
      return { success: true };
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
      return { success: false };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // ------------------------------------------------------
  // LOGOUT
  // ------------------------------------------------------
  const logout = useCallback(() => {
    localStorage.removeItem("quizito_token");
    localStorage.removeItem("quizito_user");

    setUser(null);
    setToken(null);

    if (socket) socket.disconnect();
    setSocket(null);

    toast.success("Logged out");
  }, [socket]);

  // ------------------------------------------------------
  // VERIFY TOKEN ON LOAD
  // ------------------------------------------------------
  useEffect(() => {
    const verify = async () => {
      if (!token) return;
      try {
        await api.get("/auth/verify");
      } catch (err) {
        logout();
        toast.error("Session expired");
      }
    };
    verify();
  }, [token]);

  return (
    <QuizContext.Provider
      value={{
        user,
        token,
        socket,
        api,
        authLoading,
        setUser,
        setToken,
        login,
        register,
        logout,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => useContext(QuizContext);
