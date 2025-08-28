
import React, { useEffect } from 'react';

interface AboutProps {
  onClose: () => void;
}

export const About: React.FC<AboutProps> = ({ onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            onClose();
          }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
      }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl w-full max-w-3xl h-full max-h-[90vh] p-6 flex flex-col relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-2xl font-orbitron text-cyan-300">Acerca de: A.I.R.E.</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none" aria-label="Cerrar">&times;</button>
                </div>
                <div className="flex-grow mt-4 pr-2 overflow-y-auto text-gray-300 space-y-4">
                    <p className="font-bold text-cyan-400 text-lg">
                        Tangible Data es una iniciativa dedicada a transformar datos complejos en experiencias accesibles, útiles y motivadoras. Creemos que la información, cuando se presenta de forma clara y atractiva, puede convertirse en una herramienta poderosa para la toma de decisiones y para la acción ciudadana.
                    </p>
                    <p>
                        Con A.I.R.E. – Los Guardianes del Aire en Madrid damos un paso más en nuestra misión: convertir la evolución histórica de la calidad del aire en una aventura narrativa e interactiva. Inspirándonos en los clásicos de la aventura gráfica como King’s Quest, hemos creado un juego educativo que permite a estudiantes y jóvenes descubrir cómo han cambiado los niveles de contaminación en Madrid a lo largo de las últimas dos décadas, qué decisiones se tomaron y qué retos siguen pendientes.
                    </p>
                    <h3 className="text-xl font-orbitron text-white pt-2">Este juego engancha directamente con nuestra misión porque:</h3>
                    <ul className="list-disc list-inside space-y-3 pl-4">
                        <li>
                            <span className="font-bold text-cyan-400">Traducimos datos en experiencias:</span> Los informes técnicos sobre calidad del aire se convierten en un viaje jugable que invita a reflexionar y a actuar.
                        </li>
                        <li>
                            <span className="font-bold text-cyan-400">Promovemos conciencia ecológica:</span> A través de decisiones narrativas, el jugador comprende el impacto de la contaminación y de las medidas de mitigación.
                        </li>
                        <li>
                            <span className="font-bold text-cyan-400">Formamos a la próxima generación:</span> Diseñado para estudiantes, el juego fomenta el pensamiento crítico y la empatía hacia los problemas ambientales.
                        </li>
                        <li>
                            <span className="font-bold text-cyan-400">Conectamos ciencia y ciudadanía:</span> A.I.R.E. es un puente entre la información científica y la vida cotidiana de las personas, mostrando que las decisiones colectivas importan.
                        </li>
                    </ul>
                </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
