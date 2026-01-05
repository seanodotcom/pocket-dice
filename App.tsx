import React, { useReducer, useEffect, useState, useMemo } from 'react';
import { GameState, Category, ScoreSheet, DieValue } from './types';
import { INITIAL_SCORES, ORDERED_CATEGORIES, calculateScore, calculateTotalScore, isJokerRoll } from './services/gameLogic';
import { audioService } from './services/audioService';
import LCDScreen from './components/LCDScreen';
import PhysicalButton from './components/PhysicalButton';

const initialState: GameState = {
    dice: [1, 1, 1, 1, 1],
    held: [false, false, false, false, false],
    rollsLeft: 3,
    scores: { ...INITIAL_SCORES },
    selectedCategory: null,
    phase: 'idle',
    turn: 1,
    bonusApplied: false,
    soundEnabled: true,
    highScore: parseInt(localStorage.getItem('yahtzee_highscore') || '0', 10),
    yahtzeeBonus: 0,
};

type Action =
    | { type: 'NEW_GAME' }
    | { type: 'TOGGLE_HOLD'; index: number }
    | { type: 'ROLL_DICE'; newValues: DieValue[] }
    | { type: 'START_SCORING' }
    | { type: 'SELECT_CATEGORY'; direction: 'next' | 'prev' }
    | { type: 'CONFIRM_SCORE' }
    | { type: 'TOGGLE_SOUND' };

// Helper to determine default selection
const getInitialSelection = (dice: DieValue[], scores: ScoreSheet): Category | null => {
    const joker = isJokerRoll(dice, scores);

    if (joker) {
        const dieValue = dice[0];
        const upperCategories = [Category.ONES, Category.TWOS, Category.THREES, Category.FOURS, Category.FIVES, Category.SIXES];
        const correspondingCat = upperCategories[dieValue - 1];
        if (scores[correspondingCat] === null) {
            return correspondingCat;
        }
    }

    // Default behavior: find first available
    return ORDERED_CATEGORIES.find(c => scores[c] === null) || null;
};

const gameReducer = (state: GameState, action: Action): GameState => {
    switch (action.type) {
        case 'NEW_GAME':
            return {
                ...initialState,
                highScore: state.highScore,
                soundEnabled: state.soundEnabled,
                phase: 'playing',
            };

        case 'TOGGLE_HOLD':
            if (state.phase !== 'playing' || state.rollsLeft === 3) return state;
            const newHeld = [...state.held];
            newHeld[action.index] = !newHeld[action.index];
            return { ...state, held: newHeld };

        case 'ROLL_DICE': {
            const nextRolls = state.rollsLeft - 1;
            let nextPhase: 'playing' | 'scoring' | 'idle' | 'gameOver' = 'playing';
            let nextSelectedCategory = null;

            if (nextRolls === 0) {
                // Auto-enter scoring phase if no rolls left
                nextPhase = 'scoring';
                nextSelectedCategory = getInitialSelection(action.newValues, state.scores);
            } else {
                // If user rolled (and had rolls left), ensure we are in playing phase
                nextPhase = 'playing';
            }

            return {
                ...state,
                dice: action.newValues,
                rollsLeft: nextRolls,
                phase: nextPhase,
                selectedCategory: nextSelectedCategory,
            };
        }

        case 'START_SCORING': {
            const selection = getInitialSelection(state.dice, state.scores);
            if (!selection) return state;

            return {
                ...state,
                phase: 'scoring',
                selectedCategory: selection
            };
        }

        case 'SELECT_CATEGORY':
            if (state.phase !== 'scoring' || !state.selectedCategory) return state;

            // Joker Forced Selection Check: If forced, prevent changing selection
            const jokerSelect = isJokerRoll(state.dice, state.scores);
            if (jokerSelect) {
                const dieValue = state.dice[0];
                const upperCategories = [Category.ONES, Category.TWOS, Category.THREES, Category.FOURS, Category.FIVES, Category.SIXES];
                const correspondingCat = upperCategories[dieValue - 1];
                // If the forced category is empty, the user MUST play there, so prevent moving cursor
                if (state.scores[correspondingCat] === null) {
                    return state;
                }
            }

            const currentIndex = ORDERED_CATEGORIES.indexOf(state.selectedCategory);
            let nextIndex = currentIndex;
            let loopCount = 0;

            do {
                if (action.direction === 'next') {
                    nextIndex = (nextIndex + 1) % ORDERED_CATEGORIES.length;
                } else {
                    nextIndex = (nextIndex - 1 + ORDERED_CATEGORIES.length) % ORDERED_CATEGORIES.length;
                }
                loopCount++;
            } while (state.scores[ORDERED_CATEGORIES[nextIndex]] !== null && loopCount < ORDERED_CATEGORIES.length);

            return {
                ...state,
                selectedCategory: ORDERED_CATEGORIES[nextIndex]
            };

        case 'CONFIRM_SCORE':
            if (state.phase !== 'scoring' || !state.selectedCategory) return state;

            const isJoker = isJokerRoll(state.dice, state.scores);
            const score = calculateScore(state.selectedCategory, state.dice, isJoker);
            const newScores = { ...state.scores, [state.selectedCategory]: score };

            let newYahtzeeBonus = state.yahtzeeBonus;
            // Apply Yahtzee Bonus if applicable (Joker condition met + original Yahtzee was 50)
            if (isJoker && state.scores[Category.YAHTZEE] === 50) {
                newYahtzeeBonus += 100;
            }

            const isGameFinished = Object.values(newScores).every(s => s !== null);
            const total = calculateTotalScore(newScores, newYahtzeeBonus);

            if (isGameFinished) {
                if (total > state.highScore) {
                    localStorage.setItem('yahtzee_highscore', total.toString());
                }
            }

            return {
                ...state,
                scores: newScores,
                yahtzeeBonus: newYahtzeeBonus,
                phase: isGameFinished ? 'gameOver' : 'playing',
                turn: isGameFinished ? 13 : state.turn + 1,
                rollsLeft: 3,
                held: [false, false, false, false, false],
                selectedCategory: null,
                highScore: isGameFinished && total > state.highScore ? total : state.highScore
            };

        case 'TOGGLE_SOUND':
            return { ...state, soundEnabled: !state.soundEnabled };

        default:
            return state;
    }
};

