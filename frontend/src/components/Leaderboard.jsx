// src/components/Leaderboard.jsx
import { motion } from 'framer-motion';
import { Trophy, Crown, Star, TrendingUp, Award, Zap, Medal } from 'lucide-react';

const Leaderboard = ({ compact = false }) => {
  const leaderboardData = [
    { id: 1, name: 'Alex Johnson', score: 9850, rank: 1, avatar: 'AJ', streak: 8, accuracy: 94 },
    { id: 2, name: 'Sarah Miller', score: 9420, rank: 2, avatar: 'SM', streak: 5, accuracy: 89 },
    { id: 3, name: 'Mike Chen', score: 9010, rank: 3, avatar: 'MC', streak: 12, accuracy: 96 },
    { id: 4, name: 'Emma Wilson', score: 8760, rank: 4, avatar: 'EW', streak: 3, accuracy: 82 },
    { id: 5, name: 'David Brown', score: 8450, rank: 5, avatar: 'DB', streak: 6, accuracy: 88 },
    { id: 6, name: 'Lisa Park', score: 8120, rank: 6, avatar: 'LP', streak: 4, accuracy: 85 },
    { id: 7, name: 'You', score: 4250, rank: 7, avatar: 'ME', streak: 2, accuracy: 80, isCurrentUser: true },
  ];

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'from-yellow-500 to-orange-500';
      case 2: return 'from-gray-400 to-gray-600';
      case 3: return 'from-amber-700 to-amber-900';
      default: return 'from-gray-700 to-gray-900';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="text-yellow-400" size={20} />;
      case 2: return <Medal className="text-gray-300" size={20} />;
      case 3: return <Medal className="text-amber-600" size={20} />;
      default: return <span className="text-gray-400 font-bold">{rank}</span>;
    }
  };

  return (
    <div className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-gray-700 ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl">
            <Trophy className="text-yellow-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Live Leaderboard</h2>
            <p className="text-sm text-gray-400">Updated in real-time</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-400">Live</span>
        </div>
      </div>

      {/* Top 3 Podium */}
      {!compact && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {leaderboardData.slice(0, 3).map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative ${
                player.rank === 1 
                  ? 'order-2 -mt-4' 
                  : player.rank === 2 
                    ? 'order-1' 
                    : 'order-3'
              }`}
            >
              <div className={`bg-gradient-to-b ${getRankColor(player.rank)} rounded-2xl p-4 text-center border ${
                player.rank === 1 ? 'border-yellow-500/50' : 'border-gray-600'
              }`}>
                <div className="flex justify-center mb-3">
                  {player.rank === 1 && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Crown className="text-yellow-400" size={24} />
                    </div>
                  )}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    player.rank === 1 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                    player.rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                    'bg-gradient-to-r from-amber-700 to-amber-900'
                  }`}>
                    <span className="text-white font-bold text-xl">{player.avatar}</span>
                  </div>
                </div>
                <h3 className="font-bold text-white mb-1">{player.name}</h3>
                <div className="text-2xl font-bold text-white mb-2">{player.score.toLocaleString()}</div>
                <div className="flex items-center justify-center space-x-1">
                  <Zap className="text-yellow-400" size={14} />
                  <span className="text-sm text-yellow-400">{player.streak} streak</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Leaderboard List */}
      <div className="space-y-2">
        {leaderboardData.slice(compact ? 0 : 3).map((player, index) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (compact ? index : index + 3) * 0.05 }}
            className={`flex items-center justify-between p-4 rounded-xl transition-all ${
              player.isCurrentUser
                ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30'
                : 'hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 flex items-center justify-center">
                {getRankIcon(player.rank)}
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                player.isCurrentUser
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                  : 'bg-gray-700'
              }`}>
                <span className={`font-bold ${player.isCurrentUser ? 'text-white' : 'text-gray-300'}`}>
                  {player.avatar}
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${player.isCurrentUser ? 'text-white' : 'text-gray-300'}`}>
                    {player.name}
                  </span>
                  {player.isCurrentUser && (
                    <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full">
                      You
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-gray-400">
                    <TrendingUp className="inline mr-1" size={12} />
                    {player.accuracy}% acc
                  </span>
                  <span className="text-yellow-500">
                    <Zap className="inline mr-1" size={12} />
                    {player.streak} streak
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xl font-bold text-white">{player.score.toLocaleString()}</div>
              <div className="text-sm text-gray-400">points</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats Summary */}
      {!compact && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-800/50 rounded-xl">
              <div className="text-2xl font-bold text-white">24</div>
              <div className="text-sm text-gray-400">Players</div>
            </div>
            <div className="text-center p-3 bg-gray-800/50 rounded-xl">
              <div className="text-2xl font-bold text-green-400">84%</div>
              <div className="text-sm text-gray-400">Avg Accuracy</div>
            </div>
            <div className="text-center p-3 bg-gray-800/50 rounded-xl">
              <div className="text-2xl font-bold text-yellow-400">15.2s</div>
              <div className="text-sm text-gray-400">Avg Time</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
