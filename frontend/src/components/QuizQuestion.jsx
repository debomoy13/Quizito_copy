// src/components/QuizQuestion.jsx
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

const QuizQuestion = ({ 
  question, 
  options, 
  selectedOption, 
  correctAnswer,
  onSelect,
  timeLeft,
  questionNumber,
  totalQuestions 
}) => {
  const handleOptionClick = (index) => {
    if (selectedOption === null) {
      onSelect(index);
    }
  };

  const getOptionStyle = (index) => {
    if (selectedOption === null) {
      return 'bg-gray-800 hover:bg-gray-700 border-gray-700 cursor-pointer';
    }
    
    if (index === correctAnswer) {
      return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500';
    }
    
    if (index === selectedOption && index !== correctAnswer) {
      return 'bg-gradient-to-r from-red-500/20 to-rose-500/20 border-red-500';
    }
    
    return 'bg-gray-800/50 border-gray-700';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-gray-700 p-8 shadow-2xl"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="text-sm text-gray-400 mb-1">Question {questionNumber} of {totalQuestions}</div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Zap className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">Multiple Choice</h2>
          </div>
        </div>
        
        <div className={`flex items-center space-x-2 ${timeLeft < 10 ? 'animate-pulse' : ''}`}>
          <Clock className={timeLeft < 10 ? 'text-red-400' : 'text-yellow-400'} size={24} />
          <div className="text-3xl font-bold text-white">{timeLeft}</div>
          <div className="text-gray-400">s</div>
        </div>
      </div>

      {/* Question */}
      <h1 className="text-3xl font-bold text-white mb-10 leading-relaxed">
        {question}
      </h1>

      {/* Options */}
      <div className="space-y-4">
        {options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isCorrect = index === correctAnswer;
          
          return (
            <motion.button
              key={index}
              whileHover={{ scale: selectedOption === null ? 1.02 : 1 }}
              whileTap={{ scale: selectedOption === null ? 0.98 : 1 }}
              onClick={() => handleOptionClick(index)}
              disabled={selectedOption !== null}
              className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-300 ${getOptionStyle(index)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedOption === null
                      ? 'bg-gray-700 text-gray-300'
                      : isCorrect
                      ? 'bg-green-500 text-white'
                      : isSelected
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-700/50 text-gray-400'
                  }`}>
                    <span className="text-xl font-bold">
                      {String.fromCharCode(65 + index)}
                    </span>
                  </div>
                  <span className="text-xl text-white font-medium">
                    {option}
                  </span>
                </div>
                
                {selectedOption !== null && (
                  <div>
                    {isCorrect ? (
                      <CheckCircle className="text-green-400" size={28} />
                    ) : isSelected ? (
                      <XCircle className="text-red-400" size={28} />
                    ) : null}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Feedback */}
      {selectedOption !== null && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={`mt-8 p-6 rounded-2xl ${
            selectedOption === correctAnswer
              ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30'
              : 'bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/30'
          }`}
        >
          <div className="flex items-start space-x-4">
            {selectedOption === correctAnswer ? (
              <>
                <CheckCircle className="text-green-400 mt-1" size={24} />
                <div>
                  <h4 className="text-xl font-bold text-green-400 mb-2">Excellent! 🎯</h4>
                  <p className="text-gray-300">
                    You got it right! This question was answered correctly by 65% of players.
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="text-red-400 mt-1" size={24} />
                <div>
                  <h4 className="text-xl font-bold text-red-400 mb-2">Good try!</h4>
                  <p className="text-gray-300">
                    The correct answer was option <span className="font-bold text-green-400">
                      {String.fromCharCode(65 + correctAnswer)}
                    </span>. Don't worry, you'll get the next one!
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Progress Indicator */}
      <div className="mt-8">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Progress</span>
          <span>{Math.round((questionNumber / totalQuestions) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default QuizQuestion;
