// src/pages/CreateQuiz.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../QuizContext';
import { 
  Upload, FileText, Link as LinkIcon, Sparkles, Settings, Clock, 
  Users, Zap, Brain, Plus, X, ChevronRight, Loader2, Wand2,
  FileQuestion, Globe, Lock, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const CreateQuiz = () => {
  const navigate = useNavigate();
  const { createQuiz, loading } = useQuiz();
  const [activeStep, setActiveStep] = useState(0);
  const [quizType, setQuizType] = useState('ai');
  const [uploadMethod, setUploadMethod] = useState('text');
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    topic: '',
    textInput: '',
    file: null,
    url: '',
    questionsCount: 10,
    difficulty: 'medium',
    timeLimit: 30,
    isPublic: true,
    category: 'education',
    allowRetakes: false,
    showAnswers: true,
    shuffleQuestions: true,
  });

  const categories = [
    { id: 'education', label: 'Education', icon: '📚', color: 'bg-blue-100 text-blue-600' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎮', color: 'bg-purple-100 text-purple-600' },
    { id: 'technology', label: 'Technology', icon: '💻', color: 'bg-green-100 text-green-600' },
    { id: 'business', label: 'Business', icon: '💼', color: 'bg-yellow-100 text-yellow-600' },
    { id: 'science', label: 'Science', icon: '🔬', color: 'bg-red-100 text-red-600' },
    { id: 'general', label: 'General Knowledge', icon: '🌍', color: 'bg-indigo-100 text-indigo-600' },
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy', color: 'from-green-400 to-emerald-500' },
    { value: 'medium', label: 'Medium', color: 'from-yellow-400 to-amber-500' },
    { value: 'hard', label: 'Hard', color: 'from-red-400 to-rose-500' },
    { value: 'adaptive', label: 'Adaptive AI', color: 'from-purple-400 to-pink-500' },
  ];

  const steps = [
    { id: 0, name: 'Quiz Type', icon: <Sparkles size={18} /> },
    { id: 1, name: 'Content', icon: <FileQuestion size={18} /> },
    { id: 2, name: 'Settings', icon: <Settings size={18} /> },
    { id: 3, name: 'Review', icon: <Check size={18} /> },
  ];

  const handleInputChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    setQuizData({
      ...quizData,
      [name]: type === 'checkbox' ? checked : files ? files[0] : value,
    });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    const validTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF, TXT, or DOCX file');
      return;
    }
    
    if (file.size > maxSize) {
      toast.error('File size should be less than 5MB');
      return;
    }
    
    setQuizData({ ...quizData, file });
    toast.success('File uploaded successfully!');
  };

  const handleGenerateQuiz = async () => {
    if (!quizData.topic && !quizData.textInput && !quizData.file && !quizData.url) {
      toast.error('Please provide content to generate quiz from');
      return;
    }

    try {
      const result = await createQuiz(quizData);
      if (result?.sessionId) {
        toast.success('🎉 Quiz created successfully!');
        navigate(`/quiz/${result.sessionId}`);
      }
    } catch (error) {
      toast.error('Failed to create quiz');
    }
  };

  const nextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      handleGenerateQuiz();
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">How would you like to create?</h2>
              <p className="text-gray-600">Choose your preferred method for creating the quiz</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setQuizType('ai')}
                className={`relative p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                  quizType === 'ai'
                    ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg'
                    : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                    <Sparkles className="text-white" size={28} />
                  </div>
                  {quizType === 'ai' && (
                    <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">AI Magic Generation</h3>
                <p className="text-gray-600 mb-4">
                  Let AI create engaging quizzes from text, documents, URLs, or topics in seconds
                </p>
                <div className="flex items-center text-sm text-indigo-600 font-semibold">
                  <span>Recommended</span>
                  <div className="ml-2 px-2 py-1 bg-indigo-100 rounded-full text-xs">
                    Fastest
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setQuizType('manual')}
                className={`relative p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                  quizType === 'manual'
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                    <Settings className="text-white" size={28} />
                  </div>
                  {quizType === 'manual' && (
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Manual Creation</h3>
                <p className="text-gray-600 mb-4">
                  Full control over every question and answer. Perfect for custom assessments
                </p>
                <div className="flex items-center text-sm text-blue-600 font-semibold">
                  <span>Complete Control</span>
                </div>
              </motion.div>
            </div>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mt-8">
              <div className="flex items-start space-x-4">
                <Brain className="text-indigo-600 mt-1" size={24} />
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">AI Generation Tips</h4>
                  <ul className="text-gray-600 space-y-1">
                    <li className="flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-green-500" />
                      Provide clear topics or detailed text for better results
                    </li>
                    <li className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-blue-500" />
                      Upload PDFs of textbooks, articles, or study materials
                    </li>
                    <li className="flex items-center">
                      <LinkIcon className="w-4 h-4 mr-2 text-purple-500" />
                      Enter URLs of web pages or online documents
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Provide Content</h2>
              <p className="text-gray-600">Choose how you want to provide content for AI to generate questions</p>
            </div>

            {/* Upload Method Selector */}
            <div className="flex space-x-2 p-1 bg-gray-100 rounded-xl mb-8">
              {['text', 'file', 'url'].map((method) => (
                <button
                  key={method}
                  onClick={() => setUploadMethod(method)}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    uploadMethod === method
                      ? 'bg-white text-indigo-600 shadow-md'
                      : 'text-gray-600 hover:text-indigo-500'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {method === 'text' && <FileText size={20} />}
                    {method === 'file' && <Upload size={20} />}
                    {method === 'url' && <LinkIcon size={20} />}
                    <span className="capitalize">{method}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Content Input Area */}
            <AnimatePresence mode="wait">
              {uploadMethod === 'text' && (
                <motion.div
                  key="text"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Topic / Subject
                    </label>
                    <input
                      type="text"
                      name="topic"
                      value={quizData.topic}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                      placeholder="e.g., JavaScript Fundamentals, World History, Machine Learning"
                    />
                    <p className="mt-2 text-sm text-gray-500">Enter a specific topic for AI to focus on</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Or paste your content
                    </label>
                    <textarea
                      name="textInput"
                      value={quizData.textInput}
                      onChange={handleInputChange}
                      rows="8"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                      placeholder="Paste text, notes, or content here... The AI will generate questions based on this content."
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-gray-500">
                        {quizData.textInput.length} characters
                      </p>
                      <p className="text-sm text-indigo-600 font-semibold">
                        Estimated questions: {Math.floor(quizData.textInput.length / 100)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {uploadMethod === 'file' && (
                <motion.div
                  key="file"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      handleFileUpload(file);
                    }}
                    className="border-3 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-indigo-400 transition-colors cursor-pointer bg-gradient-to-br from-gray-50 to-white"
                    onClick={() => document.getElementById('fileInput').click()}
                  >
                    <div className="max-w-sm mx-auto">
                      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center">
                        <Upload className="text-indigo-500" size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        Upload Document
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Drag & drop or click to upload PDF, DOCX, or TXT files
                      </p>
                      <button className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-md transition-shadow">
                        Browse Files
                      </button>
                      <p className="mt-4 text-sm text-gray-500">
                        Maximum file size: 5MB
                      </p>
                    </div>
                    <input
                      id="fileInput"
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => handleFileUpload(e.target.files[0])}
                      className="hidden"
                    />
                  </div>

                  {quizData.file && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="text-green-600" size={24} />
                          <div>
                            <p className="font-semibold text-gray-800">{quizData.file.name}</p>
                            <p className="text-sm text-gray-600">
                              {(quizData.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setQuizData({ ...quizData, file: null })}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="text-red-500" size={20} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {uploadMethod === 'url' && (
                <motion.div
                  key="url"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-8 text-center">
                    <LinkIcon className="mx-auto mb-4 text-blue-500" size={48} />
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">Enter Website URL</h3>
                    <p className="text-gray-600 mb-6">
                      Paste a URL of any webpage, article, or online document
                    </p>
                    <div className="max-w-md mx-auto">
                      <div className="relative">
                        <LinkIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="url"
                          name="url"
                          value={quizData.url}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder="https://example.com/article"
                        />
                      </div>
                      <p className="mt-3 text-sm text-gray-500">
                        The AI will analyze the webpage content and generate questions
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Templates */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Templates</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['JavaScript Basics', 'World Capitals', 'Science Trivia', 'Python Programming'].map((template) => (
                  <button
                    key={template}
                    onClick={() => setQuizData({ ...quizData, topic: template })}
                    className="p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="font-medium text-gray-800">{template}</div>
                    <div className="text-sm text-gray-500">10 questions</div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Configure Settings</h2>
              <p className="text-gray-600">Customize your quiz experience</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <div className="flex items-center space-x-2">
                      <Clock size={18} />
                      <span>Time Settings</span>
                    </div>
                  </label>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600">Time per question</span>
                        <span className="font-semibold text-indigo-600">{quizData.timeLimit} seconds</span>
                      </div>
                      <input
                        type="range"
                        name="timeLimit"
                        min="10"
                        max="120"
                        step="5"
                        value={quizData.timeLimit}
                        onChange={handleInputChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-indigo-500 [&::-webkit-slider-thumb]:to-purple-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>10s</span>
                        <span>Fast</span>
                        <span>Normal</span>
                        <span>Slow</span>
                        <span>120s</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Questions
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      name="questionsCount"
                      min="5"
                      max="30"
                      step="1"
                      value={quizData.questionsCount}
                      onChange={handleInputChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-green-500 [&::-webkit-slider-thumb]:to-emerald-500"
                    />
                    <div className="flex justify-between mt-4">
                      {[5, 10, 15, 20, 25, 30].map((num) => (
                        <button
                          key={num}
                          onClick={() => setQuizData({ ...quizData, questionsCount: num })}
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                            quizData.questionsCount === num
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white scale-110'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setQuizData({ ...quizData, category: cat.id })}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          quizData.category === cat.id
                            ? `${cat.color} border-transparent scale-105`
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{cat.icon}</div>
                        <div className="text-xs font-medium">{cat.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {difficulties.map((diff) => (
                      <button
                        key={diff.value}
                        type="button"
                        onClick={() => setQuizData({ ...quizData, difficulty: diff.value })}
                        className={`p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                          quizData.difficulty === diff.value
                            ? 'border-transparent text-white scale-105'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {quizData.difficulty === diff.value && (
                          <div className={`absolute inset-0 bg-gradient-to-r ${diff.color}`} />
                        )}
                        <div className="relative">
                          <div className="font-semibold mb-1">{diff.label}</div>
                          <div className="text-xs opacity-80">
                            {diff.value === 'easy' && 'Perfect for beginners'}
                            {diff.value === 'medium' && 'Balanced challenge'}
                            {diff.value === 'hard' && 'For experts only'}
                            {diff.value === 'adaptive' && 'AI adjusts difficulty'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Additional Options
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                          quizData.isPublic 
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 border-transparent' 
                            : 'border-gray-300'
                        }`}>
                          {quizData.isPublic && <Check size={12} className="text-white" />}
                        </div>
                        <div>
                          <div className="font-medium">Public Quiz</div>
                          <div className="text-sm text-gray-500">Anyone can join with code</div>
                        </div>
                      </div>
                      <Globe className="text-gray-400" size={20} />
                    </label>
                    <input
                      type="checkbox"
                      name="isPublic"
                      checked={quizData.isPublic}
                      onChange={handleInputChange}
                      className="hidden"
                    />

                    <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                          quizData.shuffleQuestions 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-transparent' 
                            : 'border-gray-300'
                        }`}>
                          {quizData.shuffleQuestions && <Check size={12} className="text-white" />}
                        </div>
                        <div>
                          <div className="font-medium">Shuffle Questions</div>
                          <div className="text-sm text-gray-500">Randomize question order</div>
                        </div>
                      </div>
                      <Zap className="text-gray-400" size={20} />
                    </label>
                    <input
                      type="checkbox"
                      name="shuffleQuestions"
                      checked={quizData.shuffleQuestions}
                      onChange={handleInputChange}
                      className="hidden"
                    />

                    <label className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                          quizData.showAnswers 
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 border-transparent' 
                            : 'border-gray-300'
                        }`}>
                          {quizData.showAnswers && <Check size={12} className="text-white" />}
                        </div>
                        <div>
                          <div className="font-medium">Show Answers</div>
                          <div className="text-sm text-gray-500">Display correct answers after quiz</div>
                        </div>
                      </div>
                      <FileQuestion className="text-gray-400" size={20} />
                    </label>
                    <input
                      type="checkbox"
                      name="showAnswers"
                      checked={quizData.showAnswers}
                      onChange={handleInputChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Review & Create</h2>
              <p className="text-gray-600">Preview your quiz before generating</p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Quiz Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Title</span>
                      <span className="font-semibold text-gray-800">{quizData.title || 'Untitled Quiz'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Type</span>
                      <span className="font-semibold text-indigo-600">
                        {quizType === 'ai' ? 'AI Generated' : 'Manual'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Questions</span>
                      <span className="font-semibold text-gray-800">{quizData.questionsCount}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Time per Question</span>
                      <span className="font-semibold text-gray-800">{quizData.timeLimit}s</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Difficulty</span>
                      <span className={`font-semibold capitalize ${
                        quizData.difficulty === 'easy' ? 'text-green-600' :
                        quizData.difficulty === 'medium' ? 'text-yellow-600' :
                        quizData.difficulty === 'hard' ? 'text-red-600' : 'text-purple-600'
                      }`}>
                        {quizData.difficulty}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-600">Visibility</span>
                      <span className="flex items-center space-x-2">
                        {quizData.isPublic ? (
                          <>
                            <Globe className="text-green-500" size={18} />
                            <span className="font-semibold text-green-600">Public</span>
                          </>
                        ) : (
                          <>
                            <Lock className="text-gray-500" size={18} />
                            <span className="font-semibold text-gray-600">Private</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Estimated Results</h3>
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Quiz Duration</div>
                        <div className="text-2xl font-bold text-gray-800">
                          {Math.floor(quizData.questionsCount * quizData.timeLimit / 60)}min
                        </div>
                      </div>
                      <Clock className="text-indigo-500" size={32} />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Estimated Generation Time</span>
                        <span className="font-semibold text-gray-800">10-30 seconds</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">AI Confidence</span>
                        <span className="font-semibold text-green-600">94%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Unique Questions</span>
                        <span className="font-semibold text-blue-600">Guaranteed</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                      <div className="flex items-start space-x-3">
                        <Wand2 className="text-blue-500 mt-1" size={20} />
                        <div>
                          <h4 className="font-bold text-gray-800 mb-1">AI Ready to Generate</h4>
                          <p className="text-sm text-gray-600">
                            Our AI will analyze your content and create engaging, relevant questions.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <div className="flex items-start space-x-3">
                        <Sparkles className="text-green-500 mt-1" size={20} />
                        <div>
                          <h4 className="font-bold text-gray-800 mb-1">What to Expect</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Multiple choice questions with 4 options</li>
                            <li>• Clear explanations for answers</li>
                            <li>• Difficulty-appropriate questions</li>
                            <li>• Instant quiz session creation</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Ready to create an amazing quiz experience?
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerateQuiz}
                disabled={loading}
                className="px-12 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-3 mx-auto min-w-[200px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span>Generating Quiz...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={24} />
                    <span>Generate & Launch Quiz</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">Create Quiz</h1>
              <p className="text-gray-600 mt-2">Transform your content into engaging quizzes with AI</p>
            </div>
            <div className="hidden md:block px-6 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full">
              <span className="text-sm font-semibold text-indigo-600">Step {activeStep + 1} of {steps.length}</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200"></div>
            <div 
              className="absolute top-5 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
            ></div>
            
            <div className="flex justify-between relative z-10">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`flex flex-col items-center transition-all ${
                    activeStep >= step.id ? 'text-indigo-600' : 'text-gray-400'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 border-2 transition-all ${
                    activeStep > step.id 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 border-transparent text-white' 
                      : activeStep === step.id
                      ? 'border-indigo-500 bg-white text-indigo-600 shadow-lg'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}>
                    {activeStep > step.id ? <Check size={20} /> : step.icon}
                  </div>
                  <span className={`text-sm font-medium ${activeStep === step.id ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {step.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-12">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 pt-8 border-t border-gray-100">
            <motion.button
              whileHover={{ x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={prevStep}
              disabled={activeStep === 0}
              className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center space-x-2 ${
                activeStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
              }`}
            >
              <ChevronRight className="transform rotate-180" size={20} />
              <span>Previous</span>
            </motion.button>

            <motion.button
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextStep}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2"
            >
              <span>{activeStep === steps.length - 1 ? 'Create Quiz' : 'Continue'}</span>
              <ChevronRight size={20} />
            </motion.button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">AI Success Rate</div>
            <div className="text-2xl font-bold text-green-600">94%</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Avg Generation Time</div>
            <div className="text-2xl font-bold text-blue-600">15s</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Questions Generated</div>
            <div className="text-2xl font-bold text-purple-600">1.2M+</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">User Satisfaction</div>
            <div className="text-2xl font-bold text-yellow-600">4.9/5</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuiz;
