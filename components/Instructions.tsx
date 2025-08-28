

import React, { useEffect } from 'react';

interface InstructionsProps {
  onClose: () => void;
  userName: string;
}

export const Instructions: React.FC<InstructionsProps> = ({ onClose, userName }) => {
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
                    <h2 className="text-2xl font-orbitron text-cyan-300">Misión: Guardián del Aire</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none" aria-label="Cerrar">&times;</button>
                </div>
                <div className="flex-grow mt-4 pr-2 overflow-y-auto text-gray-300 space-y-4">
                    <p className="font-bold text-cyan-400 text-lg">
                        ¡Bienvenido/a, {userName}! Tu misión es comprender el pasado, presente y futuro de la calidad del aire en Madrid. Utiliza las herramientas a tu disposición, comparte tus descubrimientos y compite para obtener la puntuación más alta en el ranking.
                    </p>
                    
                    <h3 className="text-xl font-orbitron text-white pt-2">Tu Aventura</h3>
                    <p>
                        Acompaña a A.I.R.E. en un viaje narrativo a través de la historia de la contaminación en Madrid. Presta atención a los datos, responde correctamente a las preguntas y llegarás al final para desbloquear el modo de consulta libre y ganar tus primeros puntos.
                    </p>

                    <h3 className="text-xl font-orbitron text-white pt-2">Tus Herramientas</h3>
                    <ul className="list-disc list-inside space-y-3 pl-4">
                        <li><span className="font-bold text-green-400">Asistente A.I.R.E.:</span> Hazle preguntas directas a la IA sobre la calidad del aire, las normativas o los datos históricos para resolver tus dudas.</li>
                        <li><span className="font-bold text-cyan-400">Panel de Control:</span> Analiza en detalle todos los datos históricos de los principales contaminantes. Filtra por fechas, agrupa por años o meses y saca tus propias conclusiones.</li>
                        <li><span className="font-bold text-purple-400">Audio & Viz Studio:</span> Transforma los datos en una pieza audiovisual única. Combina visualizaciones generativas con música creada a partir de los niveles de contaminación.</li>
                        <li><span className="font-bold text-orange-400">3D Studio:</span> Convierte los datos en esculturas y terrenos tridimensionales. Modela la información para verla desde una perspectiva completamente nueva.</li>
                        <li><span className="font-bold text-yellow-400">Galería:</span> El corazón de la comunidad. Publica tus creaciones y análisis, y explora, vota y aprende del trabajo de otros Guardianes del Aire.</li>
                    </ul>

                    <h3 className="text-xl font-orbitron text-white pt-2">Sistema de Puntos</h3>
                     <p>Gana puntos para subir en el <span className="font-bold text-green-400">Ranking</span> y demostrar tu compromiso como Guardián o Guardiana del Aire:</p>
                    <ul className="list-disc list-inside space-y-3 pl-4">
                        <li><span className="font-bold text-white">500 Puntos:</span> Publica un análisis (conclusión y recomendación) desde el Panel de Control. ¡Es la acción más valiosa!</li>
                         <li><span className="font-bold text-white">200 Puntos:</span> Completa el viaje narrativo con A.I.R.E. ("Simulador Data Story") por primera vez.</li>
                        <li><span className="font-bold text-white">100 Puntos:</span> Publica una creación desde el Audio & Viz Studio.</li>
                        <li><span className="font-bold text-white">100 Puntos:</span> Publica un modelo 3D desde el 3D Studio.</li>
                        <li><span className="font-bold text-white">10 Puntos:</span> Por cada "like" que recibas en cualquiera de tus publicaciones en la Galería.</li>
                    </ul>

                    <p className="pt-4 text-center text-cyan-300 font-orbitron">
                        ¡El futuro del aire de Madrid está en tus manos!
                    </p>
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