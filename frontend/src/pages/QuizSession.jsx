// src/QuizSession.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from './components/QuizContext';
import toast from 'react-hot-toast';
import QuizQuestion from './components/QuizQuestion';
import Leaderboard from './components/Leaderboard';
import Chat from './components/Chat';
import Participants from './components/Participants';
import QuizTimer from './components/QuizTimer';
import QuizResults from './components/QuizResults';
import ProgressBar from './components/ProgressBar';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const QuizSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { socket, user, currentQuiz, leaderboard, loading, submitAnswer, isConnected } = useQuiz();
  
  const [sessionData, setSessionData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizStatus, setQuizStatus] = useState('waiting'); // waiting, active, completed
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [quizTimer, setQuizTimer] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [quizResults, setQuizResults] = useState(null);
  const [quizStats, setQuizStats] = useState({
    correctAnswers: 0,
    totalAnswered: 0,
    streak: 0,
    bestStreak: 0,
    averageTime: 0
  });
  
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const questionTimeRef = useRef(null);

  // Initialize session
  useEffect(() => {
    if (!socket || !user || !sessionId) {
      toast.error('Unable to join session');
      navigate('/join-quiz');
      return;
    }

    const joinSession = async () => {
      try {
        socket.emit('join-session', {
          sessionId,
          userId: user.id || user._id,
          username: user.username
        });

        toast.success('Joining quiz session...');
      } catch (error) {
        toast.error('Failed to join session');
        navigate('/join-quiz');
      }
    };

    joinSession();

    return () => {
      if (socket) {
        socket.emit('leave-session', { sessionId, userId: user?.id || user?._id });
      }
      clearInterval(timerRef.current);
    };
  }, [socket, user, sessionId, navigate]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleSessionJoined = (data) => {
      setSessionData(data.session);
      setParticipants(data.session.participants || []);
      setQuizStatus(data.session.status);
      toast.success(`Joined session: ${data.session.quizId?.title || 'Unknown Quiz'}`);
    };

    const handleQuizStarted = (data) => {
      setQuizStatus('active');
      setCurrentQuestion(0);
      setSessionData(data.session);
      setTimeRemaining(data.session.settings?.timePerQuestion || 30);
      startTimeRef.current = Date.now();
      questionTimeRef.current = Date.now();
      
      toast.success('Quiz has started! Good luck!');
      startQuestionTimer();
    };

    const handleNextQuestion = (data) => {
      setCurrentQuestion(data.questionIndex);
      setSelectedAnswer(null);
      setAnswerSubmitted(false);
      setTimeRemaining(data.session.settings?.timePerQuestion || 30);
      questionTimeRef.current = Date.now();
      
      clearInterval(timerRef.current);
      startQuestionTimer();
      
      toast.info(`Question ${data.questionIndex + 1} of ${data.session.quizId?.questions?.length || 10}`);
    };

    const handleAnswerFeedback = (data) => {
      setAnswerSubmitted(true);
      
      if (data.isCorrect) {
        setQuizStats(prev => ({
          ...prev,
          correctAnswers: prev.correctAnswers + 1,
          streak: prev.streak + 1,
          bestStreak: Math.max(prev.bestStreak, prev.streak + 1)
        }));
        
        toast.success(`Correct! +${data.pointsEarned} points`);
      } else {
        setQuizStats(prev => ({
          ...prev,
          streak: 0
        }));
        
        toast.error('Incorrect answer');
      }
      
      setQuizStats(prev => ({
        ...prev,
        totalAnswered: prev.totalAnswered + 1,
        averageTime: ((prev.averageTime * (prev.totalAnswered - 1)) + 
          (Date.now() - questionTimeRef.current)) / prev.totalAnswered
      }));
    };

    const handleLeaderboardUpdate = (data) => {
      setLeaderboard(data);
    };

    const handleQuizEnded = (data) => {
      setQuizStatus('completed');
      setQuizResults(data.results);
      clearInterval(timerRef.current);
      
      // Show confetti if user did well
      const userResult = data.results?.find(r => r.userId === (user.id || user._id));
      if (userResult?.rank && userResult.rank <= 3) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
      
      toast.success('Quiz completed! Check your results.');
    };

    const handleParticipantJoined = (data) => {
      setParticipants(data.participants);
      toast(`${data.username} joined the quiz`);
    };

    const handleParticipantLeft = (data) => {
      setParticipants(data.participants);
      toast(`${data.username} left the quiz`);
    };

    const handleNewMessage = (message) => {
      setChatMessages(prev => [...prev, message]);
    };

    const handleError = (error) => {
      toast.error(error.message || 'An error occurred');
    };

    // Register event listeners
    socket.on('session-joined', handleSessionJoined);
    socket.on('quiz-started', handleQuizStarted);
    socket.on('next-question', handleNextQuestion);
    socket.on('answer-feedback', handleAnswerFeedback);
    socket.on('leaderboard-update', handleLeaderboardUpdate);
    socket.on('quiz-ended', handleQuizEnded);
    socket.on('participant-joined', handleParticipantJoined);
    socket.on('participant-left', handleParticipantLeft);
    socket.on('new-message', handleNewMessage);
    socket.on('error', handleError);

    return () => {
      socket.off('session-joined', handleSessionJoined);
      socket.off('quiz-started', handleQuizStarted);
      socket.off('next-question', handleNextQuestion);
      socket.off('answer-feedback', handleAnswerFeedback);
      socket.off('leaderboard-update', handleLeaderboardUpdate);
      socket.off('quiz-ended', handleQuizEnded);
      socket.off('participant-joined', handleParticipantJoined);
      socket.off('participant-left', handleParticipantLeft);
      socket.off('new-message', handleNewMessage);
      socket.off('error', handleError);
    };
  }, [socket, user]);

  // Question timer
  const startQuestionTimer = () => {
    clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUp = () => {
    if (!answerSubmitted && selectedAnswer !== null) {
      handleSubmitAnswer();
    } else if (!answerSubmitted) {
      toast.error('Time\'s up! Moving to next question');
      // Auto-submit blank answer
      submitAnswer(currentQuestion, -1, 30);
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    if (answerSubmitted) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || answerSubmitted) return;
    
    const timeTaken = Math.floor((Date.now() - questionTimeRef.current) / 1000);
    
    submitAnswer(
      currentQuestion,
      selectedAnswer,
      timeTaken
    );
    
    setAnswerSubmitted(true);
  };

  const handleSendMessage = (message) => {
    if (!socket || !sessionId || !user) return;
    
    socket.emit('send-message', {
      sessionId,
      userId: user.id || user._id,
      message
    });
  };

  const getCurrentQuestionData = () => {
    if (!sessionData?.quizId?.questions) return null;
    
    const question = sessionData.quizId.questions[currentQuestion];
    return {
      ...question,
      questionIndex: currentQuestion,
      totalQuestions: sessionData.quizId.questions.length
    };
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connecting to Quiz...</h2>
          <p className="text-gray-600">Please wait while we connect you to the quiz session</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (quizStatus === 'completed' && quizResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-6">
        {showConfetti && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
          />
        )}
        
        <QuizResults 
          results={quizResults}
          sessionData={sessionData}
          user={user}
          onRetake={() => window.location.reload()}
          onGoHome={() => navigate('/')}
        />
      </div>
    );
  }

  const questionData = getCurrentQuestionData();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {sessionData?.quizId?.title || 'Quiz Session'}
              </h1>
              <p className="text-gray-600 mt-1">
                Session Code: <span className="font-mono font-bold text-indigo-600">{sessionId}</span>
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  quizStatus === 'active' ? 'bg-green-100 text-green-800' :
                  quizStatus === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {quizStatus.toUpperCase()}
                </span>
                <span className="text-sm text-gray-500">
                  {participants.length} participant(s)
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <QuizTimer 
                timeRemaining={timeRemaining}
                totalTime={sessionData?.settings?.timePerQuestion || 30}
                isActive={quizStatus === 'active' && !answerSubmitted}
              />
              
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Leave Quiz
              </button>
            </div>
          </div>
          
          {quizStatus === 'active' && questionData && (
            <ProgressBar 
              current={currentQuestion + 1}
              total={questionData.totalQuestions}
            />
          )}
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quiz Content */}
          <div className="lg:col-span-2 space-y-6">
            {quizStatus === 'waiting' ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-lg p-8 text-center"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-indigo-100 flex items-center justify-center">
                  <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Waiting for Host to Start
                </h2>
                <p className="text-gray-600 mb-6">
                  The quiz will begin shortly. Get ready!
                </p>
                <div className="animate-pulse">
                  <div className="w-32 h-3 bg-indigo-200 rounded-full mx-auto"></div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Tips</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">Read questions carefully</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">Time management is key</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-800">Stay focused and calm</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">Trust your first instinct</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : quizStatus === 'active' && questionData ? (
              <QuizQuestion
                question={questionData}
                selectedAnswer={selectedAnswer}
                onAnswerSelect={handleAnswerSelect}
                onSubmit={handleSubmitAnswer}
                answerSubmitted={answerSubmitted}
                timeRemaining={timeRemaining}
              />
            ) : null}
            
            {/* Stats Panel */}
            {quizStatus === 'active' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-700">{quizStats.correctAnswers}</p>
                    <p className="text-sm text-blue-600">Correct</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">{quizStats.streak}</p>
                    <p className="text-sm text-green-600">Current Streak</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-700">{quizStats.bestStreak}</p>
                    <p className="text-sm text-purple-600">Best Streak</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-700">
                      {Math.round(quizStats.averageTime / 1000)}s
                    </p>
                    <p className="text-sm text-orange-600">Avg Time</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Side Panels */}
          <div className="space-y-6">
            {/* Leaderboard */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Live Leaderboard</h3>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                <Leaderboard 
                  data={leaderboard}
                  currentUser={user}
                  highlightCurrentUser={true}
                />
              </div>
            </div>
            
            {/* Participants */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Participants ({participants.length})</h3>
              </div>
              <div className="p-4 max-h-64 overflow-y-auto">
                <Participants participants={participants} />
              </div>
            </div>
            
            {/* Chat */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Live Chat</h3>
              </div>
              <div className="h-64 flex flex-col">
                <Chat 
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  disabled={quizStatus !== 'active'}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Host Controls (only visible to host) */}
        {sessionData?.hostId === (user?.id || user?._id) && quizStatus === 'waiting' && (
          <div className="mt-6 bg-indigo-50 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-indigo-900 mb-4">Host Controls</h3>
            <div className="flex gap-4">
              <button
                onClick={() => socket.emit('start-quiz', { sessionId })}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Start Quiz
              </button>
              <button
                onClick={() => toast.info('Feature coming soon!')}
                className="px-6 py-3 bg-white text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
              >
                Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizSession;
