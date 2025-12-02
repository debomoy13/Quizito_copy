import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import QuizQuestion from '../components/QuizQuestion';
import Leaderboard from '../components/Leaderboard';

const QuizSession = () => {
  const { sessionId } = useParams();
  const [socket, setSocket] = useState(null);
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [status, setStatus] = useState('waiting');
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const newSocket = io('https://quizito-backend.onrender.com');
    setSocket(newSocket);

    newSocket.emit('join', { sessionId });

    newSocket.on('sessionData', (data) => {
      setSession(data.session);
      setIsHost(data.isHost);
    });

    newSocket.on('question', (question) => {
      setCurrentQuestion(question);
      setStatus('active');
    });

    newSocket.on('leaderboard', (lb) => {
      setLeaderboard(lb);
    });

    newSocket.on('end', () => {
      setStatus('ended');
    });

    return () => newSocket.close();
  }, [sessionId]);

  const startQuiz = () => {
    socket.emit('start', { sessionId });
  };

  const submitAnswer = (answerIndex) => {
    socket.emit('answer', { sessionId, answerIndex });
  };

  if (!session) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{session.quiz.title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            {status === 'waiting' && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Waiting for players...</h2>
                <div className="mb-4">
                  <p className="text-gray-600">Session Code: <span className="font-mono font-bold">{sessionId}</span></p>
                </div>
                <div className="mb-4">
                  <h3 className="font-semibold">Players:</h3>
                  <ul className="list-disc list-inside">
                    {session.players.map(player => (
                      <li key={player.id}>{player.name}</li>
                    ))}
                  </ul>
                </div>
                {isHost && (
                  <button
                    onClick={startQuiz}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Start Quiz
                  </button>
                )}
              </div>
            )}
            {status === 'active' && currentQuestion && (
              <QuizQuestion question={currentQuestion} onAnswer={submitAnswer} />
            )}
            {status === 'ended' && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Quiz Ended!</h2>
                <p className="text-gray-600">Check the leaderboard for final results.</p>
              </div>
            )}
          </div>
          <div>
            <Leaderboard players={leaderboard} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSession;
