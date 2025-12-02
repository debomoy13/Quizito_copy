import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const LeaderboardPage = () => {
  const { sessionId } = useParams();
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`https://quizito-backend.onrender.com/api/sessions/${sessionId}/leaderboard`);
        setLeaderboard(response.data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };

    fetchLeaderboard();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Final Leaderboard</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            {leaderboard
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                <div
                  key={player.id}
                  className={`flex justify-between items-center p-4 rounded-lg ${
                    index === 0 ? 'bg-yellow-100 border-2 border-yellow-300' :
                    index === 1 ? 'bg-gray-100 border-2 border-gray-300' :
                    index === 2 ? 'bg-orange-100 border-2 border-orange-300' :
                    'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className={`font-bold mr-4 text-2xl ${
                      index === 0 ? 'text-yellow-600' :
                      index === 1 ? 'text-gray-600' :
                      index === 2 ? 'text-orange-600' :
                      'text-gray-500'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-lg font-semibold">{player.name}</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">{player.score}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
