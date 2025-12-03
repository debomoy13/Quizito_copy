// src/App.jsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QuizProvider } from './QuizContext';
import './index.css';

// Lazy load components for better performance
const Home = lazy(() => import('./pages/Home'));
const CreateQuiz = lazy(() => import('./pages/CreateQuiz'));
const JoinQuiz = lazy(() => import('./pages/JoinQuiz'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const QuizSession = lazy(() => import('./QuizSession'));
const Auth = lazy(() => import('./pages/Auth'));

// Layout Components
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingSpinner from './components/LoadingSpinner';
import NotificationCenter from './components/NotificationCenter';

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
    <LoadingSpinner size="lg" />
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('quizito_token');
  
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('quizito_token');
  const user = JSON.parse(localStorage.getItem('quizito_user') || '{}');
  
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Main Layout Component
const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
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
      
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onNotificationsClick={() => setNotificationsOpen(!notificationsOpen)}
      />
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <NotificationCenter 
        isOpen={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)} 
      />
      
      <main className="pt-16 pb-8 px-4 md:px-6 lg:px-8">
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </main>
      
      <Footer />
    </div>
  );
};

// Dashboard Layout Component
const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Toaster position="top-right" />
      
      <div className="flex h-screen">
        {/* Sidebar for desktop */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <Sidebar isOpen={true} variant="dashboard" />
        </div>
        
        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-gray-900">
              <Sidebar isOpen={true} onClose={() => setSidebarOpen(false)} variant="dashboard" />
            </div>
          </div>
        )}
        
        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="sticky top-0 z-40 bg-gray-800 pl-1 pt-1 sm:pl-3 sm:pt-3 md:hidden">
            <button
              type="button"
              className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Show offline indicator
  useEffect(() => {
    if (!isOnline) {
      const offlineToast = toast.custom((t) => (
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg">
          You are offline. Some features may not work properly.
        </div>
      ));
    }
  }, [isOnline]);

  return (
    <QuizProvider>
      <Router>
        <Routes>
          {/* Auth Route */}
          <Route path="/auth" element={
            <Suspense fallback={<PageLoader />}>
              <Auth />
            </Suspense>
          } />
          
          {/* Main Layout Routes */}
          <Route path="/" element={
            <MainLayout>
              <Outlet />
            </MainLayout>
          }>
            <Route index element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            
            <Route path="create-quiz" element={
              <ProtectedRoute>
                <CreateQuiz />
              </ProtectedRoute>
            } />
            
            <Route path="join-quiz" element={
              <ProtectedRoute>
                <JoinQuiz />
              </ProtectedRoute>
            } />
            
            <Route path="leaderboard" element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            } />
            
            <Route path="quiz-session/:sessionId" element={
              <ProtectedRoute>
                <QuizSession />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Dashboard Layout Routes */}
          <Route path="/admin" element={
            <DashboardLayout>
              <Outlet />
            </DashboardLayout>
          }>
            <Route index element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
          </Route>
          
          {/* 404 Route */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
              <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
              <p className="text-xl text-gray-600 mb-8">Page not found</p>
              <button 
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Go Home
              </button>
            </div>
          } />
        </Routes>
      </Router>
    </QuizProvider>
  );
}

export default App;
