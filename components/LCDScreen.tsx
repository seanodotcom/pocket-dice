import React from 'react';
import { GameState, Category } from '../types';
import Die from './Die';
import { calculateTotalScore, calculateUpperTotal } from '../services/gameLogic';

interface LCDScreenProps {
  gameState: GameState;
  previewScore: number;
  resetConfirm?: boolean;
  soundStatus?: 'ON' | 'OFF' | null;
}

const LCDScreen: React.FC<LCDScreenProps> = ({ gameState, previewScore, resetConfirm = false, soundStatus = null }) => {
  const { dice, held, scores, selectedCategory, phase, rollsLeft, yahtzeeBonus } = gameState;

  const isScoring = phase === 'scoring';
  const isGameOver = phase === 'gameOver';

  // Helper to render small arrows/triangles - 30% smaller (18px -> 12px)
  const Cursor = ({ active, rotate = 0 }: { active: boolean, rotate?: number }) => (
    <div className={`transition-opacity duration-150 ${active ? 'opacity-100 animate-blink' : 'opacity-0'}`}>
        <svg width="12" height="12" viewBox="0 0 10 10" className="fill-black" style={{ transform: `rotate(${rotate}deg)` }}>
            <path d="M0,0 L10,0 L5,8 Z" />
        </svg>
    </div>
  );

  const getCategoryLabel = (cat: Category) => {
    switch (cat) {
        case Category.ONES: return '1';
        case Category.TWOS: return '2';
        case Category.THREES: return '3';
        case Category.FOURS: return '4';
        case Category.FIVES: return '5';
        case Category.SIXES: return '6';
        case Category.THREE_OF_A_KIND: return '3ofK';
        case Category.FOUR_OF_A_KIND: return '4ofK';
        case Category.FULL_HOUSE: return 'FULL';
        case Category.SMALL_STRAIGHT: return 'S-STR';
        case Category.LARGE_STRAIGHT: return 'L-STR';
        case Category.CHANCE: return 'CHNC';
        case Category.YAHTZEE: return 'YHTZ';
        default: return '';
    }
  };

  const getScoreDisplay = (cat: Category) => {
    if (scores[cat] !== null) return scores[cat];
    if (isScoring && selectedCategory === cat) return previewScore;
    return '';
  };

  const upperTotal = calculateUpperTotal(scores);
  const hasBonus = upperTotal >= 63;
  // Pass accumulated yahtzeeBonus to total score calc
  const totalScore = calculateTotalScore(scores, yahtzeeBonus);

  return (
    <div className="w-full bg-[#9dad9d] border-4 border-black/20 inset-shadow rounded-lg p-2 sm:p-4 flex flex-col gap-1 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)] font-lcd text-black relative overflow-hidden select-none">
      
      {/* Background grain texture overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

      {/* Top Row: Categories 1-6 (Evenly Spaced) */}
      <div className="grid grid-cols-6 gap-1 text-sm sm:text-base text-center border-b border-black/10 pb-1 items-end">
        {[Category.ONES, Category.TWOS, Category.THREES, Category.FOURS, Category.FIVES, Category.SIXES].map((cat) => (
            <div key={cat} className="flex flex-col items-center justify-end">
                <div className="font-bold mb-0.5">{getCategoryLabel(cat)}</div>
                <Cursor active={selectedCategory === cat} />
                <div className="h-8 font-bold text-2xl sm:text-3xl leading-none">
                    {getScoreDisplay(cat)}
                </div>
            </div>
        ))}
      </div>

      {/* Middle Area: Dice */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 relative w-full">
          {/* Dice Container - Distributed Evenly */}
          <div className="flex justify-between items-center w-full px-1 sm:px-2 z-10">
              {dice.map((d, i) => (
                  <Die key={i} value={d} held={held[i]} rolling={phase === 'playing' && rollsLeft < 3} />
              ))}
          </div>
          
          {/* Game Over Message Overlay */}
          {isGameOver && !resetConfirm && !soundStatus && (
             <div className="absolute inset-0 flex items-center justify-center bg-[#9dad9d]/90 z-20">
                 <div className="text-3xl font-bold uppercase tracking-widest animate-pulse">GAME OVER</div>
             </div>
          )}

          {/* Reset Confirmation Overlay */}
          {resetConfirm && !soundStatus && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#9dad9d]/90 z-30 animate-pulse">
                 <div className="text-xl font-bold uppercase tracking-wide">NEW GAME?</div>
                 <div className="text-sm font-bold uppercase tracking-wide mt-1">PRESS NEW</div>
             </div>
          )}

          {/* Sound Status Overlay */}
          {soundStatus && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#9dad9d]/95 z-40 animate-pulse">
                 {/* Icons */}
                 {soundStatus === 'ON' ? (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="black" className="mb-2">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                 ) : (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="black" className="mb-2">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                 )}
                 <div className="text-xl font-bold uppercase tracking-wide">SOUND {soundStatus}</div>
             </div>
          )}
      </div>

      {/* Status Row: Rolls | Progress | Bonus + Score */}
      <div className="flex items-center justify-between w-full px-2 mb-2 h-12 relative z-0">
            
            {/* Left: Rolls Indicator */}
            <div className="flex flex-col items-start gap-1 w-20">
                <span className="text-xs font-bold leading-none uppercase tracking-wide opacity-80">Rolls</span>
                <div className="flex gap-1.5">
                    {[1, 2, 3].map(i => (
                        <div 
                            key={i} 
                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md border-2 border-black transition-colors duration-150 ${i <= rollsLeft ? 'bg-black shadow-[1px_1px_0_rgba(0,0,0,0.2)]' : 'bg-transparent'}`} 
                        />
                    ))}
                </div>
            </div>

            {/* Center: Upper Section Progress toward Bonus */}
            <div className="flex flex-col items-center">
                 <span className="text-[0.6rem] font-bold uppercase leading-none opacity-60">Upper</span>
                 <span className="text-sm font-bold leading-none">{upperTotal}/63</span>
            </div>

            {/* Right: Bonus and Total Score aligned together */}
            <div className="flex items-end gap-3 min-w-28 justify-end">
                <div className={`flex flex-col items-end transition-opacity duration-300 ${hasBonus ? 'opacity-100' : 'opacity-10'}`}>
                    <span className="text-[0.6rem] font-bold uppercase leading-none tracking-wide">Bonus</span>
                    <div className="text-lg font-bold leading-none">35</div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xs font-bold leading-none uppercase tracking-wide opacity-80">Score</span>
                    <div className="font-bold text-3xl leading-none tracking-tighter">
                       {totalScore}
                    </div>
                </div>
            </div>
      </div>

      {/* Bottom Row: Lower Categories */}
      <div className="grid grid-cols-7 gap-0.5 text-xs sm:text-sm text-center border-t border-black/10 pt-1">
        {[
            Category.THREE_OF_A_KIND,
            Category.FOUR_OF_A_KIND,
            Category.FULL_HOUSE,
            Category.SMALL_STRAIGHT,
            Category.LARGE_STRAIGHT,
            Category.CHANCE,
            Category.YAHTZEE
        ].map((cat) => (
            <div key={cat} className="flex flex-col-reverse items-center">
                <div className="font-bold mt-0.5 leading-none tracking-tighter scale-y-110">{getCategoryLabel(cat)}</div>
                <Cursor active={selectedCategory === cat} rotate={180} />
                <div className="h-8 font-bold flex items-end justify-center text-2xl sm:text-3xl leading-none">
                    {getScoreDisplay(cat)}
                </div>
            </div>
        ))}
      </div>

    </div>
  );
};

export default LCDScreen;