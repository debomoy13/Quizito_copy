// src/pages/Home.jsx
import { Link } from 'react-router-dom';
import { useQuiz } from '../QuizContext';
import { 
  Brain, Users, Zap, Trophy, Sparkles, ArrowRight, 
  Shield, Clock, TrendingUp, Globe, Rocket, Award,
  BarChart3, Target, Gamepad2, Lightbulb
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';

const Home = () => {
  const { user, isConnected } = useQuiz();
  const [showConfetti, setShowConfetti] = useState(false);
  const [stats, setStats] = useState({
    activeQuizzes: 1256,
    totalPlayers: 45678,
    questionsAnswered: 1234567,
    successRate: 94
  });

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: <Brain className="text-blue-500" size={28} />,
      title: 'AI-Powered Generation',
      description: 'Transform any content into engaging quizzes instantly with our advanced AI',
      gradient: 'from-blue-500 to-cyan-500',
      delay: 0.1
    },
    {
      icon: <Users className="text-green-500" size={28} />,
      title: 'Live Multiplayer',
      description: 'Real-time competitions with friends, classmates, or colleagues',
      gradient: 'from-green-500 to-emerald-500',
      delay: 0.2
    },
    {
      icon: <Zap className="text-yellow-500" size={28} />,
      title: 'Instant Leaderboards',
      description: 'Watch rankings update in real-time as players answer',
      gradient: 'from-yellow-500 to-orange-500',
      delay: 0.3
    },
    {
      icon: <Trophy className="text-purple-500" size={28} />,
      title: 'Smart Analytics',
      description: 'Detailed insights and performance tracking',
      gradient: 'from-purple-500 to-pink-500',
      delay: 0.4
    },
  ];

  const statsCards = [
    { icon: <Globe />, label: 'Active Quizzes', value: stats.activeQuizzes, change: '+12%' },
    { icon: <Users />, label: 'Live Players', value: stats.totalPlayers, change: '+24%' },
    { icon: <Target />, label: 'Questions Answered', value: stats.questionsAnswered.toLocaleString(), change: '+36%' },
    { icon: <TrendingUp />, label: 'Success Rate', value: `${stats.successRate}%`, change: '+3%' },
  ];

  const quickActions = [
    {
      title: 'For Educators',
      description: 'Create engaging assessments from course materials',
      icon: <Lightbulb />,
      buttonText: 'Start Teaching',
      gradient: 'from-blue-500 to-indigo-600',
      link: '/create'
    },
    {
      title: 'For Students',
      description: 'Join live quizzes and compete with peers',
      icon: <Gamepad2 />,
      buttonText: 'Join Game',
      gradient: 'from-green-500 to-emerald-600',
      link: '/join'
    },
    {
      title: 'For Organizations',
      description: 'Corporate training and team building',
      icon: <Shield />,
      buttonText: 'Team Portal',
      gradient: 'from-purple-500 to-pink-600',
      link: '/admin'
    },
  ];

  return (
    <>
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
      
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-blue-50/50"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 py-12 relative">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-5xl mx-auto mb-20"
          >
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full border border-indigo-200 mb-6">
              <Sparkles className="text-indigo-500" size={16} />
              <span className="text-sm font-semibold text-indigo-600">AI-Powered Learning Platform</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              Where Learning
              <span className="block">Meets Competition</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Create AI-generated quizzes in seconds, host live multiplayer competitions, 
              and track performance with real-time analytics. Perfect for classrooms, 
              corporate training, and game-based learning.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/create"
                  className="group px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 font-bold text-lg flex items-center justify-center gap-3 shadow-lg"
                >
                  <Sparkles size={24} />
                  Create Quiz with AI
                  <ArrowRight className="group-hover:translate-x-2 transition-transform" size={20} />
                </Link>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/join"
                  className="px-10 py-4 bg-white text-gray-800 border-2 border-gray-200 rounded-2xl hover:border-indigo-300 hover:shadow-xl transition-all duration-300 font-bold text-lg hover:scale-105"
                >
                  Join Live Quiz
                </Link>
              </motion.div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {statsCards.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      {stat.icon}
                    </div>
                    <span className="text-sm font-semibold text-green-600">{stat.change}</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Features Grid */}
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-center mb-4 text-gray-800">Why Choose Quizito?</h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              We combine cutting-edge AI with engaging gameplay to create the ultimate learning experience
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: feature.delay }}
                  whileHover={{ y: -10, transition: { duration: 0.2 } }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-50 rounded-3xl shadow-lg group-hover:shadow-2xl transition-shadow duration-300"></div>
                  <div className="relative p-8">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.gradient} mb-6`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    <div className="h-1 w-12 bg-gradient-to-r from-gray-300 to-transparent rounded-full"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Get Started in Seconds</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {quickActions.map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="relative group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} rounded-3xl opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                  <div className="relative bg-white/90 backdrop-blur-sm p-8 rounded-3xl border border-gray-100 shadow-xl">
                    <div className="inline-flex p-3 rounded-xl bg-gray-50 mb-6">
                      {action.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-gray-800">{action.title}</h3>
                    <p className="text-gray-600 mb-6">{action.description}</p>
                    <Link
                      to={action.link}
                      className={`inline-flex items-center justify-center w-full py-3 px-6 bg-gradient-to-r ${action.gradient} text-white rounded-xl font-semibold hover:shadow-lg transition-all`}
                    >
                      {action.buttonText}
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1920')] opacity-10"></div>
            
            <div className="relative py-16 px-8 text-center">
              <Rocket className="w-16 h-16 mx-auto mb-6 text-white" />
              <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Learning?</h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Join thousands of educators and learners who are already using Quizito
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-shadow"
                >
                  Start Free Trial
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-colors"
                >
                  Schedule Demo
                </motion.button>
              </div>
              
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">4.9</div>
                  <div className="text-white/70">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">50K+</div>
                  <div className="text-white/70">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">99.9%</div>
                  <div className="text-white/70">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1">24/7</div>
                  <div className="text-white/70">Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
