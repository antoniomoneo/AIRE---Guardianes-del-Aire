

import React, { useEffect, useRef } from 'react';
import { awardPoints } from '../utils/scoringService';

interface EducationalPackProps {
  onClose: () => void;
  userName: string;
}

export const EducationalPack: React.FC<EducationalPackProps> = ({ onClose, userName }) => {
    const scrollableContainerRef = useRef<HTMLDivElement>(null);
    const hasAwardedPoints = useRef(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            onClose();
          }
        };
        window.addEventListener('keydown', handleKeyDown);

        const container = scrollableContainerRef.current;
        if (!container || !userName) return;

        const handleScroll = () => {
            if (hasAwardedPoints.current) return;
            // Check if scrolled near the bottom (with a 100px buffer)
            if (container.scrollHeight - container.scrollTop <= container.clientHeight + 100) {
                awardPoints(userName, 200);
                hasAwardedPoints.current = true;
                container.removeEventListener('scroll', handleScroll);
            }
        };
        
        container.addEventListener('scroll', handleScroll);
        
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
          if (container) {
            container.removeEventListener('scroll', handleScroll);
          }
        };
      }, [onClose, userName]);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900/95 border border-teal-500/30 rounded-2xl shadow-2xl w-full max-w-4xl h-full max-h-[90vh] p-6 flex flex-col relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-2xl font-orbitron text-teal-300">Pack Educativo: Guardianes del Aire</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none" aria-label="Cerrar">&times;</button>
                </div>
                <div ref={scrollableContainerRef} className="flex-grow mt-4 pr-2 overflow-y-auto text-gray-300 space-y-6">
                    <p className="font-bold text-teal-400 text-lg">
                        Guía de uso para una clase de 4 sesiones con estudiantes de ~15 años. El objetivo es convertir los datos de calidad del aire en una herramienta de aprendizaje activo, pensamiento crítico y creatividad.
                    </p>
                    
                    <section>
                        <h3 className="text-xl font-orbitron text-white">Sesión 1: De los Datos a las Decisiones</h3>
                        <div className="pl-4 border-l-2 border-teal-500/50 mt-2 space-y-2">
                            <p><span className="font-bold">Objetivo:</span> Entender por qué los datos son fundamentales para tomar decisiones informadas.</p>
                            <p><span className="font-bold">Actividad:</span> Iniciar la aventura narrativa de A.I.R.E. Jugar las primeras 2-3 escenas en grupo, debatiendo las respuestas del quiz. Discutir cómo los datos del gráfico ayudan a A.I.R.E. a contar la historia y cómo las "decisiones" (políticas como Madrid Central) se tomaron a partir de la evidencia (datos de contaminación elevados).</p>
                            <p><span className="font-bold">Concepto Clave:</span> Analogía de los datos como los "síntomas" de la ciudad. Un médico necesita datos (fiebre, análisis) para diagnosticar; un gestor de la ciudad necesita datos (niveles de NO₂) para "diagnosticar" y "tratar" la polución.</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-orbitron text-white">Sesión 2: ¿Qué Respiramos? Explorando los Datos</h3>
                        <div className="pl-4 border-l-2 border-teal-500/50 mt-2 space-y-2">
                             <p><span className="font-bold">Objetivo:</span> Familiarizarse con los distintos contaminantes y aprender a usar herramientas de exploración de datos.</p>
                            <p><span className="font-bold">Actividad:</span> Usar el <span className="font-bold text-cyan-400">"Panel de Control"</span>. Dividir la clase en grupos, asignando un contaminante a cada uno (NO₂, PM2.5, O₃, etc.). Cada grupo debe explorar su contaminante y responder preguntas como: ¿En qué años fue más alto? ¿Se observa alguna tendencia estacional (meses con más picos)? ¿Qué pasó en 2020? Luego, cada grupo presenta sus hallazgos a la clase.</p>
                             <p><span className="font-bold">Concepto Clave:</span> Cada contaminante cuenta una parte diferente de la historia. El NO₂ habla del tráfico, el O₃ del calor y las reacciones químicas.</p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-orbitron text-white">Sesión 3: Conviértete en Científico de Datos</h3>
                         <div className="pl-4 border-l-2 border-teal-500/50 mt-2 space-y-2">
                             <p><span className="font-bold">Objetivo:</span> Desarrollar habilidades básicas de análisis y visualización de datos usando herramientas estándar.</p>
                            <p><span className="font-bold">Actividad:</span> Explicar que los datos de la aplicación se pueden analizar externamente. Guiar a los estudiantes para cargar el dataset (CSV proporcionado por el profesor) en Google Sheets o Excel. Tarea: replicar el gráfico de la evolución anual de NO₂ que ven en la aventura. Reto extra: crear un nuevo gráfico, como una comparativa entre NO₂ y O₃, y discutir qué observan.</p>
                             <p><span className="font-bold">Concepto Clave:</span> Las herramientas de software nos permiten hacer nuestras propias preguntas a los datos y descubrir patrones que no son obvios a primera vista.</p>
                        </div>
                    </section>

                     <section>
                        <h3 className="text-xl font-orbitron text-white">Sesión 4: El Arte de los Datos (Tangibilización)</h3>
                         <div className="pl-4 border-l-2 border-teal-500/50 mt-2 space-y-2">
                            <p><span className="font-bold">Objetivo:</span> Traducir datos abstractos en experiencias sensoriales (sonido, forma, imagen) para mejorar la comunicación y el impacto emocional.</p>
                            <p><span className="font-bold">Actividad:</span> Introducir el concepto de "tangibilización". Los estudiantes, en grupos, eligen un periodo o evento significativo (ej: la crisis de 2008, Madrid Central, la pandemia) y lo representan usando el <span className="font-bold text-purple-400">"Audio & Viz Studio"</span> o el <span className="font-bold text-orange-400">"3D Studio"</span>. Al final, cada grupo presenta su creación y explica sus decisiones creativas: "¿Por qué elegiste un tono menor para representar la crisis? ¿Qué significa la altura de los picos en tu escultura 3D?".</p>
                            <p><span className="font-bold">Cierre y Publicación:</span> Animar a los estudiantes a publicar sus creaciones y análisis en la <span className="font-bold text-yellow-400">"Galería"</span> para compartir su trabajo y ganar puntos en el ranking.</p>
                        </div>
                    </section>
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