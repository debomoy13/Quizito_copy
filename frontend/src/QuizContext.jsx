// src/QuizContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';

const QuizContext = createContext();

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://quizito-backend.onrender.com/api',
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('quizito_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const QuizProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('quizito_user');
    const savedToken = localStorage.getItem('quizito_token');
    return savedUser && savedToken ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('quizito_token') || null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Initialize socket connection with auth token
  useEffect(() => {
    if (!token) return;

    const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://quizito-backend.onrender.com/api',
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to socket server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
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

    newSocket.on('auth_error', () => {
      toast.error('Authentication failed. Please login again.');
      logout();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // Register function
  const register = useCallback(async (userData) => {
    setAuthLoading(true);
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('quizito_token', token);
      localStorage.setItem('quizito_user', JSON.stringify(user));
      
      setToken(token);
      setUser(user);
      
      toast.success('Account created successfully!');
      return { success: true, user };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return { success: false, error: error.response?.data };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    setAuthLoading(true);
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('quizito_token', token);
      localStorage.setItem('quizito_user', JSON.stringify(user));
      
      setToken(token);
      setUser(user);
      
      toast.success('Login successful!');
      return { success: true, user };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Google Login function
  const googleLogin = useCallback(() => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/auth/google`;
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('quizito_token');
    localStorage.removeItem('quizito_user');
    setToken(null);
    setUser(null);
    setCurrentQuiz(null);
    setLeaderboard([]);
    
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    toast.success('Logged out successfully');
  }, [socket]);

  // Update profile function
  const updateProfile = useCallback(async (profileData) => {
    setAuthLoading(true);
    try {
      const response = await api.put('/auth/profile', profileData);
      const updatedUser = response.data.user;
      
      localStorage.setItem('quizito_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      toast.success('Profile updated successfully!');
      return { success: true, user: updatedUser };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
      return { success: false, error: error.response?.data };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Change password function
  const changePassword = useCallback(async (passwordData) => {
    setAuthLoading(true);
    try {
      await api.put('/auth/change-password', passwordData);
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password change failed');
      return { success: false, error: error.response?.data };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Verify token on app load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) return;

      try {
        await api.get('/auth/verify');
        // Token is valid
      } catch (error) {
        // Token is invalid or expired
        if (error.response?.status === 401) {
          logout();
          toast.error('Session expired. Please login again.');
        }
      }
    };

    verifyToken();
  }, [token, logout]);

  const value = {
    socket,
    user,
    token,
    currentQuiz,
    leaderboard,
    isConnected,
    loading,
    authLoading,
    quizResults,
    api,
    register,
    login,
    googleLogin,
    logout,
    updateProfile,
    changePassword,
    joinQuiz: useCallback(async (sessionId, username) => {
      setLoading(true);
      try {
        const response = await api.post(`/quiz/join/${sessionId}`, { username });
        const data = response.data;
        
        if (socket && data.success) {
          socket.emit('joinQuiz', { sessionId, username });
          setUser(prev => ({ ...prev, sessionId, username }));
          toast.success(`Joined quiz as ${username}!`);
          return data;
        } else {
          throw new Error(data.message || 'Failed to join quiz');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    }, [socket, api]),
    createQuiz: useCallback(async (quizData) => {
      setLoading(true);
      try {
        const formData = new FormData();
        Object.keys(quizData).forEach(key => {
          if (quizData[key]) formData.append(key, quizData[key]);
        });

        const response = await api.post('/quiz/create', formData);
        const data = response.data;
        
        if (data.success) {
          toast.success('Quiz created successfully!');
          return data;
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    }, [api]),
    submitAnswer: useCallback((questionId, selectedOption, timeTaken) => {
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
        userId: user._id || user.id,
      });
    }, [socket, user]),
    startQuiz: useCallback((sessionId) => {
      if (socket) {
        socket.emit('startQuiz', { sessionId });
      }
    }, [socket]),
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
