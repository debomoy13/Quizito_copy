import { useState, useEffect } from 'react';

const QuizQuestion = ({ question, onAnswer }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds per question

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-submit if time runs out
          if (selectedAnswer === null) {
            onAnswer(-1); // -1 for timeout
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedAnswer, onAnswer]);

  const handleAnswer = (index) => {
    setSelectedAnswer(index);
    onAnswer(index);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold">{question.question}</h3>
          <span className={`text-lg font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-gray-600'}`}>
            {timeLeft}s
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${(timeLeft / 30) * 100}%` }}
          ></div>
        </div>
      </div>
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            disabled={selectedAnswer !== null}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedAnswer === index
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${selectedAnswer !== null ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}.</span>
            {option}
          </button>
        ))}
      </div>
      {selectedAnswer !== null && (
        <div className="mt-4 text-center">
          <p className="text-gray-600">Answer submitted!</p>
        </div>
      )}
    </div>
  );
};

export default QuizQuestion;
