import React, { useEffect, useRef } from 'react';
import { awardPoints } from '../utils/scoringService';
import { AIR_QUALITY_REPORT_TEXT } from '../data/report';

interface KnowledgeBaseProps {
  onClose: () => void;
  userName: string;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onClose, userName }) => {
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
      
    const renderContent = () => {
        const lines = AIR_QUALITY_REPORT_TEXT.trim().split('\n').filter(line => line.trim() !== '');
        const elements: React.ReactNode[] = [];
        let listType: 'ul' | 'ol' | null = null;
        let listItems: string[] = [];
    
        const flushList = () => {
            if (listItems.length > 0 && listType) {
                if (listType === 'ul') {
                    elements.push(
                        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-2 pl-4">
                            {listItems.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    );
                } else { // 'ol'
                    elements.push(
                        <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-2 pl-4">
                            {listItems.map((item, i) => <li key={i}>{item}</li>)}
                        </ol>
                    );
                }
            }
            listItems = [];
            listType = null;
        };
    
        lines.forEach((line, index) => {
            if (line.startsWith('#LI#')) {
                if (listType !== 'ul') flushList();
                listType = 'ul';
                listItems.push(line.replace('#LI# •', '').trim());
            } else if (line.startsWith('#NLI#')) {
                if (listType !== 'ol') flushList();
                listType = 'ol';
                listItems.push(line.replace(/#NLI# \d+\.\s*/, '').trim());
            } else {
                flushList();
                if (line.startsWith('#TITLE#')) {
                    elements.push(<h2 key={index} className="text-3xl font-orbitron text-gray-200 pb-2 mb-4 border-b border-gray-600">{line.replace('#TITLE#', '').trim()}</h2>);
                } else if (line.startsWith('#SUBTITLE#')) {
                    elements.push(<h3 key={index} className="text-2xl font-orbitron text-white pt-4 mb-2">{line.replace('#SUBTITLE#', '').trim()}</h3>);
                } else { // Paragraph
                    elements.push(<p key={index} className="text-gray-300 leading-relaxed">{line.replace('#P#', '').trim()}</p>);
                }
            }
        });
    
        flushList(); // Flush any remaining list at the end
        return elements;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-gray-900/95 border border-gray-500/30 rounded-2xl shadow-2xl w-full max-w-4xl h-full max-h-[90vh] p-6 flex flex-col relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-2xl font-orbitron text-gray-300">Base de Conocimiento de A.I.R.E.</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl leading-none" aria-label="Cerrar">&times;</button>
                </div>
                <div className="flex-grow mt-4 pr-2 overflow-y-auto text-gray-300 space-y-4">
                    {renderContent()}
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
