import React from 'react';
import { DieValue } from '../types';

interface DieProps {
  value: DieValue;
  held: boolean;
  rolling: boolean;
}

const Die: React.FC<DieProps> = ({ value, held, rolling }) => {
  const pips: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };

  const currentPips = pips[value];

  return (
    // Increased dimensions by ~20%
    <div className={`relative w-12 h-12 sm:w-[3.75rem] sm:h-[3.75rem] border-2 rounded-md flex flex-wrap content-between p-1 transition-all duration-100 shrink-0
      ${held ? 'border-black bg-black text-black' : 'border-[#4a5e4a] bg-[#9dad9d]'}
      ${rolling ? 'opacity-50' : 'opacity-100'}
    `}>
        {/* Background Grid for Pips */}
        <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0.5">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="flex items-center justify-center">
                    {currentPips.includes(i) && (
                        <div className={`w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full ${held ? 'bg-[#9dad9d]' : 'bg-black'}`}></div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};

export default Die;