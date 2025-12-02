// src/QuizContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const QuizContext = createContext();

export const QuizProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('quizito_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quizResults, setQuizResults] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      toast.success('Connected to quiz server!');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      toast.error('Disconnected from server');
    });

    newSocket.on('quizStarted', (quizData) => {
      setCurrentQuiz(quizData);
      toast.success('Quiz has started!');
    });

    newSocket.on('leaderboardUpdate', (data) => {
      setLeaderboard(data);
    });

    newSocket.on('quizEnded', (results) => {
      setQuizResults(results);
      toast.success('Quiz completed! Check your results');
    });

    newSocket.on('error', (error) => {
      toast.error(error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Save user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('quizito_user', JSON.stringify(user));
    }
  }, [user]);

  const joinQuiz = useCallback(async (sessionId, username) => {
    setLoading(true);
    try {
      if (!socket) throw new Error('Not connected to server');
      
      const response = await fetch(`http://localhost:5000/api/quiz/join/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      
      if (data.success) {
        socket.emit('joinQuiz', { sessionId, username });
        setUser({ username, sessionId, userId: data.userId });
        toast.success(`Joined quiz as ${username}!`);
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [socket]);

  const createQuiz = useCallback(async (quizData) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(quizData).forEach(key => {
        if (quizData[key]) formData.append(key, quizData[key]);
      });

      const response = await fetch('http://localhost:5000/api/quiz/create', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Quiz created successfully!');
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitAnswer = useCallback((questionId, selectedOption, timeTaken) => {
    if (!socket || !user) {
      toast.error('Not connected or not in a quiz');
      return;
    }

    socket.emit('submitAnswer', {
      sessionId: user.sessionId,
      questionId,
      selectedOption,
      timeTaken,
      username: user.username,
      userId: user.userId,
    });
  }, [socket, user]);

  const startQuiz = useCallback((sessionId) => {
    if (socket) {
      socket.emit('startQuiz', { sessionId });
    }
  }, [socket]);

  const value = {
    socket,
    user,
    currentQuiz,
    leaderboard,
    isConnected,
    loading,
    quizResults,
    joinQuiz,
    createQuiz,
    submitAnswer,
    startQuiz,
    setUser,
    setCurrentQuiz,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within QuizProvider');
  }
  return context;
};
