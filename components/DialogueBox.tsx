
import React, { useState, useEffect } from 'react';
import type { Dialogue } from '../types';
import { Character } from '../types';
import { AIEye } from './AIEye';
import { speak, cancel } from '../utils/ttsService';

interface DialogueBoxProps {
  dialogue: Dialogue;
  onNext: () => void;
  isLastDialogueInScene: boolean;
  isNarrationEnabled: boolean;
  userName: string;
}

const useTypewriter = (text: string, speed = 30) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    setDisplayText('');
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, speed);

    return () => clearInterval(typingInterval);
  }, [text, speed]);

  return displayText;
};

export const DialogueBox: React.FC<DialogueBoxProps> = ({ dialogue, onNext, isLastDialogueInScene, isNarrationEnabled, userName }) => {
    const resolvedText = typeof dialogue.text === 'function' ? dialogue.text(userName) : dialogue.text;
    const isTextString = typeof resolvedText === 'string';
    const textToType = isTextString ? (resolvedText as string) : '';
    const displayedText = useTypewriter(textToType, 30);
    const isFinishedTyping = !isTextString || displayedText === resolvedText;

    useEffect(() => {
        if (isNarrationEnabled && dialogue.character === Character.AIRE && isTextString) {
            speak(resolvedText as string);
        } else {
            cancel();
        }
        return () => {
            cancel();
        };
    }, [dialogue, isNarrationEnabled, isTextString, resolvedText]);


  return (
    <div
      className="p-6 bg-gray-900/70 backdrop-blur-md rounded-xl border border-cyan-500/30 shadow-lg text-lg cursor-pointer transition-all duration-300 hover:border-cyan-400"
      onClick={() => {
        if(isFinishedTyping) onNext();
      }}
    >
      <div className="flex items-center mb-3">
        {dialogue.character === Character.AIRE && <AIEye />}
        <h3 className="font-bold font-orbitron text-cyan-300 text-xl ml-3">
          {dialogue.character}
        </h3>
      </div>
      <p className="text-gray-200 leading-relaxed min-h-[7rem]">
        {isTextString ? displayedText : resolvedText}
      </p>
      {isFinishedTyping && (
        <div className="flex justify-end mt-2">
            <button className="text-cyan-400 font-bold animate-pulse">
                {isLastDialogueInScene ? 'Continuar →' : 'Siguiente...'}
            </button>
        </div>
      )}
    </div>
  );
};
