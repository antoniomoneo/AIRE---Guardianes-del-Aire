
import React from 'react';

export const SplashScreen: React.FC = () => {
    return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900 animate-fade-in-out">
            <img src="/media/tdlogo.png" alt="Tangible Data Logo" className="w-auto h-24" />
             <style>{`
                @keyframes fade-in-out {
                    0% { opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { opacity: 0; }
                }
                .animate-fade-in-out {
                    animation: fade-in-out 2.5s ease-in-out forwards;
                }
            `}</style>
        </div>
    );
};