

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Scene } from './components/Scene';
import { useAirQualityData } from './hooks/useAirQualityData';
import { SCENES } from './constants';
import { Dashboard } from './components/Dashboard';
import { About } from './components/About';
import { Instructions } from './components/Instructions';
import { CreationStudio } from './components/CreationStudio';
import { Studio3D } from './components/Studio3D';
import { Gallery } from './components/Gallery';
import { Ranking } from './components/Ranking';
import { EducationalPack } from './components/EducationalPack';
import { Glossary } from './components/Glossary';
import { awardNarrativePoints } from './utils/scoringService';
import { cancel as cancelSpeech } from './utils/ttsService';
import { RealTimeData } from './components/RealTimeData';
import { AppsLandingPage } from './components/AppsLandingPage';
import { SplashScreen } from './components/SplashScreen';
import { TitleScreen } from './components/TitleScreen';
import { CoverScreen } from './components/CoverScreen';
import { IntroScreen } from './components/IntroScreen';
import { DigitalTwinLab } from './components/DigitalTwinLab';
import { Chat } from './components/Chat';
import { AIEye } from './components/AIEye';


type AppState = 'splash' | 'title' | 'cover' | 'intro' | 'apps';
const INTRO_COMPLETED_KEY = 'aire_intro_completed';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('splash');
  const [userName, setUserName] = useState<string>('');
  
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isEducationalPackOpen, setIsEducationalPackOpen] = useState(false);
  const [isCreationStudioOpen, setIsCreationStudioOpen] = useState(false);
  const [is3DStudioOpen, setIs3DStudioOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [isRealTimeDataOpen, setIsRealTimeDataOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isDataStoryOpen, setIsDataStoryOpen] = useState(false);
  const [isDigitalTwinLabOpen, setIsDigitalTwinLabOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  const [isNarrationEnabled, setIsNarrationEnabled] = useState(true);
  const { data, loading, error } = useAirQualityData();

  useEffect(() => {
    if (appState === 'splash') {
      const timer = setTimeout(() => {
        let isIntroCompleted = false;
        try {
            isIntroCompleted = window.localStorage.getItem(INTRO_COMPLETED_KEY) === 'true';
        } catch (e) {
            console.warn("localStorage is not available. Progress will not be saved.");
            isIntroCompleted = false;
        }

        const pathName = window.location.pathname;
        const hasNameInUrl = pathName && pathName.length > 1;

        if (hasNameInUrl && isIntroCompleted) {
          // Returning user who has completed the intro before
          const nameFromUrl = decodeURIComponent(pathName.substring(1));
          setUserName(nameFromUrl);
          setAppState('apps');
        } else {
          // New user, or returning user who hasn't completed intro, or localStorage is blocked.
          // Reset their state and start from the beginning.
          if (hasNameInUrl) {
            try {
              window.history.replaceState({}, '', '/');
            } catch (e) {
              console.warn("History API not available.", e);
            }
          }
          setUserName('');
          setAppState('cover');
        }
      }, 2500); // Duration of the splash screen
      return () => clearTimeout(timer);
    }
  }, [appState]);


  const closeAllModals = useCallback(() => {
    setIsDashboardOpen(false);
    setIsAboutOpen(false);
    setIsInstructionsOpen(false);
    setIsEducationalPackOpen(false);
    setIsCreationStudioOpen(false);
    setIs3DStudioOpen(false);
    setIsGalleryOpen(false);
    setIsRankingOpen(false);
    setIsRealTimeDataOpen(false);
    setIsGlossaryOpen(false);
    setIsDataStoryOpen(false);
    setIsDigitalTwinLabOpen(false);
    setIsAiAssistantOpen(false);
  }, []);

  const handleGoHome = useCallback(() => {
    closeAllModals();
    setAppState('apps');
  }, [closeAllModals]);

  const handleRestartExperience = useCallback(() => {
      closeAllModals();
      setUserName('');
      try {
        window.localStorage.removeItem(INTRO_COMPLETED_KEY);
      } catch(e) {
          console.warn("Could not clear intro status from localStorage.");
      }
      try {
        window.history.pushState({}, '', '/');
      } catch (e) {
        console.warn("History API not available.", e);
      }
      setAppState('splash');
  }, [closeAllModals]);

  const handleStartMission = (name: string) => {
    const sanitizedName = name.trim();
    if (!sanitizedName) return;
    setUserName(sanitizedName);
    try {
      window.history.pushState({}, '', `/${encodeURIComponent(sanitizedName)}`);
    } catch (e) {
      console.warn("History API not available.", e);
    }
    setAppState('intro');
  };

  const openModal = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    cancelSpeech();
    setter(true);
  };

  const Header: React.FC = () => (
     <header className="absolute top-0 left-0 w-full p-4 z-30 flex justify-between items-center" aria-label="Encabezado principal">
        <img src="/media/tdlogo.png" alt="Tangible Data Logo" className="h-8 w-auto cursor-pointer" onClick={handleRestartExperience} />
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
          <HeaderButton onClick={handleGoHome}>Inicio</HeaderButton>
          <HeaderButton onClick={() => openModal(setIsAboutOpen)}>Acerca de</HeaderButton>
          <HeaderButton onClick={() => openModal(setIsInstructionsOpen)}>Instrucciones</HeaderButton>
          <HeaderButton onClick={() => openModal(setIsGalleryOpen)}>Galería</HeaderButton>
          <HeaderButton onClick={() => openModal(setIsRankingOpen)}>Ranking</HeaderButton>
          <button
              onClick={() => setAppState('apps')}
              className="px-3 py-2 sm:px-4 bg-purple-600/90 text-white rounded-lg shadow-lg hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-300 backdrop-blur-sm transition-transform hover:scale-110 font-orbitron text-xs sm:text-sm flex items-center gap-2"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              Apps
          </button>
          <button
            onClick={() => setIsNarrationEnabled(!isNarrationEnabled)}
            className="px-3 py-2 sm:px-3 bg-gray-500/50 text-white rounded-lg shadow-lg hover:bg-gray-400/50 focus:outline-none focus:ring-2 focus:ring-gray-300 backdrop-blur-sm transition-transform hover:scale-110"
            aria-label={isNarrationEnabled ? "Desactivar narración" : "Activar narración"}
            title={isNarrationEnabled ? "Desactivar narración" : "Activar narración"}
          >
            {isNarrationEnabled ? 
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15v1a1 1 0 001 1h12a1 1 0 001-1v-1a1 1 0 00-.293-.707L16 11.586V8a6 6 0 00-6-6zM8 18a2 2 0 114 0H8z" /></svg> :
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v1.923l-3.321 3.321A6.012 6.012 0 004 8v3.586l-1.707 1.707A1 1 0 003 15v1a1 1 0 001 1h4.586l-2.293 2.293a1 1 0 001.414 1.414L16 6.414V4a1 1 0 00-1.617-.781l-2.48-1.55a1 1 0 00-1.09.076L9.383 3.076zM16 8.085l-2-1.25V4.69l2-1.25v4.645zM12 17a1 1 0 100 2h-1.586l-1-1H12z" clipRule="evenodd" /></svg>
            }
          </button>
        </div>
     </header>
  );

  const HeaderButton: React.FC<{onClick: () => void, children: React.ReactNode }> = ({ onClick, children }) => (
     <button
        onClick={onClick}
        className="px-3 py-2 sm:px-4 bg-cyan-500/80 text-white rounded-lg shadow-lg hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 backdrop-blur-sm transition-transform hover:scale-110 font-orbitron text-xs sm:text-sm"
    >
        {children}
    </button>
  );

  const renderContent = () => {
    switch(appState) {
        case 'splash': return <SplashScreen />;
        case 'title': return <TitleScreen />;
        case 'cover': return <CoverScreen onStart={handleStartMission} isLoading={loading} error={error} />;
        case 'intro': return <IntroScreen userName={userName} onComplete={() => {
            try {
                window.localStorage.setItem(INTRO_COMPLETED_KEY, 'true');
            } catch (e) {
                console.warn("Could not save intro completion status to localStorage.");
            }
            setAppState('apps');
        }} />;
        case 'apps': 
            return <AppsLandingPage 
                onOpenDashboard={() => openModal(setIsDashboardOpen)}
                onOpenCreationStudio={() => openModal(setIsCreationStudioOpen)}
                onOpen3DStudio={() => openModal(setIs3DStudioOpen)}
                onOpenRealTimeData={() => openModal(setIsRealTimeDataOpen)}
                onOpenEducationalPack={() => openModal(setIsEducationalPackOpen)}
                onOpenGlossary={() => openModal(setIsGlossaryOpen)}
                onOpenDataStory={() => openModal(setIsDataStoryOpen)}
                onOpenDigitalTwinLab={() => openModal(setIsDigitalTwinLabOpen)}
                onOpenAiAssistant={() => openModal(setIsAiAssistantOpen)}
            />;
        default: return null;
    }
  };

  return (
    <main className="bg-gray-900 text-white w-full h-full overflow-hidden font-roboto">
       {appState === 'apps' && <Header />}
      
       {renderContent()}

       {isDataStoryOpen && data && (
        <DataStory
          data={data}
          onClose={() => setIsDataStoryOpen(false)}
          isNarrationEnabled={isNarrationEnabled}
          userName={userName}
        />
       )}
       
       {isDashboardOpen && data && (
        <Dashboard
          data={data}
          onClose={() => setIsDashboardOpen(false)}
          userName={userName}
        />
      )}

      {isAboutOpen && (
        <About onClose={() => setIsAboutOpen(false)} />
      )}

      {isInstructionsOpen && (
        <Instructions onClose={() => setIsInstructionsOpen(false)} userName={userName} />
      )}

      {isGlossaryOpen && (
        <Glossary onClose={() => setIsGlossaryOpen(false)} userName={userName} />
      )}

      {isEducationalPackOpen && (
        <EducationalPack onClose={() => setIsEducationalPackOpen(false)} userName={userName} />
      )}

      {isGalleryOpen && (
        <Gallery onClose={() => setIsGalleryOpen(false)} />
      )}

      {isRankingOpen && (
        <Ranking onClose={() => setIsRankingOpen(false)} />
      )}
      
      {isCreationStudioOpen && data && (
        <CreationStudio
            data={data}
            onClose={() => setIsCreationStudioOpen(false)}
            userName={userName}
        />
      )}

      {is3DStudioOpen && data && (
        <Studio3D
            data={data}
            onClose={() => setIs3DStudioOpen(false)}
            userName={userName}
        />
      )}

      {isRealTimeDataOpen && (
        <RealTimeData onClose={() => setIsRealTimeDataOpen(false)} userName={userName}/>
      )}

      {isDigitalTwinLabOpen && data && (
        <DigitalTwinLab data={data} onClose={() => setIsDigitalTwinLabOpen(false)} userName={userName}/>
      )}

      {isAiAssistantOpen && data && (
        <AiAssistantModal data={data} onClose={() => setIsAiAssistantOpen(false)} userName={userName} />
      )}
    </main>
  );
};

