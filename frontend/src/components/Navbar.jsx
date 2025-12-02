// src/components/Navbar.jsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, Trophy, Home, UserPlus, Settings, LogIn, LogOut, Bell, User } from 'lucide-react';
import { useQuiz } from '../QuizContext';
import { motion } from 'framer-motion';
import { useState } from 'react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser, isConnected } = useQuiz();
  const [showDropdown, setShowDropdown] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={20} /> },
    { path: '/create', label: 'Create', icon: <Brain size={20} /> },
    { path: '/join', label: 'Join', icon: <UserPlus size={20} /> },
    { path: '/admin', label: 'Dashboard', icon: <Settings size={20} /> },
  ];

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('quizito_user');
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ rotate: 15 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <Brain className="relative text-indigo-600" size={32} />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Quizito
              </span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-500">{isConnected ? 'Live' : 'Offline'}</span>
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="relative px-4 py-2 rounded-lg group"
              >
                <div className={`flex items-center space-x-2 transition-all duration-300 ${
                  location.pathname === item.path 
                    ? 'text-indigo-600' 
                    : 'text-gray-600 hover:text-indigo-500'
                }`}>
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </div>
                {location.pathname === item.path && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors">
              <Bell size={22} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <Link to="/leaderboard/global" className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 hover:shadow-md transition-shadow">
              <Trophy className="text-yellow-600" size={20} />
              <span className="font-semibold text-yellow-700">Top 10</span>
            </Link>

            {/* User Section */}
            <div className="relative">
              {user ? (
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 hover:shadow-md transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800 text-sm">{user.username}</p>
                    <p className="text-xs text-gray-500">Playing Quiz</p>
                  </div>
                </button>
              ) : (
                <Link
                  to="/join"
                  className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-semibold"
                >
                  <LogIn size={18} />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Dropdown */}
              {showDropdown && user && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50"
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-800">{user.username}</p>
                    <p className="text-sm text-gray-500">Session: {user.sessionId}</p>
                  </div>
                  <button className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2">
                    <User size={18} />
                    <span>Profile</span>
                  </button>
                  <button className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2">
                    <Trophy size={18} />
                    <span>My Stats</span>
                  </button>
                  <div className="border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
