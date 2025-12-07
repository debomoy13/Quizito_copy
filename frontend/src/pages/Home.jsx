// src/pages/Home.jsx
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuiz } from '../context/QuizContext'
import { 
  Zap, 
  Users, 
  Rocket, 
  Brain, 
  TrendingUp, 
  Shield,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import QuizCard from '../components/quiz/QuizCard'
import Button from '../components/common/Button'

const Home = () => {
  const { isAuthenticated } = useAuth()
  const { quizzes, fetchQuizzes } = useQuiz()
  const navigate = useNavigate()
  const [featuredQuizzes, setFeaturedQuizzes] = useState([])

  useEffect(() => {
    fetchQuizzes()
  }, [])

  useEffect(() => {
    if (quizzes.length > 0) {
      setFeaturedQuizzes(quizzes.slice(0, 6))
    }
  }, [quizzes])

  const features = [
    {
      icon: <Brain className="text-primary-600" size={32} />,
      title: 'AI Quiz Generation',
      description: 'Generate quizzes instantly from any topic using advanced AI',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Users className="text-primary-600" size={32} />,
      title: 'Live Multiplayer',
      description: 'Host and join real-time quiz sessions with friends',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <TrendingUp className="text-primary-600" size={32} />,
      title: 'Real-time Leaderboards',
      description: 'Watch rankings update instantly during gameplay',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Shield className="text-primary-600" size={32} />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% uptime',
      color: 'from-orange-500 to-red-500'
    },
  ]

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-accent-50 opacity-50" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="text-yellow-500" size={20} />
              <span className="text-sm font-semibold text-gray-700">
                Next-generation Quiz Platform
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="block">Transform Learning</span>
              <span className="gradient-text">With Interactive Quizzes</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Create, host, and play engaging quizzes powered by AI. Perfect for educators, 
              students, and organizations looking to make learning fun and effective.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Button
                    onClick={() => navigate('/create-quiz')}
                    className="btn-primary flex items-center justify-center space-x-2 text-lg px-8 py-4"
                  >
                    <span>Create Quiz</span>
                    <Zap size={20} />
                  </Button>
                  <Button
                    onClick={() => navigate('/host-session')}
                    variant="secondary"
                    className="flex items-center justify-center space-x-2 text-lg px-8 py-4"
                  >
                    <span>Host Session</span>
                    <Users size={20} />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => navigate('/register')}
                    className="btn-primary flex items-center justify-center space-x-2 text-lg px-8 py-4"
                  >
                    <span>Get Started Free</span>
                    <Rocket size={20} />
                  </Button>
                  <Button
                    onClick={() => navigate('/explore')}
                    variant="secondary"
                    className="flex items-center justify-center space-x-2 text-lg px-8 py-4"
                  >
                    <span>Explore Quizzes</span>
                    <ArrowRight size={20} />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose Quizito?</h2>
            <p className="text-gray-600 text-lg">
              Everything you need for engaging quiz experiences
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:border-primary-200 transition-all duration-300">
                <div className="mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Quizzes */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Quizzes</h2>
              <p className="text-gray-600">Most popular quizzes right now</p>
            </div>
            <Link
              to="/explore"
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              <span>View All</span>
              <ArrowRight size={20} />
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredQuizzes.length > 0 ? (
              featuredQuizzes.map((quiz) => (
                <QuizCard key={quiz._id} quiz={quiz} />
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-500">No quizzes available yet. Create the first one!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-32 -translate-x-32" />
              
              <div className="relative">
                <h2 className="text-4xl font-bold mb-6">
                  Ready to Transform Your Learning Experience?
                </h2>
                <p className="text-xl mb-10 opacity-90">
                  Join thousands of educators and learners already using Quizito
                </p>
                <Button
                  onClick={() => navigate(isAuthenticated ? '/create-quiz' : '/register')}
                  className="bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-xl font-bold"
                >
                  {isAuthenticated ? 'Create Your First Quiz' : 'Start Free Trial'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home