const getRandomDie = (): DieValue => (Math.floor(Math.random() * 6) + 1) as DieValue;

const App: React.FC = () => {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const [isRolling, setIsRolling] = useState(false);
    const [resetConfirm, setResetConfirm] = useState(false);
    const [soundNotification, setSoundNotification] = useState<'ON' | 'OFF' | null>(null);
    const [animatingDice, setAnimatingDice] = useState<DieValue[] | null>(null);

    useEffect(() => {
        audioService.toggleSound(state.soundEnabled);
    }, [state.soundEnabled]);

    // Clear sound notification after delay
    useEffect(() => {
        if (soundNotification) {
            const timer = setTimeout(() => setSoundNotification(null), 1200);
            return () => clearTimeout(timer);
        }
    }, [soundNotification]);

    const handleToggleSound = () => {
        const newState = !state.soundEnabled;
        dispatch({ type: 'TOGGLE_SOUND' });
        setSoundNotification(newState ? 'ON' : 'OFF');
    };

    const handleRoll = () => {
        if (state.phase === 'gameOver' || state.rollsLeft === 0) return;
        setResetConfirm(false);

        audioService.playRoll();
        setIsRolling(true);

        let iterations = 0;
        // Reduced from 12 to 10 iterations (~800ms) to match lengthened audio
        const maxIterations = 10;
        let delay = 40;

        const animateStep = () => {
            const tempDice = state.dice.map((d, i) => state.held[i] ? d : getRandomDie());
            setAnimatingDice(tempDice);

            iterations++;
            if (iterations < maxIterations) {
                delay = Math.floor(delay * 1.15);
                setTimeout(animateStep, delay);
            } else {
                const finalDice = state.dice.map((d, i) => state.held[i] ? d : getRandomDie());
                dispatch({ type: 'ROLL_DICE', newValues: finalDice });
                setAnimatingDice(null);
                setIsRolling(false);
            }
        };

        animateStep();
    };

    const handleSelect = (direction: 'next' | 'prev') => {
        setResetConfirm(false);
        if (state.phase === 'playing') {
            audioService.playSelect();
            dispatch({ type: 'START_SCORING' });
        } else if (state.phase === 'scoring') {
            audioService.playSelect();
            dispatch({ type: 'SELECT_CATEGORY', direction });
        }
    };

    const handleEnter = () => {
        setResetConfirm(false);
        if (state.phase === 'scoring') {
            audioService.playEnter();
            dispatch({ type: 'CONFIRM_SCORE' });
            if (state.turn === 13 && Object.values(state.scores).filter(s => s === null).length === 1) {
                setTimeout(() => audioService.playWin(), 500);
            }
        }
    };

    const handleNewGame = () => {
        if (state.phase === 'idle' || state.phase === 'gameOver') {
            audioService.playWin();
            dispatch({ type: 'NEW_GAME' });
            setResetConfirm(false);
        } else {
            if (resetConfirm) {
                audioService.playWin();
                dispatch({ type: 'NEW_GAME' });
                setResetConfirm(false);
            } else {
                audioService.playBeep();
                setResetConfirm(true);
            }
        }
    };

    const visualState: GameState = useMemo(() => {
        if (animatingDice) {
            return { ...state, dice: animatingDice };
        }
        return state;
    }, [state, animatingDice]);

    const isJoker = state.phase === 'scoring' ? isJokerRoll(state.dice, state.scores) : false;

    const currentPreviewScore = (state.phase === 'scoring' && state.selectedCategory)
        ? calculateScore(state.selectedCategory, state.dice, isJoker)
        : 0;

    const canRoll = !isRolling && state.phase !== 'gameOver' && state.rollsLeft > 0;

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-900 p-2 overflow-hidden touch-none">
            <div className="relative w-full max-w-md bg-gradient-to-br from-[#E6B800] to-[#B38F00] rounded-[2.5rem] p-4 shadow-2xl flex flex-col items-center select-none border-b-8 border-r-8 border-[#8a6e00] h-full md:h-auto md:aspect-[9/18] md:max-h-[95vh]">
                <div className="w-full bg-[#B71C1C] rounded-t-xl rounded-b-lg p-1.5 mb-2 shadow-md border-b-2 border-[#801313] shrink-0">
                    <div className="flex justify-center items-center h-16 mb-1 px-4">
                        <img src="/logo.png" alt="Pocket Dice Electronic Hand-Held" className="w-full h-full object-contain drop-shadow-md opacity-90 mix-blend-screen" />
                    </div>
                </div>
                <div className="w-full bg-[#8D6E03] p-2.5 rounded-xl shadow-[inset_0_4px_8px_rgba(0,0,0,0.4)] mb-2 shrink overflow-hidden">
                    <LCDScreen
                        gameState={visualState}
                        previewScore={currentPreviewScore}
                        resetConfirm={resetConfirm}
                        soundStatus={soundNotification}
                    />
                </div>
                <div className="w-full flex justify-between px-1 mb-2 shrink-0">
                    {visualState.dice.map((_, i) => (
                        <div key={i} className="flex flex-col items-center w-12 sm:w-[3.75rem]">
                            <span className="text-[#5D4037] font-bold text-sm mb-0.5 tracking-wide">HOLD</span>
                            <PhysicalButton
                                onClick={() => {
                                    if (state.phase === 'playing' && state.rollsLeft < 3) {
                                        audioService.playBeep();
                                        dispatch({ type: 'TOGGLE_HOLD', index: i });
                                    }
                                }}
                                size="sm"
                                disabled={state.phase !== 'playing' || state.rollsLeft === 3}
                                className={state.held[i] ? 'translate-y-[2px] opacity-90' : ''}
                            />
                        </div>
                    ))}
                </div>
                <div className="w-full flex-1 flex flex-col justify-evenly min-h-0 pb-2">
                    <div className="flex justify-between items-center px-2 w-full">
                        <PhysicalButton
                            label="SOUND"
                            size="sm"
                            color="yellow"
                            largeText
                            onClick={handleToggleSound}
                        />
                        <div className="flex flex-col items-center">
                            <div className="text-[#5D4037] text-[0.65rem] font-bold uppercase mb-0.5">High Score</div>
                            <div className="bg-[#8D6E03] text-black font-lcd px-2 py-0.5 rounded shadow-inner text-xl leading-none">
                                {state.highScore}
                            </div>
                        </div>
                        <PhysicalButton
                            label="NEW"
                            size="sm"
                            color="yellow"
                            largeText
                            onClick={handleNewGame}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-end justify-items-center w-full">
                        <div className="flex flex-col items-center">
                            <div className="flex gap-2">
                                <PhysicalButton
                                    label="◄"
                                    shape="circle"
                                    size="sm"
                                    color="red"
                                    largeText
                                    onClick={() => handleSelect('prev')}
                                    disabled={state.phase === 'gameOver' || (state.phase === 'playing' && state.rollsLeft === 3)}
                                />
                                <PhysicalButton
                                    label="►"
                                    shape="circle"
                                    size="sm"
                                    color="red"
                                    largeText
                                    onClick={() => handleSelect('next')}
                                    disabled={state.phase === 'gameOver' || (state.phase === 'playing' && state.rollsLeft === 3)}
                                />
                            </div>
                        </div>
                        <PhysicalButton
                            label="ENTER"
                            subLabel=""
                            shape="circle"
                            size="md"
                            onClick={handleEnter}
                            disabled={state.phase !== 'scoring'}
                        />
                        <PhysicalButton
                            label="ROLL"
                            subLabel="ON"
                            shape="pill"
                            size="md"
                            extraLargeText
                            onClick={() => {
                                if (state.phase === 'idle' || state.phase === 'gameOver') {
                                    audioService.playWin();
                                    dispatch({ type: 'NEW_GAME' });
                                } else {
                                    handleRoll();
                                }
                            }}
                            disabled={!canRoll && state.phase !== 'idle' && state.phase !== 'gameOver'}
                        />
                    </div>
                </div>
                <div className="absolute right-3 top-1/3 w-2 h-16 flex flex-col justify-between opacity-50 pointer-events-none">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-1 bg-[#8a6e00] rounded-full shadow-inner"></div>)}
                </div>
                <div className="absolute left-3 top-1/3 w-2 h-16 flex flex-col justify-between opacity-50 pointer-events-none">
                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-1 bg-[#8a6e00] rounded-full shadow-inner"></div>)}
                </div>
            </div>
        </div>
    );
};

export default App;