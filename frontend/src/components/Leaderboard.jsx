const Leaderboard = ({ players }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Leaderboard</h3>
      <div className="space-y-2">
        {players
          .sort((a, b) => b.score - a.score)
          .map((player, index) => (
            <div
              key={player.id}
              className={`flex justify-between items-center p-3 rounded ${
                index === 0 ? 'bg-yellow-100' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <span className="font-bold mr-3">{index + 1}.</span>
                <span>{player.name}</span>
              </div>
              <span className="font-semibold">{player.score}</span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Leaderboard;
