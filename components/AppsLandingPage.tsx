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

const apps: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: { border: string; bg: string; hoverBg: string; iconBg: string; description: string; cta: string, shadow: string };
  onClickProp: keyof AppsLandingPageProps;
}[] = [
    {
        title: "Asistente A.I.R.E.",
        description: "Haz preguntas sobre la calidad del aire en Madrid a nuestra IA experta. Obtén respuestas claras y directas basadas en un completo informe técnico.",
        icon:  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zM10 11a6 6 0 016 6H4a6 6 0 016-6z" /></svg>,
        color: { border: 'border-green-500/30', bg: 'bg-green-900/30', hoverBg: 'hover:bg-green-800/40', iconBg: 'bg-green-5