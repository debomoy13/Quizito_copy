// src/pages/HostSession.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuiz } from '../context/QuizContext'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import { 
  Users, 
  Copy, 
  QrCode, 
  Play,
  Share2,
  CheckCircle,
  UserPlus,
  Clock
} from 'lucide-react'
import toast from 'react-hot-toast'

const HostSession = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { createSession, getSession } = useQuiz()
  const { socket, isConnected } = useSocket()
  const { user } = useAuth()
  
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [participants, setParticipants] = useState([])
  const [quiz, setQuiz] = useState(null)

  const quizId = new URLSearchParams(location.search).get('quizId')

  useEffect(() => {
    if (quizId) {
      createNewSession(quizId)
    }
  }, [quizId])

  useEffect(() => {
    if (!socket || !session) return

    // Listen for participants joining
    socket.on('participants-update', (updatedParticipants) => {
      setParticipants(updatedParticipants)
    })

    // Listen for quiz start from socket
    socket.on('quiz-started', (data) => {
      toast.success('Quiz started!')
      navigate(`/play/${session.roomCode}`)
    })

    return () => {
      socket.off('participants-update')
      socket.off('quiz-started')
    }
  }, [socket, session, navigate])

  const createNewSession = async (quizId) => {
    setLoading(true)
    try {
      const sessionData = await createSession(quizId)
      setSession(sessionData.session)
      
      // Join socket room as host
      if (socket) {
        socket.emit('join-room', {
          roomCode: sessionData.roomCode,
          username: user.username,
          userId: user._id
        })
      }
      
      // Fetch session details
      const sessionDetails = await getSession(sessionData.roomCode)
      setParticipants(sessionDetails.participants || [])
      setQuiz(sessionDetails.quizId)
      
      toast.success('Session created! Share the room code with participants.')
    } catch (error) {
      toast.error('Failed to create session')
      navigate('/create-quiz')
    } finally {
      setLoading(false)
    }
  }

  const copyRoomCode = () => {
    if (session?.roomCode) {
      navigator.clipboard.writeText(session.roomCode)
      toast.success('Room code copied to clipboard!')
    }
  }

  const copyJoinLink = () => {
    const joinLink = `${window.location.origin}/play/${session?.roomCode}`
    navigator.clipboard.writeText(joinLink)
    toast.success('Join link copied!')
  }

  const startQuiz = () => {
    if (socket && session) {
      socket.emit('start-quiz', { roomCode: session.roomCode })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Creating your session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No session found</p>
          <button
            onClick={() => navigate('/create-quiz')}
            className="btn-primary mt-4"
          >
            Create a Quiz First
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Session Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Hosting Session</h1>
                  <p className="text-gray-600">
                    Share the room code below with participants
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`} />
                  <span className="text-sm font-medium">
                    {isConnected ? 'Live' : 'Disconnected'}
                  </span>
                </div>
              </div>

              {/* Room Code */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room Code
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-6xl font-bold text-center gradient-text tracking-wider">
                      {session.roomCode}
                    </div>
                  </div>
                  <button
                    onClick={copyRoomCode}
                    className="btn-secondary flex items-center space-x-2 px-6"
                  >
                    <Copy size={20} />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              {/* Join Link */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Join Link
                </label>
                <div className="flex gap-4">
                  <div className="flex-1 bg-gray-100 rounded-xl p-4 font-mono text-sm truncate">
                    {window.location.origin}/play/{session.roomCode}
                  </div>
                  <button
                    onClick={copyJoinLink}
                    className="btn-primary flex items-center space-x-2 px-6"
                  >
                    <Share2 size={20} />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Users className="text-primary-600" size={24} />
                  <h2 className="text-2xl font-bold">Participants</h2>
                  <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full font-bold">
                    {participants.length}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock size={20} />
                  <span>Waiting for players...</span>
                </div>
              </div>

              {participants.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {participants.map((participant, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-100 hover:border-primary-200 transition-colors"
                    >
                      <div className="relative">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.username}`}
                          alt={participant.username}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
                      </div>
                      <div>
                        <h3 className="font-bold">{participant.username}</h3>
                        <p className="text-sm text-gray-500">Ready to play</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserPlus className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500">Waiting for participants to join...</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Share the room code above to invite players
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Controls */}
          <div className="space-y-8">
            {/* Quiz Info */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h3 className="text-xl font-bold mb-4">Quiz Details</h3>
              {quiz ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-700">Title</h4>
                    <p className="text-lg font-bold">{quiz.title}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Questions</h4>
                    <p className="text-2xl font-bold text-primary-600">
                      {quiz.questions?.length || 0}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Difficulty</h4>
                    <span className={`badge ${
                      quiz.difficulty === 'easy' ? 'badge-success' :
                      quiz.difficulty === 'medium' ? 'badge-warning' :
                      'badge-danger'
                    }`}>
                      {quiz.difficulty}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Loading quiz details...</p>
              )}
            </div>

            {/* Host Controls */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h3 className="text-xl font-bold mb-6">Host Controls</h3>
              
              <div className="space-y-4">
                <button
                  onClick={startQuiz}
                  disabled={participants.length === 0 || !isConnected}
                  className="w-full btn-primary text-lg py-4 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={24} />
                  <span>Start Quiz</span>
                </button>

                <p className="text-sm text-gray-500 text-center">
                  {participants.length === 0 
                    ? 'Waiting for at least 1 participant...'
                    : `Ready with ${participants.length} participant(s)`
                  }
                </p>
              </div>

              {/* Quick Actions */}
              <div className="mt-8 pt-8 border-t">
                <h4 className="font-semibold text-gray-700 mb-4">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={copyRoomCode}
                    className="p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors flex flex-col items-center justify-center"
                  >
                    <Copy className="text-gray-600 mb-2" size={24} />
                    <span className="text-sm font-medium">Copy Code</span>
                  </button>
                  <button
                    onClick={() => {
                      // Generate QR code (simplified)
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.origin}/play/${session.roomCode}`
                      window.open(qrUrl, '_blank')
                    }}
                    className="p-4 rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors flex flex-col items-center justify-center"
                  >
                    <QrCode className="text-gray-600 mb-2" size={24} />
                    <span className="text-sm font-medium">QR Code</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-3xl p-6">
              <h4 className="font-bold text-gray-800 mb-3">💡 Host Tips</h4>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="text-green-500 mt-0.5" size={16} />
                  <span className="text-sm">Wait for all participants before starting</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="text-green-500 mt-0.5" size={16} />
                  <span className="text-sm">Share screen for in-person events</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="text-green-500 mt-0.5" size={16} />
                  <span className="text-sm">Use a timer for each question</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HostSession