// src/pages/Leaderboard.jsx
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";

import {
  Trophy,
  Crown,
  Medal,
  Star,
  TrendingUp,
  Filter,
  Download,
  Share2,
  Globe,
  Clock,
  Zap,
  Target,
  Award,
  Users,
  Calendar,
  CheckCircle,
  Lock,
  BarChart3
} from "lucide-react";


const Leaderboard = () => {
  const { sessionId } = useParams();
  
  const leaderboardData = [
    { id: 1, name: 'Alex Johnson', score: 9850, rank: 1, streak: 8, accuracy: 94, avatar: 'AJ', country: 'US' },
    { id: 2, name: 'Sarah Miller', score: 9420, rank: 2, streak: 5, accuracy: 89, avatar: 'SM', country: 'CA' },
    { id: 3, name: 'Mike Chen', score: 9010, rank: 3, streak: 12, accuracy: 96, avatar: 'MC', country: 'CN' },
    { id: 4, name: 'Emma Wilson', score: 8760, rank: 4, streak: 3, accuracy: 82, avatar: 'EW', country: 'UK' },
    { id: 5, name: 'David Brown', score: 8450, rank: 5, streak: 6, accuracy: 88, avatar: 'DB', country: 'AU' },
    { id: 6, name: 'Lisa Park', score: 8120, rank: 6, streak: 4, accuracy: 85, avatar: 'LP', country: 'KR' },
    { id: 7, name: 'You', score: 4250, rank: 7, streak: 2, accuracy: 80, avatar: 'ME', country: 'IN', isCurrentUser: true },
    // Add more players...
  ];

  const timeFilters = ['All Time', 'This Week', 'Today'];
  const categoryFilters = ['All Categories', 'Technology', 'Science', 'General'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-purple-500/10 to-pink-500/10"></div>
        <div className="container mx-auto px-4 py-12 relative">
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-block mb-6"
            >
              <div className="w-24 h-24 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
                <Trophy className="text-white" size={48} />
              </div>
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Global Leaderboard
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Compete with players worldwide and climb to the top of the rankings
            </p>
            <div className="inline-flex items-center space-x-2 mt-4 px-4 py-2 bg-gray-800/50 rounded-full">
              <Globe className="text-indigo-400" size={20} />
              <span className="text-gray-300">Session: </span>
              <span className="font-mono font-bold text-white">#{sessionId || 'GLOBAL'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        {/* Filters and Controls */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-3">
              {timeFilters.map((filter) => (
                <button
                  key={filter}
                  className={`px-4 py-2 rounded-xl font-medium ${
                    filter === 'All Time'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 flex items-center">
                <Filter className="mr-2" size={18} />
                Filter
              </button>
              <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 flex items-center">
                <Download className="mr-2" size={18} />
                Export
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg flex items-center">
                <Share2 className="mr-2" size={18} />
                Share
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">2,458</div>
                  <div className="text-sm text-gray-400">Total Players</div>
                </div>
                <Users className="text-indigo-400" size={24} />
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">84.5%</div>
                  <div className="text-sm text-gray-400">Avg Accuracy</div>
                </div>
                <Target className="text-green-400" size={24} />
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">15.2s</div>
                  <div className="text-sm text-gray-400">Avg Response Time</div>
                </div>
                <Clock className="text-yellow-400" size={24} />
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">1,234</div>
                  <div className="text-sm text-gray-400">Quizzes Played</div>
                </div>
                <Zap className="text-purple-400" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Leaderboard */}
          <div className="lg:col-span-2">
            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {leaderboardData.slice(0, 3).map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ y: 50 }}
                  animate={{ y: 0 }}
                  transition={{ delay: index * 0.1, type: 'spring' }}
                  className={`relative ${
                    player.rank === 1 
                      ? 'order-2 -mt-8' 
                      : player.rank === 2 
                        ? 'order-1' 
                        : 'order-3'
                  }`}
                >
                  <div className={`bg-gradient-to-b ${
                    player.rank === 1 ? 'from-yellow-500/20 to-yellow-600/20' :
                    player.rank === 2 ? 'from-gray-400/20 to-gray-600/20' :
                    'from-amber-700/20 to-amber-900/20'
                  } rounded-2xl p-6 text-center border ${
                    player.rank === 1 ? 'border-yellow-500/50' : 'border-gray-600'
                  }`}>
                    {/* Rank Badge */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        player.rank === 1 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                        player.rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                        'bg-gradient-to-r from-amber-700 to-amber-900'
                      }`}>
                        {player.rank === 1 ? (
                          <Crown className="text-white" size={24} />
                        ) : (
                          <span className="text-white font-bold text-xl">{player.rank}</span>
                        )}
                      </div>
                    </div>

                    {/* Avatar */}
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-700 to-gray-900 flex items-center justify-center border-4 border-gray-800">
                      <span className="text-2xl font-bold text-white">{player.avatar}</span>
                    </div>

                    {/* Player Info */}
                    <h3 className="font-bold text-white text-xl mb-1">{player.name}</h3>
                    <div className="text-3xl font-bold text-white mb-2">
                      {player.score.toLocaleString()}
                    </div>
                    <div className="text-gray-300 mb-3">points</div>

                    {/* Stats */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <Zap className="text-yellow-400" size={16} />
                        <span className="text-sm text-yellow-400">{player.streak} streak</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <Target className="text-green-400" size={16} />
                        <span className="text-sm text-green-400">{player.accuracy}% accuracy</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Leaderboard List */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 overflow-hidden">
              {leaderboardData.slice(3).map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index + 3) * 0.05 }}
                  className={`flex items-center p-6 border-b border-gray-700/50 last:border-b-0 ${
                    player.isCurrentUser
                      ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10'
                      : 'hover:bg-gray-700/30'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-12 text-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${
                      player.rank <= 10
                        ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30'
                        : 'bg-gray-700'
                    }`}>
                      <span className={`font-bold ${
                        player.rank <= 10 ? 'text-indigo-300' : 'text-gray-400'
                      }`}>
                        {player.rank}
                      </span>
                    </div>
                  </div>

                  {/* Avatar & Name */}
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      player.isCurrentUser
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        : 'bg-gray-700'
                    }`}>
                      <span className={`font-bold ${player.isCurrentUser ? 'text-white' : 'text-gray-300'}`}>
                        {player.avatar}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className={`font-bold ${player.isCurrentUser ? 'text-white' : 'text-gray-300'}`}>
                          {player.name}
                        </span>
                        {player.isCurrentUser && (
                          <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full">
                            You
                          </span>
                        )}
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full flex items-center">
                          <Globe className="mr-1" size={10} />
                          {player.country}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                        <span className="flex items-center">
                          <Zap className="mr-1" size={12} />
                          {player.streak} streak
                        </span>
                        <span className="flex items-center">
                          <Target className="mr-1" size={12} />
                          {player.accuracy}% accuracy
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{player.score.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">points</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your Stats */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Award className="mr-2" size={24} />
                Your Performance
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Global Rank</span>
                  <span className="text-2xl font-bold text-white">#7</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Score</span>
                  <span className="text-2xl font-bold text-white">4,250</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Accuracy</span>
                  <span className="text-2xl font-bold text-green-400">80%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Avg Time</span>
                  <span className="text-2xl font-bold text-yellow-400">12.4s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Quizzes Played</span>
                  <span className="text-2xl font-bold text-blue-400">24</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-indigo-500/30">
                <div className="text-center">
                  <div className="text-sm text-gray-300 mb-2">Progress to next rank</div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500" style={{ width: '65%' }}></div>
                  </div>
                  <div className="text-sm text-gray-400 mt-2">1,750 points to rank #6</div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-6">
              <h3 className="text-xl font-bold text-white mb-6">Recent Achievements</h3>
              <div className="space-y-4">
                {[
                  { title: 'Quiz Master', desc: 'Complete 10 quizzes', icon: '🏆', earned: true },
                  { title: 'Speed Demon', desc: 'Answer in under 5s', icon: '⚡', earned: true },
                  { title: 'Perfect Score', desc: 'Get 100% on a quiz', icon: '💯', earned: false },
                  { title: 'Streak King', desc: '5-day streak', icon: '🔥', earned: false },
                ].map((achievement, index) => (
                  <div key={index} className={`flex items-center p-3 rounded-xl ${
                    achievement.earned 
                      ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20' 
                      : 'bg-gray-700/50'
                  }`}>
                    <div className="text-2xl mr-3">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className={`font-medium ${achievement.earned ? 'text-white' : 'text-gray-400'}`}>
                        {achievement.title}
                      </div>
                      <div className="text-sm text-gray-500">{achievement.desc}</div>
                    </div>
                    {achievement.earned ? (
                      <CheckCircle className="text-green-400" size={20} />
                    ) : (
                      <Lock className="text-gray-500" size={20} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-gray-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl flex items-center justify-between transition-colors">
                  <span>Play New Quiz</span>
                  <TrendingUp size={18} />
                </button>
                <button className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl flex items-center justify-between transition-colors">
                  <span>View Analytics</span>
                  <BarChart3 size={18} />
                </button>
                <button className="w-full p-3 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 text-indigo-300 rounded-xl flex items-center justify-between transition-colors">
                  <span>Share Your Rank</span>
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
