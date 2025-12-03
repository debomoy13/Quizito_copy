// src/pages/QuizSession.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../QuizContext';
import { motion, AnimatePresence } from 'framer-motion';
import Countdown from 'react-countdown';
import Confetti from 'react-confetti';
import {
  Brain, Clock, Trophy, Users, Zap, CheckCircle, XCircle,
  ChevronRight, BarChart, Award, Timer, Sparkles, Crown
} from 'lucide-react';
import QuizQuestion from '../components/QuizQuestion';
import Leaderboard from '../components/Leaderboard';
import toast from 'react-hot-toast';

const QuizSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const {
    socket,
    user,
    currentQuiz,
    leaderboard,
    submitAnswer,
    isConnected
  } = useQuiz();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizEnded, setQuizEnded] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [playersCount, setPlayersCount] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const timerRef = useRef(null);

  const questions = currentQuiz?.questions || [
    {
      id: 1,
      text: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: 2
    }
  ];

  const currentQ = questions[currentQuestion];

  useEffect(() => {
    if (!socket || !user) return;

    // Listen for quiz events
    socket.on('quizStarted', (data) => {
      setQuizStarted(true);
      toast.success('Quiz has started!');
    });

    socket.on('questionChanged', (data) => {
      setCurrentQuestion(data.questionIndex);
      setSelectedOption(null);
      setTimeLeft(30);
      setQuestionStartTime(Date.now());
    });

    socket.on('quizEnded', (data) => {
      setQuizEnded(true);
      setShowConfetti(true);
      toast.success('Quiz completed! Check your results');
      setTimeout(() => setShowConfetti(false), 5000);
    });

    socket.on('playerJoined', (data) => {
      setPlayersCount(data.count);
      toast.success(`${data.username} joined the quiz!`);
    });

    socket.on('playerLeft', (data) => {
      setPlayersCount(data.count);
    });

    // Cleanup
    return () => {
      if (socket) {
        socket.off('quizStarted');
        socket.off('questionChanged');
        socket.off('quizEnded');
        socket.off('playerJoined');
        socket.off('playerLeft');
      }
    };
  }, [socket, user]);

  useEffect(() => {
    if (quizStarted && !quizEnded && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizStarted, quizEnded, timeLeft]);

  const handleOptionSelect = (optionIndex) => {
    if (selectedOption !== null || quizEnded) return;
    
    setSelectedOption(optionIndex);
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    
    // Submit answer
    submitAnswer(currentQ.id, optionIndex, timeTaken);
    
    // Show immediate feedback
    const isCorrect = optionIndex === currentQ.correctAnswer;
    if (isCorrect) {
      toast.success('Correct! 🎉');
    } else {
      toast.error('Incorrect! 😢');
    }

    // Auto-advance after 2 seconds
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedOption(null);
        setTimeLeft(30);
        setQuestionStartTime(Date.now());
      } else {
        setShowResults(true);
      }
    }, 2000);
  };

  const handleTimeUp = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (selectedOption === null) {
      submitAnswer(currentQ.id, -1, 30); // Time's up
      toast('Time\'s up! ⏰', { icon: '⏰' });
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedOption(null);
        setTimeLeft(30);
        setQuestionStartTime(Date.now());
      } else {
        setShowResults(true);
      }
    }, 1500);
  };

  const calculateScore = () => {
    // This would come from backend, but for demo:
    const baseScore = 1000;
    const timeBonus = Math.max(0, 30 - (Date.now() - questionStartTime) / 1000) * 10;
    const correctBonus = selectedOption === currentQ.correctAnswer ? 500 : 0;
    return baseScore + timeBonus + correctBonus;
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Not Joined</h2>
          <p className="text-gray-600 mb-6">You need to join the quiz first!</p>
          <button
            onClick={() => navigate('/join')}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg"
          >
            Join Quiz
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
        {showConfetti && <Confetti />}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-block mb-6"
              >
                <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Trophy className="text-white" size={48} />
                </div>
              </motion.div>
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Quiz Complete! 🎉</h1>
              <p className="text-xl text-gray-600">You answered all {questions.length} questions</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl">
                <div className="text-5xl font-bold text-blue-600 mb-2">8/10</div>
                <div className="text-gray-600">Score</div>
                <div className="mt-4 text-sm text-blue-500 font-semibold">
                  <Zap className="inline mr-2" size={16} />
                  Top 20% of players
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                <div className="text-5xl font-bold text-green-600 mb-2">12.4s</div>
                <div className="text-gray-600">Avg Response Time</div>
                <div className="mt-4 text-sm text-green-500 font-semibold">
                  <Clock className="inline mr-2" size={16} />
                  Lightning Fast ⚡
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
                <div className="text-5xl font-bold text-purple-600 mb-2">#3</div>
                <div className="text-gray-600">Rank</div>
                <div className="mt-4 text-sm text-purple-500 font-semibold">
                  <Crown className="inline mr-2" size={16} />
                  On the podium! 🏆
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-6">
              <button
                onClick={() => navigate('/')}
                className="px-8 py-3 bg-gradient-to-r from-gray-700 to-black text-white rounded-xl font-semibold hover:shadow-lg"
              >
                Back to Home
              </button>
              <button
                onClick={() => navigate(`/leaderboard/${sessionId}`)}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg flex items-center"
              >
                <Trophy className="mr-2" size={20} />
                View Leaderboard
              </button>
            </div>
          </div>

          <Leaderboard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Top Bar */}
      <div className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center py-4 space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="text-indigo-400" size={24} />
                <span className="text-xl font-bold text-white">Quizito</span>
              </div>
              <div className="hidden md:block px-3 py-1 bg-gray-700 rounded-full">
                <span className="text-sm font-mono text-gray-300">#{sessionId}</span>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Users className="text-green-400" size={20} />
                <span className="text-white font-semibold">{playersCount}</span>
                <span className="text-gray-400 text-sm">players</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Zap className="text-yellow-400" size={20} />
                <span className="text-white font-semibold">{currentQuestion + 1}</span>
                <span className="text-gray-400 text-sm">/ {questions.length}</span>
              </div>

              <div className={`flex items-center space-x-2 ${timeLeft < 10 ? 'animate-pulse' : ''}`}>
                <Timer className={timeLeft < 10 ? 'text-red-400' : 'text-blue-400'} size={20} />
                <div className="text-2xl font-bold text-white">{timeLeft}s</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Game */}
          <div className="lg:col-span-2">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Question Card */}
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-lg rounded-3xl border border-gray-700 p-8 mb-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Brain className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-300">Question</h3>
                    <h2 className="text-2xl font-bold text-white">#{currentQuestion + 1}</h2>
                  </div>
                </div>
                
                <div className="px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl">
                  <div className="text-sm font-semibold text-yellow-400">+{calculateScore()} points</div>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 leading-tight">
                {currentQ?.text || "Loading question..."}
              </h1>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQ?.options?.map((option, index) => {
                  const isSelected = selectedOption === index;
                  const isCorrect = currentQ.correctAnswer === index;
                  const showCorrect = selectedOption !== null;
                  
                  return (
                    <motion.button
                      key={index}
                      whileHover={{ scale: selectedOption === null ? 1.02 : 1 }}
                      whileTap={{ scale: selectedOption === null ? 0.98 : 1 }}
                      onClick={() => handleOptionSelect(index)}
                      disabled={selectedOption !== null}
                      className={`p-6 rounded-2xl text-left transition-all duration-300 ${
                        isSelected
                          ? isCorrect
                            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500'
                            : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border-2 border-red-500'
                          : showCorrect && isCorrect
                          ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/50'
                          : 'bg-gray-700/50 hover:bg-gray-700 border-2 border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? isCorrect
                                ? 'bg-green-500'
                                : 'bg-red-500'
                              : showCorrect && isCorrect
                              ? 'bg-green-500/20'
                              : 'bg-gray-600'
                          }`}>
                            <span className="font-bold text-white">
                              {String.fromCharCode(65 + index)}
                            </span>
                          </div>
                          <span className="text-lg font-medium text-white">
                            {option}
                          </span>
                        </div>
                        
                        {isSelected && (
                          <div>
                            {isCorrect ? (
                              <CheckCircle className="text-green-400" size={24} />
                            ) : (
                              <XCircle className="text-red-400" size={24} />
                            )}
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Feedback */}
              {selectedOption !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-8 p-6 rounded-2xl ${
                    selectedOption === currentQ.correctAnswer
                      ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30'
                      : 'bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/30'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {selectedOption === currentQ.correctAnswer ? (
                      <>
                        <CheckCircle className="text-green-400 mt-1" size={24} />
                        <div>
                          <h4 className="text-xl font-bold text-green-400 mb-2">Correct! 🎉</h4>
                          <p className="text-gray-300">
                            Great job! You earned <span className="font-bold text-yellow-400">+{calculateScore()} points</span>.
                            {timeLeft > 20 && " Lightning fast! ⚡"}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="text-red-400 mt-1" size={24} />
                        <div>
                          <h4 className="text-xl font-bold text-red-400 mb-2">Incorrect</h4>
                          <p className="text-gray-300">
                            The correct answer is: <span className="font-bold text-green-400">{currentQ.options[currentQ.correctAnswer]}</span>
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Player Info */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl border border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{user?.username}</h3>
                    <p className="text-sm text-gray-400">Playing now</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400">4,250</div>
                  <div className="text-sm text-gray-400">Your Score</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Leaderboard */}
          <div className="lg:col-span-1">
            <Leaderboard compact={true} />
            
            {/* Game Stats */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl border border-gray-700 p-6 mt-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <BarChart className="mr-2" size={20} />
                Game Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Questions Left</span>
                  <span className="text-white font-bold">{questions.length - currentQuestion - 1}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Your Rank</span>
                  <span className="text-yellow-400 font-bold">#3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Avg Time</span>
                  <span className="text-green-400 font-bold">12.4s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Accuracy</span>
                  <span className="text-blue-400 font-bold">80%</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-3xl p-6 mt-6">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-between transition-colors">
                  <span>Share Quiz</span>
                  <ChevronRight size={20} />
                </button>
                <button className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-between transition-colors">
                  <span>View Analytics</span>
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full px-4 py-3 bg-gradient-to-r from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30 text-red-400 rounded-xl transition-colors"
                >
                  Leave Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSession;
