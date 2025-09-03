import React, { useEffect } from 'react';

interface AppsLandingPageProps {
  onOpenDashboard: () => void;
  onOpenCreationStudio: () => void;
  onOpen3DStudio: () => void;
  onOpenRealTimeData: () => void;
  onOpenEducationalPack: () => void;
  onOpenGlossary: () => void;
  onOpenDataStory: () => void;
  onOpenDigitalTwinLab: () => void;
  onOpenAiAssistant: () => void;
  onOpenParticipa: () => void;
  onOpenKnowledgeBase: () => void;
  onOpenJoinUs: () => void;
}

const apps = [
    {
        title: "Asistente A.I.R.E.",
        description: "Haz preguntas sobre la calidad del aire en Madrid a nuestra IA experta.",
        icon:  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zM10 11a6 6 0 00-6 6v1a1 1 0 001 1h10a1 1 0 001-1v-1a6 6 0 00-6-6z" /></svg>,
        action: 'onOpenAiAssistant',
        color: 'border-green-500/50 hover:border-green-400 hover:shadow-green-500/20',
        points: 100,
    },
    {
        title: "Simulador Data Story",
        description: "Vive la aventura narrativa y viaja por la historia del aire de Madrid.",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm3.293 11.707a1 1 0 001.414 0L10 12.414l1.293 1.293a1 1 0 101.414-1.414L11.414