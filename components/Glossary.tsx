

import React, { useEffect, useRef } from 'react';
import { awardPoints } from '../utils/scoringService';

interface GlossaryProps {
  onClose: () => void;
  userName: string;
}

const glossaryData = [
    { codMag: 1, mag: 'Dióxido de Azufre', abrev: 'SO2', unidad: 'µg/m³', codTec: 38, tec: 'Fluorescencia ultravioleta' },
    { codMag: 6, mag: 'Monóxido de Carbono', abrev: 'CO', unidad: 'mg/m³', codTec: 48, tec: 'Absorción infrarroja' },
    { codMag: 7, mag: 'Monóxido de Nitrógeno', abrev: 'NO', unidad: 'µg/m³', codTec: 8, tec: 'Quimioluminiscencia' },
    { codMag: 8, mag: 'Dióxido de Nitrógeno', abrev: 'NO2', unidad: 'µg/m³', codTec: 8, tec: 'Quimioluminiscencia' },
    { codMag: 9, mag: 'Partículas < 2.5 µm', abrev: 'PM2.5', unidad: 'µg/m³', codTec: 47, tec: 'Microbalanza/Espectrometría*' },
    { codMag: 10, mag: 'Partículas < 10 µm', abrev: 'PM10', unidad: 'µg/m³', codTec: 47, tec: 'Microbalanza/Espectrometría*' },
    { codMag: 12, mag: 'Óxidos de Nitrógeno', abrev: 'NOx', unidad: 'µg/m³', codTec: 8, tec: 'Quimioluminiscencia' },
    { codMag: 14, mag: 'Ozono', abrev: 'O3', unidad: 'µg/m³', codTec: 6, tec: 'Absorción ultravioleta' },
    { codMag: 20, mag: 'Tolueno', abrev: 'TOL', unidad: 'µg/m³', codTec: 59, tec: 'Cromatografía de gases' },
    { codMag: 30, mag: 'Benceno', abrev: 'BEN', unidad: 'µg/m³', codTec: 59, tec: 'Cromatografía de gases' },
    { codMag: 35, mag: 'Etilbenceno', abrev: 'EBE', unidad: 'µg/m³', codTec: 59, tec: 'Cromatografía de gases' },
    { codMag: 37, mag: 'Metaxileno', abrev: 'MXY', unidad: 'µg/m³', codTec: 59, tec: 'Cromatografía de gases' },
    { codMag: 38, mag: 'Paraxileno', abrev: 'PXY', unidad: 'µg/m³', codTec: 59, tec: 'Cromatografía de gases' },
    { codMag: 39, mag: 'Ortoxileno', abrev: 'OXY', unidad: 'µg/m³', codTec: 59, tec: 'Cromatografía de gases' },
    { codMag: 42, mag: 'Hidrocarburos totales (hexano)', abrev: 'TCH', unidad: 'mg/m³', codTec: 59, tec: 'Cromatografía de gases' },
    { codMag: 43, mag: 'Metano', abrev: 'CH4', unidad: 'mg/m³', codTec: 59, tec: 'Cromatografía de gases' },
    { codMag: 44, mag: 'Hidrocarburos no metánicos (hexano)', abrev: 'NMHC', unidad: 'mg/m³', codTec: 59, tec: 'Cromatografía de gases' },
    { codMag: 431, mag: 'Metaparaxileno', abrev: 'MPX', unidad: 'mg/m³', codTec: 59, tec: 'Cromatografía de gases' },
];

export const Glossary: React.FC<GlossaryProps> = ({ onClose, userName }) => {
    const hasAwardedPoints = useRef(false);

    useEffect(() => {
        if (userName && !hasAwardedPoints.current) {
            awardPoints(userName, 100);
            hasAwardedPoints.current = true;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            onClose();
          }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
      }, [onClose, userName]);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl w-full max-w-4xl h-full max-h-[90vh] p-6 flex flex-col relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-2xl font-orbitron text-cyan-300">Glosario Técnico</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none" aria-label="Cerrar">&times;</button>
                </div>
                <div className="flex-grow mt-4 pr-2 overflow-y-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="sticky top-0 bg-gray-800 text-xs text-cyan-300 uppercase">
                            <tr>
                                <th className="px-4 py-2">Magnitud</th>
                                <th className="px-4 py-2">Abrev.</th>
                                <th className="px-4 py-2">Unidad</th>
                                <th className="px-4 py-2">Técnica de Medida</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {glossaryData.map((item) => (
                                <tr key={item.codMag} className="hover:bg-gray-800/50">
                                    <td className="px-4 py-2 font-semibold">{item.mag}</td>
                                    <td className="px-4 py-2 font-mono">{item.abrev}</td>
                                    <td className="px-4 py-2" dangerouslySetInnerHTML={{ __html: item.unidad.replace('m3', 'm³') }} />
                                    <td className="px-4 py-2">{item.tec}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     <p className="text-xs text-gray-500 mt-4">* Microbalanza de oscilación/Espectrometría de absorción beta.</p>
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