import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to <span className="text-blue-600">Quizito</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Create AI-powered quizzes in seconds and host live multiplayer sessions with real-time leaderboards.
        </p>
        <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex md:justify-center">
          <Link
            to="/create-quiz"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
          >
            Create Quiz
          </Link>
          <Link
            to="/join-quiz"
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-300"
          >
            Join Quiz
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">AI-Powered Creation</h3>
            <p className="text-gray-600">Generate quizzes instantly from topics or text using advanced AI.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Live Multiplayer</h3>
            <p className="text-gray-600">Host real-time quiz sessions with friends and colleagues.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Real-Time Leaderboards</h3>
            <p className="text-gray-600">Track scores and rankings as players compete live.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
