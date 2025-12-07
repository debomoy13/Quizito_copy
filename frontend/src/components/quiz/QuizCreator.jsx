// src/components/quiz/QuizCreator.jsx
import React, { useState } from 'react'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  Clock,
  Award,
  BarChart3,
  Hash,
  Type
} from 'lucide-react'

const QuizCreator = ({ onCreate, loading }) => {
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'medium',
    questions: []
  })

  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    type: 'multiple-choice',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    correctAnswer: '',
    points: 100,
    timeLimit: 30,
    difficulty: 'medium'
  })

  const categories = [
    'General Knowledge',
    'Science',
    'Technology',
    'History',
    'Geography',
    'Sports',
    'Entertainment',
    'Mathematics',
    'Literature',
    'Art',
    'Music',
    'Other'
  ]

  const difficulties = [
    { id: 'easy', label: 'Easy', color: 'bg-green-100 text-green-800' },
    { id: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'hard', label: 'Hard', color: 'bg-red-100 text-red-800' }
  ]

  const questionTypes = [
    { id: 'multiple-choice', label: 'Multiple Choice', icon: '📝' },
    { id: 'true-false', label: 'True/False', icon: '🔘' },
    { id: 'short-answer', label: 'Short Answer', icon: '✏️' }
  ]

  const handleQuizInfoChange = (field, value) => {
    setQuizData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleQuestionChange = (field, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleOptionChange = (index, field, value) => {
    const updatedOptions = [...currentQuestion.options]
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value
    }
    setCurrentQuestion(prev => ({
      ...prev,
      options: updatedOptions
    }))
  }

  const setCorrectAnswer = (index) => {
    const updatedOptions = currentQuestion.options.map((option, i) => ({
      ...option,
      isCorrect: i === index
    }))
    
    setCurrentQuestion(prev => ({
      ...prev,
      options: updatedOptions,
      correctAnswer: currentQuestion.options[index]?.text || ''
    }))
  }

  const addOption = () => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: [...prev.options, { text: '', isCorrect: false }]
    }))
  }

  const removeOption = (index) => {
    const updatedOptions = currentQuestion.options.filter((_, i) => i !== index)
    setCurrentQuestion(prev => ({
      ...prev,
      options: updatedOptions
    }))
  }

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      alert('Please enter a question')
      return
    }

    if (currentQuestion.type === 'multiple-choice' && 
        !currentQuestion.options.some(opt => opt.isCorrect)) {
      alert('Please mark at least one option as correct')
      return
    }

    const questionToAdd = { ...currentQuestion }

    // For true/false questions, auto-set options
    if (questionToAdd.type === 'true-false') {
      questionToAdd.options = [
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: false }
      ]
    }

    if (editingQuestionIndex !== null) {
      // Edit existing question
      const updatedQuestions = [...quizData.questions]
      updatedQuestions[editingQuestionIndex] = questionToAdd
      setQuizData(prev => ({ ...prev, questions: updatedQuestions }))
      setEditingQuestionIndex(null)
    } else {
      // Add new question
      setQuizData(prev => ({
        ...prev,
        questions: [...prev.questions, questionToAdd]
      }))
    }

    // Reset form for next question
    setCurrentQuestion({
      question: '',
      type: 'multiple-choice',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      correctAnswer: '',
      points: 100,
      timeLimit: 30,
      difficulty: 'medium'
    })
  }

  const editQuestion = (index) => {
    const question = quizData.questions[index]
    setCurrentQuestion({ ...question })
    setEditingQuestionIndex(index)
  }

  const deleteQuestion = (index) => {
    const updatedQuestions = quizData.questions.filter((_, i) => i !== index)
    setQuizData(prev => ({ ...prev, questions: updatedQuestions }))
  }

  const moveQuestion = (index, direction) => {
    const updatedQuestions = [...quizData.questions]
    const [movedQuestion] = updatedQuestions.splice(index, 1)
    updatedQuestions.splice(index + direction, 0, movedQuestion)
    setQuizData(prev => ({ ...prev, questions: updatedQuestions }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!quizData.title.trim()) {
      alert('Please enter a quiz title')
      return
    }

    if (quizData.questions.length === 0) {
      alert('Please add at least one question')
      return
    }

    onCreate(quizData)
  }

  return (
    <div className="space-y-8">
      {/* Quiz Information */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-200">
        <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
          <Type size={24} />
          <span>Quiz Information</span>
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quiz Title *
            </label>
            <input
              type="text"
              value={quizData.title}
              onChange={(e) => handleQuizInfoChange('title', e.target.value)}
              placeholder="Enter quiz title"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <select
              value={quizData.category}
              onChange={(e) => handleQuizInfoChange('category', e.target.value)}
              className="input-field"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={quizData.description}
              onChange={(e) => handleQuizInfoChange('description', e.target.value)}
              placeholder="Describe your quiz"
              className="input-field min-h-[100px] resize-y"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Overall Difficulty
            </label>
            <div className="flex gap-2">
              {difficulties.map((diff) => (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => handleQuizInfoChange('difficulty', diff.id)}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                    quizData.difficulty === diff.id
                      ? `${diff.color} ring-2 ring-offset-2 ring-opacity-50`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      {quizData.questions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center space-x-2">
              <Hash size={24} />
              <span>Questions ({quizData.questions.length})</span>
            </h3>
            <div className="flex items-center space-x-2 text-gray-600">
              <BarChart3 size={20} />
              <span>Total Points: {quizData.questions.reduce((sum, q) => sum + q.points, 0)}</span>
            </div>
          </div>

          <div className="space-y-4">
            {quizData.questions.map((question, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border-2 border-gray-200 hover:border-primary-200 transition-colors"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full font-bold">
                          Q{index + 1}
                        </span>
                        <span className={`badge ${
                          question.difficulty === 'easy' ? 'badge-success' :
                          question.difficulty === 'medium' ? 'badge-warning' :
                          'badge-danger'
                        }`}>
                          {question.difficulty}
                        </span>
                        <span className="text-sm text-gray-500">
                          {question.points} points
                        </span>
                      </div>
                      <h4 className="text-lg font-semibold mt-2">{question.question}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => editQuestion(index)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit question"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => deleteQuestion(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete question"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`p-3 rounded-lg border ${
                          option.isCorrect
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            option.isCorrect
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200'
                          }`}>
                            {String.fromCharCode(65 + optIndex)}
                          </div>
                          <span>{option.text}</span>
                          {option.isCorrect && (
                            <span className="badge-success text-xs px-2 py-1">
                              Correct
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question Creator Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-xl font-bold mb-6">
          {editingQuestionIndex !== null ? 'Edit Question' : 'Add New Question'}
        </h3>

        <div className="space-y-8">
          {/* Question Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              value={currentQuestion.question}
              onChange={(e) => handleQuestionChange('question', e.target.value)}
              placeholder="Enter your question here..."
              className="input-field min-h-[120px] resize-y"
              rows="3"
              required
            />
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Question Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {questionTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleQuestionChange('type', type.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    currentQuestion.type === type.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Question Settings */}
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <Award size={16} />
                <span>Points</span>
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                step="10"
                value={currentQuestion.points}
                onChange={(e) => handleQuestionChange('points', parseInt(e.target.value))}
                className="input-field"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <Clock size={16} />
                <span>Time Limit (seconds)</span>
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={currentQuestion.timeLimit}
                onChange={(e) => handleQuestionChange('timeLimit', parseInt(e.target.value))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={currentQuestion.difficulty}
                onChange={(e) => handleQuestionChange('difficulty', e.target.value)}
                className="input-field"
              >
                {difficulties.map((diff) => (
                  <option key={diff.id} value={diff.id}>
                    {diff.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Options for Multiple Choice */}
          {currentQuestion.type === 'multiple-choice' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-semibold text-gray-700">
                  Options (Mark one as correct)
                </label>
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  <Plus size={16} />
                  <span>Add Option</span>
                </button>
              </div>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-medium">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      className="input-field flex-grow"
                    />
                    <button
                      type="button"
                      onClick={() => setCorrectAnswer(index)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        option.isCorrect
                          ? 'bg-green-100 text-green-800 border-2 border-green-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.isCorrect ? 'Correct ✓' : 'Mark Correct'}
                    </button>
                    {currentQuestion.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* True/False Options */}
          {currentQuestion.type === 'true-false' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Correct Answer
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentQuestion(prev => ({
                      ...prev,
                      options: [
                        { text: 'True', isCorrect: true },
                        { text: 'False', isCorrect: false }
                      ],
                      correctAnswer: 'True'
                    }))
                  }}
                  className={`flex-1 py-4 rounded-xl border-2 text-lg font-medium transition-all ${
                    currentQuestion.correctAnswer === 'True'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  True
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentQuestion(prev => ({
                      ...prev,
                      options: [
                        { text: 'True', isCorrect: false },
                        { text: 'False', isCorrect: true }
                      ],
                      correctAnswer: 'False'
                    }))
                  }}
                  className={`flex-1 py-4 rounded-xl border-2 text-lg font-medium transition-all ${
                    currentQuestion.correctAnswer === 'False'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  False
                </button>
              </div>
            </div>
          )}

          {/* Short Answer */}
          {currentQuestion.type === 'short-answer' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Correct Answer
              </label>
              <input
                type="text"
                value={currentQuestion.correctAnswer}
                onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
                placeholder="Enter the correct answer"
                className="input-field"
              />
            </div>
          )}

          {/* Add Question Button */}
          <div className="flex justify-between pt-8 border-t">
            {editingQuestionIndex !== null ? (
              <button
                type="button"
                onClick={() => {
                  setEditingQuestionIndex(null)
                  setCurrentQuestion({
                    question: '',
                    type: 'multiple-choice',
                    options: [
                      { text: '', isCorrect: false },
                      { text: '', isCorrect: false },
                      { text: '', isCorrect: false },
                      { text: '', isCorrect: false }
                    ],
                    correctAnswer: '',
                    points: 100,
                    timeLimit: 30,
                    difficulty: 'medium'
                  })
                }}
                className="flex items-center space-x-2 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={20} />
                <span>Cancel Edit</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center space-x-2 btn-primary px-8 py-3"
            >
              {editingQuestionIndex !== null ? (
                <>
                  <Save size={20} />
                  <span>Update Question</span>
                </>
              ) : (
                <>
                  <Plus size={20} />
                  <span>Add Question</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Create Quiz Button */}
      {quizData.questions.length > 0 && (
        <div className="sticky bottom-8 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Ready to Create Quiz</h3>
              <p className="opacity-90">
                {quizData.questions.length} questions • {quizData.difficulty} difficulty
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading || !quizData.title.trim()}
              className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-xl font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Quiz'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuizCreator