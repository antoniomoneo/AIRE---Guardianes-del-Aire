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
        color: { border: 'border-green-500/30', bg: 'bg-green-900/30', hoverBg: 'hover:bg-green-800/40', iconBg: 'bg-green-500/20', description: 'text-green-200', cta: 'bg-green-600 hover:bg-green-500', shadow: 'shadow-green-500/20' },
        onClickProp: 'onOpenAiAssistant',
    },
    {
        title: "Simulador Data Story",
        description: "Embárcate en un viaje narrativo a través de la historia de la contaminación en Madrid. Descubre los hitos clave y pon a prueba tus conocimientos.",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM2 10a8 8 0 1116 0 8 8 0 01-16 0zm9.5-2.5a1.5 1.5 0 00-3 0v4.793l-1.146-1.147a.5.5 0 00-.708.708l2 2a.5.5 0 00.708 0l2-2a.5.5 0 00-.708-.708L11.5 12.293V7.5z" clipRule="evenodd" /></svg>,
        color: { border: 'border-cyan-500/30', bg: 'bg-cyan-900/30', hoverBg: 'hover:bg-cyan-800/40', iconBg: 'bg-cyan-500/20', description: 'text-cyan-200', cta: 'bg-cyan-600 hover:bg-cyan-500', shadow: 'shadow-cyan-500/20' },
        onClickProp: 'onOpenDataStory',
    },
    {
        title: "Laboratorio de Escenarios",
        description: "Utiliza un gemelo digital para simular el impacto de eventos históricos y políticas futuras. ¿Qué hubiera pasado si...? ¿Qué pasará si...?",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V5a1 1 0 00-1.447-.894l-4 2A1 1 0 0011 7v10zM4 17a1 1 0 001.447.894l4-2A1 1 0 0010 15V5a1 1 0 00-1.447-.894l-4 2A1 1 0 004 7v10z" /></svg>,
        color: { border: 'border-indigo-500/30', bg: 'bg-indigo-900/30', hoverBg: 'hover:bg-indigo-800/40', iconBg: 'bg-indigo-500/20', description: 'text-indigo-200', cta: 'bg-indigo-600 hover:bg-indigo-500', shadow: 'shadow-indigo-500/20' },
        onClickProp: 'onOpenDigitalTwinLab',
    },
    {
        title: "Dashboard de Datos",
        description: "Explora y analiza el conjunto de datos históricos completo. Filtra por contaminante y fecha para sacar tus propias conclusiones.",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>,
        color: { border: 'border-blue-500/30', bg: 'bg-blue-900/30', hoverBg: 'hover:bg-blue-800/40', iconBg: 'bg-blue-500/20', description: 'text-blue-200', cta: 'bg-blue-600 hover:bg-blue-500', shadow: 'shadow-blue-500/20' },
        onClickProp: 'onOpenDashboard',
    },
     {
        title: "Participa Madrid",
        description: "Explora propuestas ciudadanas reales sobre calidad del aire y usa la IA para redactar y mejorar tus propias iniciativas.",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
        color: { border: 'border-pink-500/30', bg: 'bg-pink-900/30', hoverBg: 'hover:bg-pink-800/40', iconBg: 'bg-pink-500/20', description: 'text-pink-200', cta: 'bg-pink-600 hover:bg-pink-500', shadow: 'shadow-pink-500/20' },
        onClickProp: 'onOpenParticipa',
    },
    {
        title: "Audio & Viz Studio",
        description: "Transforma los datos en música y visualizaciones generativas. Crea piezas audiovisuales únicas y compártelas con la comunidad.",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4a1 1 0 00-.804-.98z" /></svg>,
        color: { border: 'border-purple-500/30', bg: 'bg-purple-900/30', hoverBg: 'hover:bg-purple-800/40', iconBg: 'bg-purple-500/20', description: 'text-purple-200', cta: 'bg-purple-600 hover:bg-purple-500', shadow: 'shadow-purple-500/20' },
        onClickProp: 'onOpenCreationStudio',
    },
    {
        title: "3D Studio",
        description: "Convierte los datos en esculturas y terrenos tridimensionales. Modela la información para verla desde una nueva perspectiva.",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" /></svg>,
        color: { border: 'border-orange-500/30', bg: 'bg-orange-900/30', hoverBg: 'hover:bg-orange-800/40', iconBg: 'bg-orange-500/20', description: 'text-orange-200', cta: 'bg-orange-600 hover:bg-orange-500', shadow: 'shadow-orange-500/20' },
        onClickProp: 'onOpen3DStudio',
    },
    {
        title: "Datos de Ayer",
        description: "Consulta los datos de calidad del aire más recientes (día anterior). Compara los niveles actuales con las medias históricas.",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>,
        color: { border: 'border-red-500/30', bg: 'bg-red-900/30', hoverBg: 'hover:bg-red-800/40', iconBg: 'bg-red-500/20', description: 'text-red-200', cta: 'bg-red-600 hover:bg-red-500', shadow: 'shadow-red-500/20' },
        onClickProp: 'onOpenRealTimeData',
    },
    {
        title: "Pack Educativo",
        description: "Una guía para docentes sobre cómo usar esta herramienta en el aula, con actividades y objetivos de aprendizaje para 4 sesiones.",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L9 9.61v5.07L4.606 12.44a1 1 0 00-1.212 1.58L9 17.61v2.31a1 1 0 102 0v-2.31l5.606-3.58a1 1 0 00-1.212-1.58L11 14.68v-5.07l6.394-2.69a1 1 0 000-1.84l-7-3zM9 8.39L4 6.25l5-2.12 5 2.12L9 8.39z" /></svg>,
        color: { border: 'border-teal-500/30', bg: 'bg-teal-900/30', hoverBg: 'hover:bg-teal-800/40', iconBg: 'bg-teal-500/20', description: 'text-teal-200', cta: 'bg-teal-600 hover:bg-teal-500', shadow: 'shadow-teal-500/20' },
        onClickProp: 'onOpenEducationalPack',
    },
    {
        title: "Base de Conocimiento",
        description: "Accede al informe técnico completo que utiliza la IA para responder preguntas. Ideal para profundizar en los detalles.",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 16c1.255 0 2.443-.29 3.5-.804V4.804zM14.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 0114.5 16c1.255 0 2.443-.29 3.5-.804v-10A7.968 7.968 0 0014.5 4z" /></svg>,
        color: { border: 'border-gray-500/30', bg: 'bg-gray-800/30', hoverBg: 'hover:bg-gray-700/40', iconBg: 'bg-gray-500/20', description: 'text-gray-300', cta: 'bg-gray-600 hover:bg-gray-500', shadow: 'shadow-gray-500/20' },
        onClickProp: 'onOpenKnowledgeBase',
    },
    {
        title: "Glosario Técnico",
        description: "Un diccionario de los contaminantes, sus abreviaturas, unidades y las técnicas de medición utilizadas.",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm3 1a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>,
        color: { border: 'border-blue-gray-500/30', bg: 'bg-gray-800/30', hoverBg: 'hover:bg-gray-700/40', iconBg: 'bg-gray-500/20', description: 'text-gray-200', cta: 'bg-gray-600 hover:bg-gray-500', shadow: 'shadow-gray-500/20' },
        onClickProp: 'onOpenGlossary',
    },
    {
        title: "Súmate a la Comunidad",
        description: "Tangible Data es un colectivo abierto. Si te apasiona el arte, los datos, la tecnología y la educación, ¡queremos conocerte!",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>,
        color: { border: 'border-amber-500/30', bg: 'bg-amber-900/30', hoverBg: 'hover:bg-amber-800/40', iconBg: 'bg-amber-500/20', description: 'text-amber-200', cta: 'bg-amber-600 hover:bg-amber-500', shadow: 'shadow-amber-500/20' },
        onClickProp: 'onOpenJoinUs',
    },
];

