import { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizzesResponse, sessionsResponse] = await Promise.all([
          axios.get('https://quizito-backend.onrender.com/api/quizzes'),
          axios.get('https://quizito-backend.onrender.com/api/sessions'),
        ]);
        setQuizzes(quizzesResponse.data);
        setSessions(sessionsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Quizzes</h2>
            <div className="space-y-2">
              {quizzes.map(quiz => (
                <div key={quiz.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>{quiz.title}</span>
                  <span className="text-sm text-gray-500">{quiz.questions?.length || 0} questions</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Active Sessions</h2>
            <div className="space-y-2">
              {sessions.map(session => (
                <div key={session.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span>{session.quiz?.title || 'Unknown Quiz'}</span>
                  <span className="text-sm text-gray-500">{session.players?.length || 0} players</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