// A wrapper for the original Scene component to be used as a modal
const DataStory: React.FC<{data: any, onClose: () => void, isNarrationEnabled: boolean, userName: string}> = ({ data, onClose, isNarrationEnabled, userName }) => {
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

    const handleNext = useCallback(() => {
        if (currentSceneIndex === SCENES.length - 2) {
            awardNarrativePoints(userName);
        }
        if (currentSceneIndex < SCENES.length - 1) {
            setCurrentSceneIndex(prev => prev + 1);
        } else {
            onClose(); // Close modal on final scene
        }
    }, [currentSceneIndex, onClose, userName]);

    const handleReset = useCallback(() => {
        setCurrentSceneIndex(0);
    }, []);

    const chartData = useMemo(() => {
        if (!data) return null;
        const currentScene = SCENES[currentSceneIndex];
        if (!currentScene.startYear || !currentScene.endYear) return null;
        const filteredData = data.filter((d: any) => d.ANO >= currentScene.startYear! && d.ANO <= currentScene.endYear!);
        const annualData = filteredData.reduce((acc: any, curr: any) => {
            const year = curr.ANO;
            if (!acc[year]) acc[year] = { year, NO2: 0, count: 0 };
            if (curr.NO2 !== null) {
                acc[year].NO2 += curr.NO2;
                acc[year].count++;
            }
            return acc;
        }, {});
        return Object.values(annualData).map((d: any) => ({ year: d.year, NO2: d.count > 0 ? d.NO2 / d.count : 0 })).sort((a, b) => a.year - b.year);
    }, [data, currentSceneIndex]);

    return (
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose}>
        <div className="w-full h-full relative" onClick={e => e.stopPropagation()}>
           <Scene
                sceneData={SCENES[currentSceneIndex]}
                onNext={handleNext}
                onReset={handleReset}
                chartData={chartData}
                isLastScene={currentSceneIndex === SCENES.length - 1}
                fullData={data}
                isNarrationEnabled={isNarrationEnabled}
                userName={userName}
            />
             <button onClick={onClose} className="absolute top-4 right-4 text-white text-4xl hover:text-cyan-300 z-50" aria-label="Cerrar">&times;</button>
        </div>
      </div>
    )
}

const AiAssistantModal: React.FC<{data: any, onClose: () => void, userName: string}> = ({ data, onClose, userName }) => {
    const [chatKey, setChatKey] = useState(0);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl w-full max-w-3xl h-full max-h-[90vh] p-6 flex flex-col relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-4 border-b border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <AIEye />
                        <h2 className="text-2xl font-orbitron text-cyan-300">Asistente A.I.R.E.</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none" aria-label="Cerrar">&times;</button>
                </div>
                <div className="flex-grow mt-4 -mx-6 -mb-6">
                    <Chat
                        key={chatKey}
                        airQualityData={data}
                        userName={userName}
                        onReset={() => setChatKey(k => k + 1)}
                    />
                </div>
            </div>
        </div>
    );
};


export default App;