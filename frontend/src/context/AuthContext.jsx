// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('quizito_token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 🔥 Fix: Apply axios header IMMEDIATELY
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  // 🔥 Verify token AFTER axios header is set
  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const res = await axios.get(`${API_URL}/api/auth/me`)
        setUser(res.data.user)
      } catch (err) {
        console.error('Auth verify failed:', err)
        localStorage.removeItem('quizito_token')
        setToken(null)
        setUser(null)
      }

      setLoading(false)
    }

    verify()
  }, [token])

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password })

      const newToken = res.data.token
      const newUser = res.data.user

      localStorage.setItem('quizito_token', newToken)
      setToken(newToken)
      setUser(newUser)

      toast.success('Logged in successfully!')
      return { success: true }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
      return { success: false }
    }
  }

  const logout = () => {
    localStorage.removeItem('quizito_token')
    setToken(null)
    setUser(null)
    toast.success('Logged out')
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  )
}
