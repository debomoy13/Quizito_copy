// src/pages/PlayQuiz.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import { useQuiz } from '../context/QuizContext'
import LiveLeaderboard from '../components/session/LiveLeaderboard'
import QuestionDisplay from '../components/quiz/QuestionDisplay'
import { 
  Trophy, 
  Users, 
  Clock, 
  CheckCircle,
  XCircle,
  Award,
  ChevronRight
} from 'lucide-react'
import Countdown from 'react-countdown'

const PlayQuiz = () => {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { socket, isConnected, submitAnswer } = useSocket()
  const { user } = useAuth()
  const { getSession, saveResults } = useQuiz()
  
  const [session, setSession] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const [leaderboard, setLeaderboard] = useState([])
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizEnded, setQuizEnded] = useState(false)
  const [answers, setAnswers] = useState([])
  const [questionStartTime, setQuestionStartTime] = useState(null)
  
  const timerRef = useRef(null)

  useEffect(() => {
    if (!roomCode || !user) return

    const fetchSession = async () => {
      try {
        const sessionData = await getSession(roomCode)
        setSession(sessionData)
        setQuiz(sessionData.quizId)
        setQuizStarted(sessionData.status === 'in-progress')
        setCurrentQuestion(sessionData.currentQuestion || 0)
      } catch (error) {
        console.error('Failed to fetch session:', error)
        navigate('/')
      }
    }

    fetchSession()

    // Join socket room
    if (socket) {
      socket.emit('join-room', {
        roomCode,
        username: user.username,
        userId: user._id
      })
    }
  }, [roomCode, user, socket, getSession, navigate])

  useEffect(() => {
    if (!socket) return

    // Socket listeners
    socket.on('quiz-started', (data) => {
      setQuizStarted(true)
      setCurrentQuestion(0)
      setQuestionStartTime(Date.now())
    })

    socket.on('leaderboard-update', (updatedLeaderboard) => {
      setLeaderboard(updatedLeaderboard)
    })

    socket.on('quiz-ended', (data) => {
      setQuizEnded(true)
      handleQuizEnd()
    })

    return () => {
      socket.off('quiz-started')
      socket.off('leaderboard-update')
      socket.off('quiz-ended')
    }
  }, [socket])

  useEffect(() => {
    if (!quizStarted || !quiz) return

    // Start timer for current question
    const question = quiz.questions[currentQuestion]
    const timeLimit = question?.timeLimit || 30
    
    setTimeRemaining(timeLimit)
    setSelectedOption(null)
    setQuestionStartTime(Date.now())

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [currentQuestion, quizStarted, quiz])

  const handleOptionSelect = (option) => {
    if (selectedOption || !quizStarted || quizEnded) return
    
    setSelectedOption(option)
    
    // Calculate time taken
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000)
    
    // Submit answer
    submitAnswer(
      roomCode,
      user._id,
      currentQuestion,
      option,
      timeTaken
    )

    // Save answer locally
    setAnswers(prev => [...prev, {
      questionIndex: currentQuestion,
      selectedOption: option,
      timeTaken
    }])

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const handleTimeout = () => {
    if (!selectedOption) {
      // Auto-submit if time runs out
      submitAnswer(
        roomCode,
        user._id,
        currentQuestion,
        null,
        30
      )
      
      setAnswers(prev => [...prev, {
        questionIndex: currentQuestion,
        selectedOption: null,
        timeTaken: 30,
        timedOut: true
      }])
    }
  }

  const handleQuizEnd = async () => {
    try {
      const timeSpent = answers.reduce((total, ans) => total + (ans.timeTaken || 0), 0)
      await saveResults(roomCode, answers, timeSpent)
      navigate(`/results/${session._id}`)
    } catch (error) {
      console.error('Failed to save results:', error)
    }
  }

  const getOptionClass = (option) => {
    if (!quizEnded && !selectedOption) return ''
    
    const question = quiz?.questions[currentQuestion]
    if (!question) return ''
    
    const isCorrectOption = question.correctAnswer === option
    const isSelected = selectedOption === option
    
    if (quizEnded) {
      if (isCorrectOption) return 'correct'
      if (isSelected && !isCorrectOption) return 'incorrect'
    } else if (selectedOption) {
      if (isSelected) {
        return isCorrectOption ? 'correct' : 'incorrect'
      }
      if (isCorrectOption) return 'correct'
    }
    
    return ''
  }

  if (!session || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading quiz session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
            <p className="text-gray-300">Room: {roomCode}</p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="flex items-center space-x-2">
                <Users size={20} />
                <span className="text-xl font-bold">{leaderboard.length}</span>
              </div>
              <p className="text-sm text-gray-400">Players</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center space-x-2">
                <Trophy size={20} />
                <span className="text-xl font-bold">#{leaderboard.findIndex(p => p.userId === user._id) + 1 || '-'}</span>
              </div>
              <p className="text-sm text-gray-400">Your Rank</p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className={`flex items-center space-x-2 mb-8 ${
          isConnected ? 'text-green-400' : 'text-red-400'
        }`}>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Question & Options */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-3xl p-8 mb-8">
              {/* Question Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Question</div>
                  <div className="text-2xl font-bold">
                    {currentQuestion + 1} / {quiz.questions.length}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-400 mb-1">Time Remaining</div>
                  <div className={`text-3xl font-bold ${
                    timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-green-400'
                  }`}>
                    {timeRemaining}s
                  </div>
                </div>
              </div>

              {/* Question Text */}
              {quizStarted ? (
                <>
                  <div className="mb-10">
                    <h2 className="text-3xl font-bold leading-relaxed">
                      {quiz.questions[currentQuestion]?.question}
                    </h2>
                  </div>

                  {/* Options */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {['A', 'B', 'C', 'D'].map((letter, index) => {
                      const option = quiz.questions[currentQuestion]?.options[index]?.text
                      return option ? (
                        <button
                          key={index}
                          onClick={() => handleOptionSelect(option)}
                          disabled={!!selectedOption || quizEnded}
                          className={`quiz-option text-left p-6 rounded-2xl transition-all duration-300 ${
                            getOptionClass(option)
                          } ${selectedOption === option ? 'selected' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center font-bold">
                                {letter}
                              </div>
                              <span className="text-lg">{option}</span>
                            </div>
                            {selectedOption === option && (
                              quiz.questions[currentQuestion]?.correctAnswer === option ? (
                                <CheckCircle className="text-green-400" size={24} />
                              ) : (
                                <XCircle className="text-red-400" size={24} />
                              )
                            )}
                          </div>
                        </button>
                      ) : null
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                    <Award size={48} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Waiting for Host to Start</h3>
                  <p className="text-gray-400">
                    Get ready! The quiz will begin soon.
                  </p>
                </div>
              )}
            </div>

            {/* Feedback & Navigation */}
            {quizStarted && selectedOption && currentQuestion < quiz.questions.length - 1 && (
              <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xl mb-2">Answer Submitted!</h3>
                    <p className="opacity-90">
                      {quiz.questions[currentQuestion]?.correctAnswer === selectedOption
                        ? 'Correct! 🎉'
                        : 'Not quite right 😅'
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentQuestion(prev => prev + 1)
                      setSelectedOption(null)
                    }}
                    className="bg-white text-primary-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center space-x-2"
                  >
                    <span>Next Question</span>
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Leaderboard */}
          <div>
            <div className="sticky top-8">
              <LiveLeaderboard 
                leaderboard={leaderboard}
                currentUser={user}
                session={session}
              />
              
              {/* Quiz Stats */}
              <div className="bg-gray-800 rounded-2xl p-6 mt-6">
                <h3 className="font-bold text-xl mb-4">Quiz Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Difficulty</span>
                    <span className="font-bold">{quiz.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Questions</span>
                    <span className="font-bold">{quiz.questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time per Question</span>
                    <span className="font-bold">30s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your Score</span>
                    <span className="font-bold text-green-400">
                      {leaderboard.find(p => p.userId === user._id)?.score || 0} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-br from-primary-900/30 to-accent-900/30 rounded-2xl p-6 mt-6">
                <h4 className="font-bold mb-3">🎮 How to Play</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-400 rounded-full mt-1.5" />
                    <span>Select your answer before time runs out</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-400 rounded-full mt-1.5" />
                    <span>Faster answers earn bonus points</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-primary-400 rounded-full mt-1.5" />
                    <span>Watch your rank on the leaderboard</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayQuiz