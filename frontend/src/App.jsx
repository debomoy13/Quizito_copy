// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QuizProvider } from './QuizContext';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CreateQuiz from './pages/CreateQuiz';
import JoinQuiz from './pages/JoinQuiz';
import QuizSession from './pages/QuizSession';
import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import './index.css';
// Add this to your routes in App.jsx
<Route path="/debug" element={<BackendTest />} />

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('quizito_user'));
  const token = localStorage.getItem('quizito_token');
  
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
  };

  return (
    <QuizProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
          <Navbar />
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #334155',
              },
            }}
          />
          
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                <motion.div key="home" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                  <Home />
                </motion.div>
              } />
              <Route path="/login" element={
                <motion.div key="login" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                  <Login />
                </motion.div>
              } />
              <Route path="/register" element={
                <motion.div key="register" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                  <Register />
                </motion.div>
              } />
              <Route path="/join" element={
                <motion.div key="join" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                  <JoinQuiz />
                </motion.div>
              } />
              <Route path="/leaderboard/:sessionId" element={
                <motion.div key="leaderboard" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                  <Leaderboard />
                </motion.div>
              } />

              {/* Protected Routes */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <motion.div key="profile" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                    <Profile />
                  </motion.div>
                </ProtectedRoute>
              } />
              <Route path="/create" element={
                <ProtectedRoute>
                  <motion.div key="create" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                    <CreateQuiz />
                  </motion.div>
                </ProtectedRoute>
              } />
              <Route path="/quiz/:sessionId" element={
                <ProtectedRoute>
                  <motion.div key="quiz" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                    <QuizSession />
                  </motion.div>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <motion.div key="admin" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                    <AdminDashboard />
                  </motion.div>
                </ProtectedRoute>
              } />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </div>
      </Router>
    </QuizProvider>
  );
}

export default App;
