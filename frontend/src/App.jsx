// src/App.jsx
import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { Toaster } from "react-hot-toast";
import { QuizProvider } from "./components/QuizContext";
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
// MAIN LAYOUT
// ─────────────────────────────────────────────────────────────
const MainLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 relative">
      <BackgroundParticles />
      <OfflineIndicator />

      <Header
        onMenuClick={() => setSidebarOpen(true)}
        onNotificationsClick={() => setNotificationsOpen(true)}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <NotificationCenter
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      <Toaster position="top-right" />

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
          className="pt-20 pb-12 px-4 md:px-6 lg:px-8"
        >
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </motion.main>
      </AnimatePresence>

      <Footer />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// DASHBOARD LAYOUT (ADMIN)
// ─────────────────────────────────────────────────────────────
const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute left-0 top-0 h-full w-64 bg-gray-800">
            <Sidebar variant="dashboard" onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
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
        <Routes>
          {/* Public Route */}
          <Route
            path="/auth"
            element={
              <Suspense fallback={<PageLoader />}>
                <Auth />
              </Suspense>
            }
          />

          {/* About (public) */}
          <Route
            path="/about"
            element={
              <MainLayout>
                <About />
              </MainLayout>
            }
          />

          {/* Protected User Routes */}
          <Route element={<AuthGuard />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/create-quiz" element={<CreateQuiz />} />
              <Route path="/join-quiz" element={<JoinQuiz />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/quiz-session/:sessionId" element={<QuizSession />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-quizzes" element={<MyQuizzes />} />
              <Route
                path="/quiz-analytics/:quizId"
                element={<QuizAnalytics />}
              />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Admin */}
          <Route element={<AdminGuard />}>
            <Route path="/admin" element={<DashboardLayout />}>
              <Route index element={<AdminDashboard />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <h1 className="text-7xl font-bold text-gray-300">404</h1>
                <h2 className="text-2xl font-bold text-gray-800 mt-4">
                  Page Not Found
                </h2>
                <button
                  className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg"
                  onClick={() => (window.location.href = "/")}
                >
                  Go Home
                </button>
              </div>
            }
          />
        </Routes>
      </QuizProvider>
    </Router>
  );
}
