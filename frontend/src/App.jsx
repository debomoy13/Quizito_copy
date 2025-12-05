// src/App.jsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import { Toaster } from 'react-hot-toast';
import { QuizProvider } from './components/QuizContext';
import { AnimatePresence } from 'framer-motion';
import './index.css';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import Sidebar from './components/Sidebar';
import NotificationCenter from './components/NotificationCenter';
import AuthGuard from './components/AuthGuard';
import AdminGuard from './components/AdminGuard';
import OfflineIndicator from './components/OfflineIndicator';
import BackgroundParticles from './components/BackgroundParticles';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const CreateQuiz = lazy(() => import('./pages/CreateQuiz'));
const JoinQuiz = lazy(() => import('./pages/JoinQuiz'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const QuizSession = lazy(() => import('./pages/QuizSession'));
const Auth = lazy(() => import('./pages/Auth'));
const Profile = lazy(() => import('./pages/Profile'));
const MyQuizzes = lazy(() => import('./pages/MyQuizzes'));
const QuizAnalytics = lazy(() => import('./pages/QuizAnalytics'));
const Settings = lazy(() => import('./pages/Settings'));
const About = lazy(() => import('./pages/About'));

// Loading component
const PageLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm">
    <div className="text-center">
      <LoadingSpinner size="lg" color="indigo" text="Loading..." />
      <div className="mt-6">
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

// Main Layout
const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 relative">
      <BackgroundParticles />
      <OfflineIndicator />
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Header 
        onMenuClick={() => setSidebarOpen(true)}
        onNotificationsClick={() => setNotificationsOpen(true)}
      />
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <NotificationCenter isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="pt-20 pb-8 px-4 md:px-6 lg:px-8"
        >
          <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense>
        </motion.main>
      </AnimatePresence>
      
      <Footer />
    </div>
  );
};

// Dashboard Layout
const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Toaster position="top-right" />
      
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col">
          <Sidebar variant="dashboard" />
        </div>
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
            <div className="fixed inset-y-0 left-0 z-40 w-64">
              <Sidebar variant="dashboard" onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {/* Mobile Header */}
          <div className="sticky top-0 z-30 lg:hidden">
            <div className="flex h-16 items-center justify-between border-b border-gray-700 bg-gray-900 px-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="text-gray-400 hover:text-white"
              >
                <span className="sr-only">Open sidebar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              <div className="text-xl font-bold text-white">Quizito Admin</div>
              <div className="w-6" /> {/* Spacer */}
            </div>
          </div>
          
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <Suspense fallback={<PageLoader />}>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => setAppReady(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!appReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">Q</span>
              </div>
            </div>
            <div className="absolute inset-0 animate-spin">
              <div className="w-24 h-24 rounded-full border-4 border-transparent border-t-white/30 border-r-white/30"></div>
            </div>
          </div>
          <h1 className="mt-8 text-3xl font-bold text-white">Quizito</h1>
          <p className="mt-2 text-white/80">Loading your quiz experience...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <QuizProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/auth" element={
            <Suspense fallback={<PageLoader />}>
              <Auth />
            </Suspense>
          } />
          <Route path="/about" element={
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <About />
              </Suspense>
            </MainLayout>
          } />
          
          {/* Protected Main Routes */}
          <Route path="/" element={
            <AuthGuard>
              <MainLayout>
                <Outlet />
              </MainLayout>
            </AuthGuard>
          }>
            <Route index element={<Home />} />
            <Route path="create-quiz" element={<CreateQuiz />} />
            <Route path="join-quiz" element={<JoinQuiz />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="quiz-session/:sessionId" element={<QuizSession />} />
            <Route path="profile" element={<Profile />} />
            <Route path="my-quizzes" element={<MyQuizzes />} />
            <Route path="quiz-analytics/:quizId" element={<QuizAnalytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminGuard>
              <DashboardLayout>
                <Outlet />
              </DashboardLayout>
            </AdminGuard>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<div>Users Management</div>} />
            <Route path="quizzes" element={<div>Quizzes Management</div>} />
            <Route path="analytics" element={<div>Analytics</div>} />
            <Route path="reports" element={<div>Reports</div>} />
          </Route>
          
          {/* 404 Route */}
          <Route path="*" element={
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
              <div className="text-center px-4">
                <h1 className="text-9xl font-bold text-gray-300">404</h1>
                <h2 className="text-3xl font-bold text-gray-800 mt-4">Page Not Found</h2>
                <p className="text-gray-600 mt-2 max-w-md">
                  The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => window.history.back()}
                    className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            </div>
          } />
        </Routes>
      </QuizProvider>
    </Router>
  );
}


export default App;
