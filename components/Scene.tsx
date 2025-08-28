
import React, { useState, useEffect } from 'react';
import { DialogueBox } from './DialogueBox';
import { Chart } from './Chart';
import { Quiz } from './Quiz';
import { Chat } from './Chat';
import type { SceneData, ProcessedData, AirQualityRecord } from '../types';

interface SceneProps {
  sceneData: SceneData;
  onNext: () => void;
  onReset: () => void;
  chartData: ProcessedData | null;
  isLastScene: boolean;
  fullData: AirQualityRecord[] | null;
  isNarrationEnabled: boolean;
  userName: string;
}

type Activity = 'dialogue' | 'quiz' | 'chat';

export const Scene: React.FC<SceneProps> = ({ sceneData, onNext, onReset, chartData, isLastScene, fullData, isNarrationEnabled, userName }) => {
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [activity, setActivity] = useState<Activity>('dialogue');

  useEffect(() => {
    setDialogueIndex(0);
    setActivity('dialogue');
  }, [sceneData]);

  const handleDialogueEnd = () => {
      if (sceneData.quiz) {
        setActivity('quiz');
      } else if (sceneData.chatEnabled) {
        setActivity('chat');
      }
      else {
        onNext();
      }
  }

  const progressActivity = () => {
    if (dialogueIndex < sceneData.dialogues.length - 1) {
      setDialogueIndex(dialogueIndex + 1);
    } else {
      handleDialogueEnd();
    }
  };
  
  const currentDialogue = sceneData.dialogues[dialogueIndex];

  const renderActivity = () => {
    switch(activity) {
        case 'quiz':
            // Go to the next scene after the quiz is correctly answered
            return sceneData.quiz ? <Quiz quizData={sceneData.quiz} onCorrect={onNext} /> : null;
        case 'chat':
            // FIX: Pass userName prop to Chat component
            return fullData ? <Chat airQualityData={fullData} onReset={onReset} userName={userName} /> : null;
        case 'dialogue':
        default:
            if (!currentDialogue) {
                // This can happen briefly during a scene transition, before the useEffect resets the dialogueIndex.
                return null;
            }
            return (
                <DialogueBox
                    dialogue={currentDialogue}
                    onNext={progressActivity}
                    isLastDialogueInScene={dialogueIndex === sceneData.dialogues.length - 1}
                    isNarrationEnabled={isNarrationEnabled}
                    userName={userName}
                />
            );
    }
  }

  return (
    <div className="relative w-full h-full flex flex-col justify-end">
       {sceneData.videoBackground ? (
         <video
            key={sceneData.id}
            className="absolute inset-0 w-full h-full object-cover"
            src={sceneData.videoBackground}
            poster={sceneData.backgroundImage}
            autoPlay
            loop
            muted
            playsInline
          />
       ) : (
        <div
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{ backgroundImage: `url(${sceneData.backgroundImage})` }}
        />
       )}
      <div className="absolute inset-0 bg-black/50"></div>
      
      <div className="relative z-10 p-4 sm:p-8 flex flex-col md:flex-row items-end gap-8 w-full">
        <div className="flex-grow w-full md:w-1/2">
            {renderActivity()}
        </div>
        
        {chartData && chartData.length > 0 && (
          <div className="w-full md:w-1/2 lg:w-2/5 xl:w-1/3 p-4 bg-gray-900/70 backdrop-blur-md rounded-xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/10">
            <Chart data={chartData} />
          </div>
        )}

      </div>
    </div>
  );
};
