import React, { useState, useEffect } from 'react';
import { Trophy, Users, Brain, Upload, Plus, Play, Crown, Star, Medal, Target, Zap, BookOpen, Award, Clock, TrendingUp } from 'lucide-react';

const QuizitoPlatform = () => {
  const [view, setView] = useState('home');
  const [user, setUser] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [participants, setParticipants] = useState([]);
  const [badges, setBadges] = useState([]);

  // Sample data
  const sampleQuizzes = [
    {
      id: 1,
      title: "JavaScript Fundamentals",
      category: "Programming",
      difficulty: "Medium",
      questions: 10,
      participants: 234,
      timeLimit: 30,
      type: "multiplayer"
    },
    {
      id: 2,
      title: "World Geography",
      category: "General Knowledge",
      difficulty: "Easy",
      questions: 15,
      participants: 456,
      timeLimit: 25,
      type: "solo"
    },
    {
      id: 3,
      title: "Data Structures",
      category: "Computer Science",
      difficulty: "Hard",
      questions: 12,
      participants: 128,
      timeLimit: 45,
      type: "team"
    }
  ];

  const sampleLeaderboard = [
    { rank: 1, name: "Alex Thompson", score: 9850, avatar: "AT", streak: 15, badges: 8 },
    { rank: 2, name: "Sarah Chen", score: 9420, avatar: "SC", streak: 12, badges: 6 },
    { rank: 3, name: "Mike Johnson", score: 8990, avatar: "MJ", streak: 10, badges: 5 },
    { rank: 4, name: "Emily Davis", score: 8540, avatar: "ED", streak: 8, badges: 4 },
    { rank: 5, name: "Chris Lee", score: 8120, avatar: "CL", streak: 7, badges: 3 }
  ];

  const sampleQuestion = {
    id: 1,
    question: "What is the output of: console.log(typeof null)?",
    options: ["null", "undefined", "object", "error"],
    correctAnswer: 2,
    timeLimit: 30,
    points: 100
  };

  useEffect(() => {
    setQuizzes(sampleQuizzes);
    setLeaderboard(sampleLeaderboard);
  }, []);

  useEffect(() => {
    if (activeQuiz && !showResult && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult) {
      handleAnswerSubmit();
    }
  }, [timeLeft, activeQuiz, showResult]);

  const handleLogin = (username) => {
    setUser({ name: username, score: 0, badges: [], level: 1 });
    setView('dashboard');
  };

  const handleStartQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestion(0);
    setScore(0);
    setTimeLeft(30);
    setShowResult(false);
    setView('quiz');
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === sampleQuestion.correctAnswer) {
      const points = Math.floor((timeLeft / 30) * 100);
      setScore(score + points);
    }
    setShowResult(true);
    setTimeout(() => {
      if (currentQuestion < 9) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeLeft(30);
      } else {
        setView('results');
      }
    }, 2000);
  };

  const AIQuizGenerator = () => {
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('medium');
    const [numQuestions, setNumQuestions] = useState(10);
    const [generating, setGenerating] = useState(false);

    const handleGenerate = () => {
      setGenerating(true);
      setTimeout(() => {
        setGenerating(false);
        alert(`✅ AI Quiz Generated!\n\nTopic: ${topic}\nQuestions: ${numQuestions}\nDifficulty: ${difficulty}`);
      }, 2000);
    };

    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-8 h-8 text-purple-600" />
          <h2 className="text-3xl font-bold text-gray-800">AI Quiz Generator</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Quiz Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., React Hooks, World War II, Python Basics"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Questions</label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              >
                <option value="5">5 Questions</option>
                <option value="10">10 Questions</option>
                <option value="15">15 Questions</option>
                <option value="20">20 Questions</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload PDF (Optional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Drag & drop PDF or click to browse</p>
              <p className="text-sm text-gray-400 mt-1">AI will extract content and generate questions</p>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!topic || generating}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating Quiz...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                Generate Quiz with AI
              </span>
            )}
          </button>
        </div>
      </div>
    );
  };

  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-transform">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4">
            <Trophy className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Quizito
          </h1>
          <p className="text-gray-600 text-lg">Real-Time Quiz Platform</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="text-gray-700">Multiplayer Live Quizzes</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
            <Brain className="w-5 h-5 text-pink-600" />
            <span className="text-gray-700">AI-Powered Quiz Generation</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Trophy className="w-5 h-5 text-blue-600" />
            <span className="text-gray-700">Real-Time Leaderboards</span>
          </div>
        </div>

        <input
          type="text"
          placeholder="Enter your name"
          onKeyPress={(e) => e.key === 'Enter' && e.target.value && handleLogin(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-4 focus:border-purple-500 focus:outline-none"
        />

        <button
          onClick={(e) => {
            const input = e.target.previousSibling;
            if (input.value) handleLogin(input.value);
          }}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
        >
          Start Playing
        </button>
      </div>
    </div>
  );

  const Dashboard = () => (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-800">Quizito</h1>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setView('create')} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Plus className="w-5 h-5" />
              Create Quiz
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{user?.name}</p>
                <p className="text-sm text-gray-500">Level {user?.level}</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-2xl shadow-lg">
            <Target className="w-8 h-8 mb-2" />
            <h3 className="text-3xl font-bold">{user?.score || 0}</h3>
            <p className="text-purple-200">Total Points</p>
          </div>
          <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white p-6 rounded-2xl shadow-lg">
            <Award className="w-8 h-8 mb-2" />
            <h3 className="text-3xl font-bold">{user?.badges?.length || 0}</h3>
            <p className="text-pink-200">Badges Earned</p>
          </div>
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg">
            <TrendingUp className="w-8 h-8 mb-2" />
            <h3 className="text-3xl font-bold">#{Math.floor(Math.random() * 100) + 1}</h3>
            <p className="text-blue-200">Global Rank</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Quizzes</h2>
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{quiz.title}</h3>
                      <p className="text-gray-600">{quiz.category}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      quiz.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                      quiz.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {quiz.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 mb-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {quiz.questions} Questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {quiz.timeLimit}s per question
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {quiz.participants} players
                    </span>
                  </div>
                  <button
                    onClick={() => handleStartQuiz(quiz)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Join Quiz
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Leaderboard</h2>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {leaderboard.map((player) => (
                <div key={player.rank} className="flex items-center gap-4 mb-4 last:mb-0 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    player.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                    player.rank === 2 ? 'bg-gray-300 text-gray-700' :
                    player.rank === 3 ? 'bg-orange-400 text-orange-900' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {player.rank}
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                    {player.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{player.name}</p>
                    <p className="text-sm text-gray-500">{player.score.toLocaleString()} pts</p>
                  </div>
                  {player.rank <= 3 && (
                    <Crown className={`w-5 h-5 ${
                      player.rank === 1 ? 'text-yellow-400' :
                      player.rank === 2 ? 'text-gray-400' :
                      'text-orange-400'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const QuizView = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-gray-800">
                Question {currentQuestion + 1}/10
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">{score} points</span>
              </div>
            </div>
            <div className={`text-3xl font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-purple-600'}`}>
              {timeLeft}s
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-gray-200 rounded-full h-2 mb-6">
              <div
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / 10) * 100}%` }}
              ></div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-6">{sampleQuestion.question}</h2>

            <div className="space-y-3">
              {sampleQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !showResult && setSelectedAnswer(index)}
                  disabled={showResult}
                  className={`w-full p-4 rounded-lg text-left font-semibold transition-all ${
                    showResult
                      ? index === sampleQuestion.correctAnswer
                        ? 'bg-green-500 text-white'
                        : index === selectedAnswer
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-400'
                      : selectedAnswer === index
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <span className="inline-block w-8 h-8 rounded-full bg-white bg-opacity-20 text-center leading-8 mr-3">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </button>
              ))}
            </div>
          </div>

          {!showResult && selectedAnswer !== null && (
            <button
              onClick={handleAnswerSubmit}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
            >
              Submit Answer
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Live Participants (5)
          </h3>
          <div className="flex gap-2">
            {['AT', 'SC', 'MJ', 'ED', 'CL'].map((avatar, i) => (
              <div key={i} className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                {avatar}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const ResultsView = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4">
            <Trophy className="w-20 h-20 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Quiz Complete!</h1>
          <p className="text-gray-600 text-lg">Great job, {user?.name}!</p>
        </div>

        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-8 mb-8">
          <div className="text-center">
            <h2 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {score}
            </h2>
            <p className="text-gray-700 text-xl">Total Points</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-gray-800">7/10</p>
            <p className="text-gray-600 text-sm">Correct</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-gray-800">70%</p>
            <p className="text-gray-600 text-sm">Accuracy</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-gray-800">#12</p>
            <p className="text-gray-600 text-sm">Rank</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setView('dashboard')}
            className="flex-1 bg-gray-200 text-gray-800 py-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => handleStartQuiz(activeQuiz)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {view === 'home' && <HomePage />}
      {view === 'dashboard' && <Dashboard />}
      {view === 'quiz' && <QuizView />}
      {view === 'results' && <ResultsView />}
      {view === 'create' && <AIQuizGenerator />}
    </div>
  );
};

export default QuizitoPlatform;