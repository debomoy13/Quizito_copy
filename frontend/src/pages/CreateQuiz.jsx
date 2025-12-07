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

  // ⭐ FIXED: Now receives TOPIC, NUM, DIFF
  const handleAIGenerate = async (topic, numQuestions, difficulty) => {
    setLoading(true)
    try {
      const quiz = await generateAIQuiz(topic, numQuestions, difficulty)
      navigate(`/host-session?quizId=${quiz._id}`)
      toast.success("Quiz generated! Ready to host session.")
    } catch (err) {
      console.error(err)
      toast.error("AI quiz generation failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto max-w-6xl px-4">

        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-primary-100 px-4 py-2 rounded-full mb-4">
            <Sparkles className="text-primary-600" size={20} />
            <span className="text-primary-700 font-semibold">Create Amazing Quizzes</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Create Your Quiz</h1>
          <p className="text-gray-600 text-lg">Choose how you want to create your quiz</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          {/* AI */}
          <button
            className={`p-6 rounded-2xl ${
              activeTab === 'ai' ? 'bg-white border-primary-200 border-2' : 'bg-gray-50'
            }`}
            onClick={() => setActiveTab('ai')}
          >
            <Brain size={22} />
            <p>AI Generator</p>
          </button>

          {/* Manual */}
          <button
            className={`p-6 rounded-2xl ${
              activeTab === 'manual' ? 'bg-white border-primary-200 border-2' : 'bg-gray-50'
            }`}
            onClick={() => setActiveTab('manual')}
          >
            <FileText size={22} />
            <p>Manual Creator</p>
          </button>

          {/* Upload */}
          <button className="p-6 rounded-2xl bg-gray-50">
            <Upload size={22} />
            <p>Upload</p>
          </button>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {activeTab === 'ai' && (
            <AIGenerator onGenerate={handleAIGenerate} loading={loading} setLoading={setLoading} />
          )}

          {activeTab === 'manual' && (
            <QuizCreator onCreate={createQuiz} loading={loading} />
          )}
        </div>

      </div>
    </div>
  )
}

export default CreateQuiz
