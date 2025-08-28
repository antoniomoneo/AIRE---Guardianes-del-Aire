
import React from 'react';

export const AIEye: React.FC = () => {
  return (
    <div className="w-10 h-10 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style={{ stopColor: '#67e8f9', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#0e7490', stopOpacity: 1 }} />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" stroke="#0891b2" strokeWidth="4" fill="none">
           <animate attributeName="r" values="48;45;48" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="50" r="35" fill="url(#grad1)">
          <animateTransform
            attributeName="transform"
            type="scale"
            values="1; 1.05; 1"
            dur="3s"
            repeatCount="indefinite"
            additive="sum"
            accumulate="sum"
          />
        </circle>
        <circle cx="50" cy="50" r="15" fill="#f0f9ff" />
      </svg>
    </div>
  );
};
