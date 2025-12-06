// src/QuizContext.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { io } from "socket.io-client";
import axios from "axios";
import toast from "react-hot-toast";

const QuizContext = createContext();

// ------------------------------------------------------
// AXIOS CLIENT
// ------------------------------------------------------
const api = axios.create({
  baseURL: "https://quizito-backend.onrender.com/api",
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
  const [authLoading, setAuthLoading] = useState(false);

  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("quizito_user");
    const t = localStorage.getItem("quizito_token");
    return u && t ? JSON.parse(u) : null;
  });

  const [token, setToken] = useState(() =>
    localStorage.getItem("quizito_token")
  );

  // Logout ref to avoid stale closure
  const logoutRef = useRef(null);

  const logout = useCallback(() => {
    localStorage.removeItem("quizito_token");
    localStorage.removeItem("quizito_user");

    setUser(null);
    setToken(null);

    if (socket) socket.disconnect();
    setSocket(null);

    toast.success("Logged out");
  }, [socket]);

  logoutRef.current = logout;

  // ------------------------------------------------------
  // SOCKET.IO FINAL CONFIG
  // ------------------------------------------------------
  useEffect(() => {
    if (!token) return;

    const newSocket = io("https://quizito-backend.onrender.com", {
      path: "/socket.io/",
      transports: ["websocket", "polling"], // REQUIRED for Render
      auth: { token },
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionAttempts: 10,
    });

    newSocket.on("connect", () => console.log("🔌 Socket Connected"));
    newSocket.on("disconnect", () => console.log("❌ Socket Disconnected"));

    newSocket.on("auth_error", () => {
      toast.error("Session expired");
      logoutRef.current?.();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // ------------------------------------------------------
  // REGISTER
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
  // LOGIN
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
  // VERIFY TOKEN
  // ------------------------------------------------------
  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const res = await api.get("/auth/verify");
        if (!res.data?.success) throw new Error();
      } catch {
        logoutRef.current?.();
        toast.error("Session expired");
      }
    };

    verify();
  }, [token]);

  // ------------------------------------------------------
  // PROVIDER
  // ------------------------------------------------------
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