const AppCard: React.FC<{ app: typeof apps[0]; onOpen: () => void }> = ({ app, onOpen }) => (
  <div
    className={`group relative flex flex-col justify-between rounded-2xl border-2 p-5 transition-all duration-300 ${app.color.border} ${app.color.bg} ${app.color.hoverBg} h-full`}
  >
    <div>
      <div className={`mb-4 inline-block rounded-lg p-3 text-white ${app.color.iconBg}`}>{app.icon}</div>
      <h3 className="mb-2 font-orbitron text-xl font-bold text-white">{app.title}</h3>
      <p className={`mb-4 text-sm ${app.color.description}`}>{app.description}</p>
    </div>
    <button
      onClick={onOpen}
      className={`mt-auto w-full rounded-lg px-4 py-2 font-orbitron text-sm font-bold text-white transition-transform group-hover:scale-105 ${app.color.cta} shadow-lg ${app.color.shadow}`}
    >
      Abrir App
    </button>
  </div>
);


export const AppsLandingPage: React.FC<AppsLandingPageProps> = (props) => {
   useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full h-full overflow-y-auto bg-gray-900 px-4 pt-24 pb-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
            <h1 className="text-4xl font-orbitron font-bold text-cyan-300 sm:text-5xl">Centro de Aplicaciones A.I.R.E.</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
                Tu arsenal de herramientas para analizar, crear y compartir. Cada app es un paso más en tu misión como Guardián o Guardiana del Aire.
            </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {apps.map((app) => (
                <AppCard key={app.title} app={app} onOpen={props[app.onClickProp]} />
            ))}
        </div>
      </div>
    </div>
  );
};
