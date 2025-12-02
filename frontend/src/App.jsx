// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QuizProvider } from './QuizContext';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import CreateQuiz from './pages/CreateQuiz';
import JoinQuiz from './pages/JoinQuiz';
import QuizSession from './pages/QuizSession';
import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import './index.css';

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
              <Route path="/" element={
                <motion.div
                  key="home"
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <Home />
                </motion.div>
              } />
              <Route path="/create" element={
                <motion.div
                  key="create"
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <CreateQuiz />
                </motion.div>
              } />
              <Route path="/join" element={
                <motion.div
                  key="join"
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <JoinQuiz />
                </motion.div>
              } />
              <Route path="/quiz/:sessionId" element={
                <motion.div
                  key="quiz"
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <QuizSession />
                </motion.div>
              } />
              <Route path="/leaderboard/:sessionId" element={
                <motion.div
                  key="leaderboard"
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <Leaderboard />
                </motion.div>
              } />
              <Route path="/admin" element={
                <motion.div
                  key="admin"
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                >
                  <AdminDashboard />
                </motion.div>
              } />
            </Routes>
          </AnimatePresence>
        </div>
      </Router>
    </QuizProvider>
  );
}

export default App;
