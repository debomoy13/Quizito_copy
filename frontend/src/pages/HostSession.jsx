import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { currentQuiz } = useQuiz();
  const socketRef = useRef(null);
  
  // Room state
  const [roomCode, setRoomCode] = useState('');
  const [participants, setParticipants] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameStatus, setGameStatus] = useState('lobby'); // lobby, question, feedback, ended
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [leaderboard, setLeaderboard] = useState([]);
  const quizData = useRef(null);
  
  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Get quiz from context or localStorage
        const quiz = currentQuiz || JSON.parse(localStorage.getItem('currentQuiz'));
        
        if (!quiz || !quiz._id) {
          setError('Quiz data not found. Please create or select a quiz first.');
          setTimeout(() => navigate('/create-quiz'), 2000);
          return;
        }

        quizData.current = quiz;

        // Create session via HTTP API
        const token = localStorage.getItem('quizito_token');
        const createSessionResponse = await fetch('http://localhost:10000/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            quizId: quiz._id,
            settings: {
              maxPlayers: 100,
              questionTime: quiz.questions?.[0]?.timeLimit || 30,
              showLeaderboard: true,
              allowLateJoin: true
            }
          })
        });

        if (!createSessionResponse.ok) {
          const errorData = await createSessionResponse.json();
          throw new Error(errorData.message || 'Failed to create session');
        }

        const sessionData = await createSessionResponse.json();
        const code = sessionData.session.roomCode;
        setRoomCode(code);

        // Connect to socket
        const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:10000', {
          reconnection: true,
          reconnectionAttempts: 5
        });

        socketRef.current = socket;

        // Authenticate socket
        socket.emit('authenticate', {
          token: token
        });

        socket.on('authenticated', () => {
          console.log('Host authenticated');
          // Join the session
          socket.emit('join-session', {
            roomCode: code
          });
        });

        // Successfully joined session
        socket.on('session-joined', (data) => {
          console.log('Host joined session:', data);
          setLoading(false);
          setParticipants(data.session?.participants || []);
        });

        // Participant joined
        socket.on('participant-joined', (data) => {
          console.log('Participant joined:', data);
          setParticipants(prev => {
            const exists = prev.find(p => p.userId === data.participant.userId);
            return exists ? prev : [...prev, data.participant];
          });
          NotificationCenter.add({
            type: 'info',
            message: `${data.participant?.username || 'A player'} joined the room`,
            duration: 3000
          });
        });

        // Participant left
        socket.on('participant-left', (data) => {
          setParticipants(prev => prev.filter(p => p.userId !== data.participantId));
        });

        // Session updated
        socket.on('session-updated', (data) => {
          if (data.session?.participants) {
            setParticipants(data.session.participants);
          }
        });

        // New question event from backend
        socket.on('new-question', (data) => {
          console.log('New question from server:', data);
          setCurrentQuestion(data.question);
          setCurrentQuestionIndex(data.questionIndex);
          setGameStatus('question');
          setTimeRemaining(data.question.timeLimit || 30);
        });

        // Time's up
        socket.on('question-time-up', (data) => {
          setGameStatus('feedback');
          setTimeout(() => {
            // Wait for next question from server
            setGameStatus('lobby');
          }, 3000);
        });

        // Quiz completed
        socket.on('quiz-completed', () => {
          setGameStatus('ended');
        });

        // Quiz ended
        socket.on('quiz-ended', (data) => {
          setGameStatus('ended');
          setLeaderboard(data.finalLeaderboard || data.participants || []);
          
          setTimeout(() => {
            navigate('/results', {
              state: { roomCode: code, scores: data.finalLeaderboard || [] }
            });
          }, 3000);
        });

        // Errors
        socket.on('error', (data) => {
          const errorMsg = typeof data === 'string' ? data : data?.message || 'Connection error';
          console.error('Socket error:', errorMsg);
          NotificationCenter.add({
            type: 'error',
            message: errorMsg,
            duration: 5000
          });
        });

        return () => {
          socket.disconnect();
        };

      } catch (err) {
        console.error('Session initialization error:', err);
        setError(err.message);
        NotificationCenter.add({
          type: 'error',
          message: err.message,
          duration: 5000
        });
      }
    };

    initializeSession();
  }, [navigate, currentQuiz]);

  const handleStartQuiz = () => {
    if (participants.length === 0) {
      NotificationCenter.add({
        type: 'warning',
        message: 'Wait for at least one player to join before starting',
        duration: 3000
      });
      return;
    }

    setQuizStarted(true);
    setGameStatus('question');
    
    // Emit start-quiz event to backend
    socketRef.current.emit('start-quiz', {
      roomCode
    });
  };

  const handleNextQuestion = () => {
    if (!roomCode) return;
    
    // Backend will handle advancing to next question
    socketRef.current.emit('next-question', {
      roomCode
    });
  };

  const handleEndQuiz = () => {
    if (!roomCode) return;
    
    socketRef.current.emit('end-quiz', {
      roomCode
    });
  };

  if (loading) {
    return <LoadingSpinner message="Setting up your quiz room..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 max-w-md">
          <h2 className="text-red-400 font-bold mb-2">Error</h2>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 p-6 bg-gray-800/40 backdrop-blur-lg rounded-2xl border border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Host Quiz Session</h1>
              <p className="text-gray-400">
                Room Code: <span className="text-cyan-300 font-bold text-2xl">{roomCode}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Host: {user?.username}</p>
              <p className="text-gray-400 text-sm">Status: {gameStatus.toUpperCase()}</p>
            </div>
          </div>
        </div>

        {!quizStarted ? (
          // Lobby view
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Participants list */}
            <div className="lg:col-span-2 bg-gray-800/40 backdrop-blur-lg rounded-2xl border border-gray-700 p-6">
              <h2 className="text-2xl font-bold mb-4">
                👥 Waiting Room ({participants.length})
              </h2>
              <div className="space-y-3">
                {participants.length > 0 ? (
                  participants.map(p => (
                    <div key={p.userId} className="flex items-center justify-between bg-gray-700/30 p-3 rounded-lg">
                      <div>
                        <p className="font-semibold">{p.username}</p>
                        <p className="text-xs text-gray-400">
                          {p.isHost ? '👑 Host' : 'Player'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Status:</p>
                        <p className="text-sm font-semibold text-green-400">{p.status}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    Waiting for players to join... Share room code {roomCode}
                  </p>
                )}
              </div>
            </div>

            {/* Start button and info */}
            <div className="space-y-4">
              <button
                onClick={handleStartQuiz}
                disabled={participants.length === 0}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition-all"
              >
                🎯 Start Quiz
              </button>

              <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl border border-gray-700 p-6">
                <h3 className="font-bold mb-4">Quiz Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Questions:</span>
                    <span>{quizData.current?.questions?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Players:</span>
                    <span>{participants.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-yellow-400">Waiting</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Quiz view
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Question display */}
            <div className="lg:col-span-2 bg-gray-800/40 backdrop-blur-lg rounded-2xl border border-gray-700 p-6">
              {currentQuestion ? (
                <>
                  <div className="mb-4">
                    <h2 className="text-xl font-bold mb-4">
                      Q{currentQuestionIndex + 1}/{quizData.current?.questions?.length}
                    </h2>
                    <h3 className="text-lg mb-6">{currentQuestion.text}</h3>
                    
                    {currentQuestion.options && (
                      <div className="space-y-3">
                        {currentQuestion.options.map((option, i) => (
                          <div
                            key={i}
                            className="p-3 border border-gray-600 rounded-lg hover:bg-gray-700/50 transition"
                          >
                            {option.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {gameStatus === 'question' && (
                    <div className="mt-6 flex gap-2">
                      <QuizTimer time={timeRemaining} isActive={true} />
                      <button
                        onClick={handleNextQuestion}
                        className="ml-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
                      >
                        Next Question
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-400">Waiting for question...</p>
              )}
            </div>

            {/* Leaderboard */}
            <div className="bg-gray-800/40 backdrop-blur-lg rounded-2xl border border-gray-700 p-6">
              <h3 className="text-lg font-bold mb-4">📊 Scores</h3>
              <div className="space-y-2 text-sm">
                {participants.length > 0 ? (
                  participants
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .map((p, i) => (
                      <div key={p.userId} className="flex justify-between">
                        <span>{i + 1}. {p.username}</span>
                        <span className="font-bold text-green-400">{p.score || 0}</span>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-400">No players yet</p>
                )}
              </div>

              {quizStarted && (
                <button
                  onClick={handleEndQuiz}
                  className="w-full mt-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold"
                >
                  End Quiz
                </button>
              )}
            </div>
          </div>
        )}

        {gameStatus === 'ended' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-8 text-center max-w-md">
              <h2 className="text-3xl font-bold mb-4">Quiz Ended!</h2>
              <p className="text-gray-400 mb-6">Redirecting to results...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostSession;
