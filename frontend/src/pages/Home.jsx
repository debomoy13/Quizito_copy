// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "../components/QuizContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const Home = () => {
  const navigate = useNavigate();
  const { user, api, logout } = useQuiz();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [stats, setStats] = useState(null);

  // Load quizzes and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch public quizzes
        const quizzesResponse = await api.get("/quizzes");
        setQuizzes(quizzesResponse.data.quizzes || []);
        
        // Try to fetch user stats
        try {
          const statsResponse = await api.get("/analytics/me");
          setStats(statsResponse.data.overview || {});
        } catch (statsError) {
          console.log("Stats not available:", statsError.message);
          setStats({
            quizzesTaken: 0,
            correctAnswers: 0,
            totalAnswers: 0,
            averageScore: 0,
            bestScore: 0,
          });
        }
        
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, api]);

  // Handle quiz click
  const handleQuizClick = (quizId) => {
    navigate(`/quiz-session/${quizId}`);
  };

  // Handle create quiz
  const handleCreateQuiz = () => {
    navigate("/create-quiz");
  };

  // Handle join quiz
  const handleJoinQuiz = () => {
    navigate("/join-quiz");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Welcome back, {user?.username || "Quizzer"}! 🎯
        </h1>
        <p className="text-gray-600">
          Ready for your next quiz challenge? Test your knowledge or create your own!
        </p>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
        >
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl font-bold text-blue-600">{stats.quizzesTaken || 0}</div>
            <div className="text-gray-600 mt-2">Quizzes Taken</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl font-bold text-green-600">
              {stats.correctAnswers || 0}/{stats.totalAnswers || 0}
            </div>
            <div className="text-gray-600 mt-2">Correct Answers</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl font-bold text-purple-600">{stats.averageScore || 0}%</div>
            <div className="text-gray-600 mt-2">Average Score</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl font-bold text-yellow-600">{stats.bestScore || 0}</div>
            <div className="text-gray-600 mt-2">Best Score</div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
      >
        <button
          onClick={handleCreateQuiz}
          className="p-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-shadow text-white text-left"
        >
          <div className="text-2xl font-bold mb-2">➕ Create Quiz</div>
          <p className="text-blue-100">Design your own quiz with AI assistance</p>
        </button>
        
        <button
          onClick={handleJoinQuiz}
          className="p-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-shadow text-white text-left"
        >
          <div className="text-2xl font-bold mb-2">🎮 Join Quiz</div>
          <p className="text-purple-100">Enter a room code to join live quiz</p>
        </button>
      </motion.div>

      {/* Available Quizzes */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-10"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Available Quizzes</h2>
          <span className="text-gray-600">
            {quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'} available
          </span>
        </div>
        
        {quizzes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No quizzes available</h3>
            <p className="text-gray-600 mb-6">Be the first to create a quiz!</p>
            <button
              onClick={handleCreateQuiz}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create First Quiz
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.slice(0, 6).map((quiz) => (
              <div
                key={quiz._id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
                onClick={() => handleQuizClick(quiz._id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800 truncate">{quiz.title}</h3>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {quiz.category || "General"}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {quiz.description || "Test your knowledge with this quiz"}
                </p>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {quiz.questions?.length || 0} questions
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    quiz.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {quiz.difficulty || 'Medium'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Activity */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-md p-6"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-blue-600 text-2xl mb-2">🏆</div>
            <h4 className="font-semibold text-gray-800 mb-2">Earn Points</h4>
            <p className="text-gray-600 text-sm">Answer quickly and correctly to earn more points</p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-green-600 text-2xl mb-2">📊</div>
            <h4 className="font-semibold text-gray-800 mb-2">Track Progress</h4>
            <p className="text-gray-600 text-sm">Check your analytics to see your improvement</p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-purple-600 text-2xl mb-2">🤖</div>
            <h4 className="font-semibold text-gray-800 mb-2">AI Assistant</h4>
            <p className="text-gray-600 text-sm">Use AI to generate quizzes from any topic</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
