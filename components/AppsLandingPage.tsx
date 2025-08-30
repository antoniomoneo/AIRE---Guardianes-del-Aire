

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
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm3.293 11.707a1 1 0 001.414 0L10 12.414l1.293 1.293a1 1 0 101.414-1.414L11.414 11l1.293-1.293a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414L8.586 11 7.293 12.293a1 1 0 000 1.414z" clipRule="evenodd" /></svg>,
        action: 'onOpenDataStory',
        color: 'border-yellow-500/50 hover:border-yellow-400 hover:shadow-yellow-500/20',
        points: 200,
    },
    {
        title: "Glosario",
        description: "Define los términos técnicos y los distintos contaminantes.",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4a2 2 0 012 2v2h4a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V8a2 2 0 00-2-2H4V4z" clipRule="evenodd" /></svg>,
        action: 'onOpenGlossary',
        color: 'border-blue-500/50 hover:border-blue-400 hover:shadow-blue-500/20',
        points: 100,
    },
    {
        title: "Panel de Control",
        description: "Analiza en detalle los datos históricos de todos los contaminantes.",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>,
        action: 'onOpenDashboard',
        color: 'border-cyan-500/50 hover:border-cyan-400 hover:shadow-cyan-500/20',
        points: 500,
    },
    {
        title: "Datos de Ayer",
        description: "Consulta los datos horarios de los principales contaminantes del último día registrado.",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>,
        action: 'onOpenRealTimeData',
        color: 'border-red-500/50 hover:border-red-400 hover:shadow-red-500/20',
        points: 300,
    },
    {
        title: "Laboratorio de Escenarios",
        description: "Explora futuros alternativos y simula el impacto de decisiones clave.",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2-2H4a2 2 0 01-2-2v-4z" /></svg>,
        action: 'onOpenDigitalTwinLab',
        color: 'border-indigo-500/50 hover:border-indigo-400 hover:shadow-indigo-500/20',
        points: 100,
    },
    {
        title: "Audio & Viz Studio",
        description: "Transforma los datos en una pieza audiovisual única y creativa.",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>,
        action: 'onOpenCreationStudio',
        color: 'border-purple-500/50 hover:border-purple-400 hover:shadow-purple-500/20',
        points: 100,
    },
    {
        title: "3D Studio",
        description: "Convierte los datos en esculturas y terrenos tridimensionales.",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.18l3.75-3.75a1.65 1.65 0 012.332 0l3.75 3.75a1.65 1.65 0 010 1.18l-3.75 3.75a1.65 1.65 0 01-2.332 0L.664 10.59zM12.5 10a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" clipRule="evenodd" /></svg>,
        action: 'onOpen3DStudio',
        color: 'border-orange-500/50 hover:border-orange-400 hover:shadow-orange-500/20',
        points: 100,
    },
    {
        title: "Pack Educativo",
        description: "Guía de uso para educadores con actividades para la clase.",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3.5a1 1 0 00.028 1.838l7 3.5a1 1 0 00.732 0l7-3.5a1 1 0 00.028-1.838l-7-3.5zM3 9.42l7 3.5 7-3.5v3.562l-7 3.5-7-3.5V9.42z" /></svg>,
        action: 'onOpenEducationalPack',
        color: 'border-teal-500/50 hover:border-teal-400 hover:shadow-teal-500/20',
        points: 200,
    }
];

export const AppsLandingPage: React.FC<Omit<AppsLandingPageProps, 'onClose'>> = (props) => {
    return (
        <div className="w-full h-full bg-gray-900/95 px-6 pb-6 pt-28 flex flex-col relative overflow-hidden">
            <div className="flex-shrink-0">
                <h2 className="text-3xl font-orbitron text-purple-300">Centro de Aplicaciones</h2>
                <p className="text-gray-400 mt-2">Explora, analiza y crea. Elige una herramienta para comenzar tu misión como Guardián del Aire.</p>
            </div>
            <div className="flex-grow mt-6 pr-2 -mr-2 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {apps.map(app => (
                        <button 
                            key={app.title}
                            onClick={props[app.action as keyof Omit<AppsLandingPageProps, 'onClose'>] as () => void}
                            className={`relative p-6 bg-gray-800/50 rounded-lg border-2 text-left flex flex-col items-start gap-3 transition-all duration-300 ${app.color} shadow-lg`}
                        >
                            {app.points > 0 && (
                                <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                    +{app.points} PTS
                                </div>
                            )}
                            <div className="text-purple-300">{app.icon}</div>
                            <h3 className="font-orbitron text-lg text-white">{app.title}</h3>
                            <p className="text-sm text-gray-400 flex-grow">{app.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
