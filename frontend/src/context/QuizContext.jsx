// src/context/QuizContext.jsx
import React, { createContext, useState, useContext } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000'

const QuizContext = createContext()

export const useQuiz = () => {
  const context = useContext(QuizContext)
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider')
  }
  return context
}

export const QuizProvider = ({ children }) => {
  const [quizzes, setQuizzes] = useState([])
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchQuizzes = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/quizzes`)
      setQuizzes(response.data.quizzes)
    } catch (error) {
      toast.error('Failed to fetch quizzes')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const createQuiz = async (quizData) => {
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/quizzes`, quizData)
      toast.success('Quiz created successfully')
      return response.data.quiz
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create quiz')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const generateAIQuiz = async (topic, numQuestions, difficulty ) => {
    setLoading(true)
    try {
      const response = await axios.post(`${API_URL}/api/ai/generate`, {
        topic,
        numQuestions,
        difficulty
      })
      toast.success('AI quiz generated successfully')
      return response.data.quiz
    } catch (error) {
      toast.error('Failed to generate AI quiz')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const createSession = async (quizId) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/sessions`,
      { quizId },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("quizito_token")}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;

  } catch (error) {
    console.error("Create Session ERROR:", error.response?.data || error);
    toast.error(error.response?.data?.message || "Failed to create session");
    throw error;
  }
};

  const getSession = async (roomCode) => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/sessions/${roomCode}`)
      return response.data.session
    } catch (error) {
      toast.error('Failed to fetch session')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const saveResults = async (roomCode, answers, timeSpent) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/sessions/${roomCode}/save-results`,
        { answers, timeSpent }
      )
      return response.data
    } catch (error) {
      toast.error('Failed to save results')
      throw error
    }
  }

  const getAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/analytics/me`)
      return response.data
    } catch (error) {
      toast.error('Failed to fetch analytics')
      throw error
    }
  }

  const value = {
    quizzes,
    currentQuiz,
    sessions,
    loading,
    fetchQuizzes,
    createQuiz,
    generateAIQuiz,
    createSession,
    getSession,
    saveResults,
    getAnalytics,
    setCurrentQuiz,
  }

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  )
}
