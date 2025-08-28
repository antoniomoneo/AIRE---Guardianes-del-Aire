
import React, { useState } from 'react';
import type { QuizData } from '../types';
import { Character } from '../types';
import { AIEye } from './AIEye';

interface QuizProps {
  quizData: QuizData;
  onCorrect: () => void;
}

export const Quiz: React.FC<QuizProps> = ({ quizData, onCorrect }) => {
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const isCorrect = selectedAnswerId === quizData.correctAnswerId;

  const handleAnswerClick = (optionId: string) => {
    if (isAnswered) return;
    setSelectedAnswerId(optionId);
    setIsAnswered(true);
  };

  const getButtonClass = (optionId: string) => {
    if (!isAnswered) {
      return 'bg-gray-800/50 border-gray-600 hover:border-cyan-500';
    }
    if (optionId === quizData.correctAnswerId) {
      return 'bg-green-800/60 border-green-500';
    }
    if (optionId === selectedAnswerId) {
      return 'bg-red-800/60 border-red-500';
    }
    return 'bg-gray-800/50 border-gray-700 opacity-60';
  };

  return (
    <div className="p-6 bg-gray-900/80 backdrop-blur-md rounded-xl border border-cyan-400 shadow-lg w-full transition-all animate-fade-in">
        <div className="flex items-center mb-4">
            <AIEye />
            <h3 className="font-bold font-orbitron text-cyan-300 text-xl ml-3">
                {Character.AIRE}
            </h3>
        </div>
      <p className="text-gray-200 leading-relaxed mb-4 text-lg">{quizData.question}</p>
      <div className="space-y-3">
        {quizData.options.map(option => (
          <button
            key={option.id}
            onClick={() => handleAnswerClick(option.id)}
            disabled={isAnswered}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${getButtonClass(option.id)}`}
          >
            <span className="font-semibold">{option.text}</span>
          </button>
        ))}
      </div>
      
      {isAnswered && (
        <div className="mt-4 p-4 rounded-lg bg-gray-800/70 border border-gray-600">
            <p className={`${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                {isCorrect ? quizData.feedback.correct : quizData.feedback.incorrect}
            </p>
            {isCorrect && (
                <button 
                    onClick={onCorrect} 
                    className="w-full mt-4 bg-cyan-500 text-white font-bold py-2 rounded-lg hover:bg-cyan-400 transition-colors animate-pulse"
                >
                    Continuar Aventura →
                </button>
            )}
        </div>
      )}
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
        }
       `}</style>
    </div>
  );
};
