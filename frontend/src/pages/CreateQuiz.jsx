// src/pages/CreateQuiz.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuiz } from '../context/QuizContext'
import { useAuth } from '../context/AuthContext'
import AIGenerator from '../components/ai/AIGenerator'
import QuizCreator from '../components/quiz/QuizCreator'
import { Brain, FileText, Upload, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

const CreateQuiz = () => {
  const { createQuiz, generateAIQuiz } = useQuiz()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('ai')
  const [loading, setLoading] = useState(false)

  const handleAIGenerate = async (topic, numQuestions, difficulty) => {
    setLoading(true)
    try {
      const quiz = await generateAIQuiz(topic, numQuestions, difficulty)
      navigate(`/host-session?quizId=${quiz._id}`)
      toast.success('Quiz generated! Ready to host session.')
    } catch (error) {
      console.error('Failed to generate quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManualCreate = async (quizData) => {
    setLoading(true)
    try {
      const quiz = await createQuiz({
        ...quizData,
        createdBy: user._id
      })
      navigate(`/host-session?quizId=${quiz._id}`)
      toast.success('Quiz created! Ready to host session.')
    } catch (error) {
      console.error('Failed to create quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    {
      id: 'ai',
      label: 'AI Generator',
      icon: <Brain size={20} />,
      description: 'Generate quizzes instantly using AI'
    },
    {
      id: 'manual',
      label: 'Manual Creator',
      icon: <FileText size={20} />,
      description: 'Create custom quizzes from scratch'
    },
    {
      id: 'upload',
      label: 'Upload',
      icon: <Upload size={20} />,
      description: 'Upload quizzes from files'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-100 to-accent-100 px-4 py-2 rounded-full mb-4">
            <Sparkles className="text-primary-600" size={20} />
            <span className="text-primary-700 font-semibold">
              Create Amazing Quizzes
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Create Your Quiz</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Choose your preferred method to create engaging quizzes for your audience
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 justify-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center p-6 rounded-2xl transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-white shadow-xl border-2 border-primary-200'
                    : 'bg-gray-50 hover:bg-white hover:shadow-lg border-2 border-transparent'
                }`}
              >
                <div className={`p-3 rounded-xl mb-3 ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.icon}
                </div>
                <h3 className="font-bold text-lg mb-1">{tab.label}</h3>
                <p className="text-sm text-gray-500 text-center max-w-[200px]">
                  {tab.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {activeTab === 'ai' && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">AI Quiz Generator</h2>
                <p className="text-gray-600">
                  Enter a topic and let our AI create a complete quiz for you
                </p>
              </div>
              <AIGenerator onGenerate={handleAIGenerate} loading={loading} />
            </div>
          )}

          {activeTab === 'manual' && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Manual Quiz Creator</h2>
                <p className="text-gray-600">
                  Create custom quizzes with full control over every question
                </p>
              </div>
              <QuizCreator onCreate={handleManualCreate} loading={loading} />
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="animate-fade-in text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center">
                  <Upload className="text-primary-600" size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-3">Coming Soon</h3>
                <p className="text-gray-600 mb-8">
                  Upload quizzes from PDF, DOC, or CSV files. This feature is currently in development.
                </p>
                <button
                  onClick={() => setActiveTab('ai')}
                  className="btn-primary"
                >
                  Try AI Generator Instead
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <h4 className="font-bold text-blue-800 mb-2">🎯 Pro Tip</h4>
            <p className="text-blue-700 text-sm">
              Use specific topics for better AI-generated questions. 
              Example: "Renaissance Art" instead of just "Art"
            </p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-6">
            <h4 className="font-bold text-green-800 mb-2">⚡ Quick Start</h4>
            <p className="text-green-700 text-sm">
              Generate with AI first, then customize questions to make them perfect for your audience
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6">
            <h4 className="font-bold text-purple-800 mb-2">📊 Best Practices</h4>
            <p className="text-purple-700 text-sm">
              Mix easy, medium, and hard questions to keep all participants engaged
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateQuiz