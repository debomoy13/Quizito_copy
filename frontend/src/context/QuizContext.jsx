// src/context/QuizContext.jsx
import React, { createContext, useState, useContext } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000'

const QuizContext = createContext()

export const useQuiz = () => useContext(QuizContext)

export const QuizProvider = ({ children }) => {
  const [quizzes, setQuizzes] = useState([])
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchQuizzes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/quizzes`)
      setQuizzes(res.data.quizzes)
    } catch (err) {
      toast.error("Failed to fetch quizzes")
    }
  }

  // ⭐ FIXED: Correct backend parameter names
  const generateAIQuiz = async (topic, numQuestions, difficulty) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/ai/generate-quiz`,
        {
          topic,          // FIXED
          numQuestions,   // FIXED
          difficulty      // FIXED
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("quizito_token")}`,
          }
        }
      )

      return res.data.quiz
    } catch (err) {
      toast.error("Failed to generate quiz")
      throw err
    }
  }

  const createQuiz = async (quizData) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/quizzes`,
        quizData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("quizito_token")}`,
          }
        }
      )
      return res.data.quiz
    } catch (err) {
      toast.error("Failed to create quiz")
      throw err
    }
  }

  return (
    <QuizContext.Provider
      value={{
        quizzes,
        currentQuiz,
        sessions,
        loading,
        fetchQuizzes,
        generateAIQuiz,
        createQuiz,
        setCurrentQuiz
      }}
    >
      {children}
    </QuizContext.Provider>
  )
}
