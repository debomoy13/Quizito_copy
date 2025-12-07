// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth()
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:10000'

  useEffect(() => {
    if (!isAuthenticated || !token) return

    const newSocket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('Socket connected:', newSocket.id)
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Socket disconnected')
    })

    newSocket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    // Authenticate socket
    newSocket.emit('authenticate', token)

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [isAuthenticated, token, SOCKET_URL])

  const joinRoom = (roomCode, username, userId) => {
    if (socket) {
      socket.emit('join-room', { roomCode, username, userId })
    }
  }

  const startQuiz = (roomCode) => {
    if (socket) {
      socket.emit('start-quiz', { roomCode })
    }
  }

  const submitAnswer = (roomCode, userId, questionIndex, selectedOption, timeTaken) => {
    if (socket) {
      socket.emit('submit-answer', {
        roomCode,
        userId,
        questionIndex,
        selectedOption,
        timeTaken
      })
    }
  }

  const generateQuiz = (roomCode, topic) => {
    if (socket) {
      socket.emit('generate-quiz', { roomCode, topic })
    }
  }

  const endQuiz = (roomCode) => {
    if (socket) {
      socket.emit('end-quiz', { roomCode })
    }
  }

  const value = {
    socket,
    isConnected,
    joinRoom,
    startQuiz,
    submitAnswer,
    generateQuiz,
    endQuiz
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}