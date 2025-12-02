// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QuizProvider } from './context/QuizContext';
import Home from './pages/Home';
import CreateQuiz from './pages/CreateQuiz';
import JoinQuiz from './pages/JoinQuiz';
import QuizSession from './pages/QuizSession';
import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <QuizProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
          <Navbar />
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateQuiz />} />
            <Route path="/join" element={<JoinQuiz />} />
            <Route path="/quiz/:sessionId" element={<QuizSession />} />
            <Route path="/leaderboard/:sessionId" element={<Leaderboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </div>
      </Router>
    </QuizProvider>
  );
}

export default App;
