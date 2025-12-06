// src/App.jsx
import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { Toaster } from "react-hot-toast";
import { QuizProvider, useQuiz } from "./components/QuizContext";
import { AnimatePresence, motion } from "framer-motion";
import "./index.css";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import LoadingSpinner from "./components/LoadingSpinner";
import Sidebar from "./components/Sidebar";
import NotificationCenter from "./components/NotificationCenter";
import AuthGuard from "./components/AuthGuard";
import AdminGuard from "./components/AdminGuard";
import OfflineIndicator from "./components/OfflineIndicator";
import BackgroundParticles from "./components/BackgroundParticles";

// Lazy-loaded pages
const Home = lazy(() => import("./pages/Home"));
const CreateQuiz = lazy(() => import("./pages/CreateQuiz"));
const JoinQuiz = lazy(() => import("./pages/JoinQuiz"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const QuizSession = lazy(() => import("./pages/QuizSession"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const MyQuizzes = lazy(() => import("./pages/MyQuizzes"));
const QuizAnalytics = lazy(() => import("./pages/QuizAnalytics"));
const Settings = lazy(() => import("./pages/Settings"));
const About = lazy(() => import("./pages/About"));

// Global page loader
const PageLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm">
    <LoadingSpinner size="lg" text="Loading..." />
  </div>
);

// ─────────────────────────────────────────────────────────────
// AUTH CHECKER - Checks token on app load
// ─────────────────────────────────────────────────────────────
const AuthChecker = ({ children }) => {
  const { setUser, setToken } = useQuiz();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("quizito_token");
        const userData = localStorage.getItem("quizito_user");
        
        if (token && userData) {
          setToken(token);
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error("Auth check error:", error);
        localStorage.removeItem("quizito_token");
        localStorage.removeItem("quizito_user");
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [setUser, setToken]);

  if (checking) {
    return <PageLoader />;
  }

  return <>{children}</>;
};

// ─────────────────────────────────────────────────────────────
// SIMPLE AUTH GUARD (if your AuthGuard component isn't working)
// ─────────────────────────────────────────────────────────────
const SimpleAuthGuard = () => {
  const { user } = useQuiz();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true });
    }
  }, [user, navigate]);

  if (!user) {
    return <PageLoader />;
  }

  return <Outlet />;
};

// ─────────────────────────────────────────────────────────────
// PUBLIC ONLY ROUTE (Prevents logged-in users from accessing auth)
// ─────────────────────────────────────────────────────────────
const PublicOnlyRoute = () => {
  const { user } = useQuiz();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  if (user) {
    return <PageLoader />;
  }

  return <Outlet />;
};

// ─────────────────────────────────────────────────────────────
// MAIN LAYOUT
// ─────────────────────────────────────────────────────────────
const MainLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user } = useQuiz();

  // Auto-close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 relative">
      <BackgroundParticles />
      <OfflineIndicator />

      {user && (
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onNotificationsClick={() => setNotificationsOpen(true)}
        />
      )}

      {user && (
        <>
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <NotificationCenter
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
          />
        </>
      )}

      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={`${user ? "pt-20" : "pt-0"} pb-12 px-4 md:px-6 lg:px-8 min-h-screen`}
        >
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </motion.main>
      </AnimatePresence>

      {user && <Footer />}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// DASHBOARD LAYOUT (ADMIN)
// ─────────────────────────────────────────────────────────────
const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Auto-close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <Toaster position="top-right" />

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64">
        <Sidebar variant="dashboard" />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute left-0 top-0 h-full w-64 bg-gray-800">
            <Sidebar variant="dashboard" onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-gray-800 rounded"
        onClick={() => setSidebarOpen(true)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Content */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto pt-16 lg:pt-6">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// APP ENTRY
// ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Router>
      <QuizProvider>
        <AuthChecker>
          <Routes>
            {/* Auth Page - Public Only */}
            <Route element={<PublicOnlyRoute />}>
              <Route
                path="/auth"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <Auth />
                  </Suspense>
                }
              />
            </Route>

            {/* About Page - Public */}
            <Route
              path="/about"
              element={
                <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
                  <Toaster position="top-right" />
                  <Suspense fallback={<PageLoader />}>
                    <About />
                  </Suspense>
                </div>
              }
            />

            {/* Protected Routes - User must be logged in */}
            <Route element={<SimpleAuthGuard />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/create-quiz" element={<CreateQuiz />} />
                <Route path="/join-quiz" element={<JoinQuiz />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/quiz-session/:sessionId" element={<QuizSession />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/my-quizzes" element={<MyQuizzes />} />
                <Route path="/quiz-analytics/:quizId" element={<QuizAnalytics />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<AdminGuard />}>
                <Route path="/admin" element={<DashboardLayout />}>
                  <Route index element={<AdminDashboard />} />
                </Route>
              </Route>
            </Route>

            {/* Home Redirect - If user goes to root without auth */}
            <Route
              path="/"
              element={
                <Navigate to="/auth" replace />
              }
            />

            {/* 404 Page */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
                  <h1 className="text-7xl font-bold text-gray-300">404</h1>
                  <h2 className="text-2xl font-bold text-gray-800 mt-4 text-center">
                    Page Not Found
                  </h2>
                  <p className="text-gray-600 mt-2 text-center max-w-md">
                    The page you're looking for doesn't exist or has been moved.
                  </p>
                  <div className="flex gap-4 mt-6">
                    <button
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      onClick={() => (window.location.href = "/")}
                    >
                      Go Home
                    </button>
                    <button
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                      onClick={() => window.history.back()}
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              }
            />
          </Routes>
        </AuthChecker>
      </QuizProvider>
    </Router>
  );
}
