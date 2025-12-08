import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useQuiz } from '../context/QuizContext';
import NotificationCenter from '../components/NotificationCenter';
import Participants from '../components/Participants';
import Leaderboard from '../components/Leaderboard';
import LoadingSpinner from '../components/LoadingSpinner';
import QuizQuestion from '../components/QuizQuestion';
import QuizTimer from '../components/QuizTimer';
import '../styles/globals.css';

const HostSession = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentQuiz, setCurrentQuiz } = useQuiz();
  const socketRef = useRef(null);
  
  // Room state
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gameStatus, setGameStatus] = useState('lobby'); // lobby, question, feedback, ended
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Generate room code
  useEffect(() => {
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    
    const code = generateCode();
    setRoomCode(code);
    
    // Load quiz from context or localStorage
    const savedQuiz = JSON.parse(localStorage.getItem('currentQuiz'));
    if (savedQuiz) {
      setCurrentQuiz(savedQuiz);
    }
    
    // Connect to socket
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:10000', {
      auth: {
        token: localStorage.getItem('token'),
        userId: user?.id,
        username: user?.username
      }
    });
    
    socketRef.current = socket;
    
    // Emit host creation
    socket.emit('create-room', {
      roomCode: code,
      hostId: user?.id,
      hostName: user?.username,
      quiz: savedQuiz || currentQuiz
    });
    
    // Listen for events
    socket.on('room-created', (data) => {
      console.log('Room created:', data);
      setLoading(false);
    });
    
    socket.on('player-joined', (player) => {
      setPlayers(prev => [...prev, player]);
      // Show notification
      NotificationCenter.add({
        type: 'info',
        message: `${player.username} joined the room`,
        duration: 3000
      });
    });
    
    socket.on('player-left', (playerId) => {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    });
    
    socket.on('quiz-started', () => {
      setQuizStarted(true);
      setGameStatus('question');
      // Send first question
      sendQuestion(0);
    });
    
    socket.on('all-answers-received', (data) => {
      setGameStatus('feedback');
      // Show results for 3 seconds
      setTimeout(() => {
        if (currentQuestionIndex + 1 < (savedQuiz?.questions?.length || currentQuiz?.questions?.length)) {
          sendQuestion(currentQuestionIndex + 1);
        } else {
          endQuiz();
        }
      }, 3000);
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      NotificationCenter.add({
        type: 'error',
        message: error.message || 'Connection error',
        duration: 5000
      });
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  
  const sendQuestion = (index) => {
    const quiz = currentQuiz || JSON.parse(localStorage.getItem('currentQuiz'));
    if (!quiz || !quiz.questions || index >= quiz.questions.length) {
      endQuiz();
      return;
    }
    
    setCurrentQuestionIndex(index);
    const question = quiz.questions[index];
    setCurrentQuestion(question);
    setTimeRemaining(question.timeLimit || 30);
    setGameStatus('question');
    
    // Send to all players
    socketRef.current.emit('send-question', {
      roomCode,
      question: {
        ...question,
        index,
        totalQuestions: quiz.questions.length
      }
    });
    
    // Start timer
    startTimer(question.timeLimit || 30);
  };
  
  const startTimer = (duration) => {
    let timeLeft = duration;
    const timer = setInterval(() => {
      timeLeft--;
      setTimeRemaining(timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(timer);
        // Time's up - collect answers
        socketRef.current.emit('question-time-up', { roomCode, questionIndex: currentQuestionIndex });
        setGameStatus('feedback');
      }
    }, 1000);
    
    return () => clearInterval(timer);
  };
  
  const endQuiz = () => {
    setGameStatus('ended');
    socketRef.current.emit('end-quiz', { roomCode });
    
    // Calculate final scores
    const finalScores = players.map(p => ({
      id: p.id,
      username: p.username,
      score: p.score || 0,
      correctAnswers: p.correctAnswers || 0
    })).sort((a, b) => b.score - a.score);
    
    setLeaderboard(finalScores);
    
    // Navigate to results after delay
    setTimeout(() => {
      navigate('/results', { state: { roomCode, scores: finalScores } });
    }, 5000);
  };
  
  const handleStartQuiz = () => {
    if (players.length === 0) {
      NotificationCenter.add({
        type: 'warning',
        message: 'Wait for players to join before starting',
        duration: 3000
      });
      return;
    }
    
    setQuizStarted(true);
    socketRef.current.emit('start-quiz', { roomCode });
  };
  
  const copyRoomLink = () => {
    const link = `${window.location.origin}/join/${roomCode}`;
    navigator.clipboard.writeText(link);
    NotificationCenter.add({
      type: 'success',
      message: 'Room link copied to clipboard!',
      duration: 2000
    });
  };
  
  if (loading) {
    return <LoadingSpinner message="Creating your quiz room..." />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 p-6 bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Hosting Quiz Session
            </h1>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Room Code:</span>
                <span className="text-2xl font-bold text-cyan-300 tracking-wider">{roomCode}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Host:</span>
                <span className="font-medium">{user?.username}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              onClick={copyRoomLink}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-all hover:scale-105"
            >
              📋 Copy Invite
            </button>
            {!quizStarted && (
              <button
                onClick={handleStartQuiz}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-green-500/20"
              >
                ▶ Start Quiz
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Players */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl border border-gray-700 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">👥 Players ({players.length})</h2>
                <div className="px-4 py-1 bg-cyan-500/20 text-cyan-300 rounded-full font-medium">
                  {players.length} online
                </div>
              </div>
              
              <Participants players={players} />
              
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">📋 Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigator.clipboard.writeText(roomCode)}
                    className="p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors"
                  >
                    📋 Copy Code
                  </button>
                  <button
                    onClick={() => window.open(`/join/${roomCode}`, '_blank')}
                    className="p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
                  >
                    🔗 Open Join Page
                  </button>
                </div>
              </div>
            </div>
            
            {/* Current Game Status */}
            <div className="mt-6 bg-gray-800/40 backdrop-blur-lg rounded-2xl border border-gray-700 p-6">
              <h3 className="text-xl font-bold mb-4">🎮 Game Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={`font-semibold ${gameStatus === 'lobby' ? 'text-yellow-400' : gameStatus === 'question' ? 'text-green-400' : 'text-blue-400'}`}>
                    {gameStatus.toUpperCase()}
                  </span>
                </div>
                {quizStarted && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current Question</span>
                      <span className="font-bold">
                        {currentQuestionIndex + 1} / {currentQuiz?.questions?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time Remaining</span>
                      <span className={`font-bold ${timeRemaining < 10 ? 'text-red-400' : 'text-green-400'}`}>
                        {timeRemaining}s
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Center Panel - Question/Game */}
          <div className="lg:col-span-2">
            {!quizStarted ? (
              <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl border border-gray-700 p-8 text-center">
                <div className="text-6xl mb-6">🎯</div>
                <h2 className="text-3xl font-bold mb-4">Waiting for Players</h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  Share the room code with players. The quiz will begin automatically when you click "Start Quiz".
                </p>
                
                <div className="max-w-md mx-auto">
                  <div className="p-4 bg-gray-900/50 rounded-xl mb-4">
                    <div className="text-sm text-gray-400 mb-2">Invite Link</div>
                    <div className="flex">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/join/${roomCode}`}
                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg"
                      />
                      <button
                        onClick={copyRoomLink}
                        className="px-4 bg-cyan-600 hover:bg-cyan-700 rounded-r-lg font-medium"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-gray-900/30 rounded-xl">
                      <div className="text-2xl font-bold text-cyan-300">{currentQuiz?.questions?.length || 0}</div>
                      <div className="text-sm text-gray-400">Questions</div>
                    </div>
                    <div className="p-4 bg-gray-900/30 rounded-xl">
                      <div className="text-2xl font-bold text-green-300">{players.length}</div>
                      <div className="text-sm text-gray-400">Players Ready</div>
                    </div>
                    <div className="p-4 bg-gray-900/30 rounded-xl">
                      <div className="text-2xl font-bold text-purple-300">
                        {currentQuiz?.category || 'General'}
                      </div>
                      <div className="text-sm text-gray-400">Category</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : gameStatus === 'question' && currentQuestion ? (
              <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl border border-gray-700 p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Question {currentQuestionIndex + 1}</div>
                    <h2 className="text-2xl font-bold">{currentQuestion.text}</h2>
                  </div>
                  <QuizTimer time={timeRemaining} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {currentQuestion.options?.map((option, idx) => (
                    <div key={idx} className="p-4 bg-gray-900/50 rounded-xl border border-gray-700 hover:border-cyan-500/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-lg font-bold">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <div className="font-medium">{option.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-center text-gray-400">
                  Players answering: {players.filter(p => p.hasAnswered).length} / {players.length}
                </div>
              </div>
            ) : gameStatus === 'feedback' ? (
              <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl border border-gray-700 p-8 text-center">
                <div className="text-6xl mb-6">📊</div>
                <h2 className="text-3xl font-bold mb-4">Question Results</h2>
                <p className="text-gray-400 mb-8">Next question starting soon...</p>
                <div className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-bold animate-pulse">
                  Loading next question...
                </div>
              </div>
            ) : null}
            
            {/* Leaderboard */}
            {players.length > 0 && (
              <div className="mt-6">
                <Leaderboard players={players} showHeader={true} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostSession;
