import { Category, DieValue, ScoreSheet } from '../types';

export const INITIAL_SCORES: ScoreSheet = {
  [Category.ONES]: null,
  [Category.TWOS]: null,
  [Category.THREES]: null,
  [Category.FOURS]: null,
  [Category.FIVES]: null,
  [Category.SIXES]: null,
  [Category.THREE_OF_A_KIND]: null,
  [Category.FOUR_OF_A_KIND]: null,
  [Category.FULL_HOUSE]: null,
  [Category.SMALL_STRAIGHT]: null,
  [Category.LARGE_STRAIGHT]: null,
  [Category.CHANCE]: null,
  [Category.YAHTZEE]: null,
};

export const ORDERED_CATEGORIES = [
  Category.ONES,
  Category.TWOS,
  Category.THREES,
  Category.FOURS,
  Category.FIVES,
  Category.SIXES,
  Category.THREE_OF_A_KIND,
  Category.FOUR_OF_A_KIND,
  Category.FULL_HOUSE,
  Category.SMALL_STRAIGHT,
  Category.LARGE_STRAIGHT,
  Category.CHANCE,
  Category.YAHTZEE,
];

const sumDice = (dice: DieValue[]) => dice.reduce((a, b) => a + b, 0);

const getCounts = (dice: DieValue[]) => {
  const counts = [0, 0, 0, 0, 0, 0, 0]; // index 1-6
  dice.forEach(d => counts[d]++);
  return counts;
};

// Check if the current roll is a "Joker" (Yahtzee when Yahtzee box is already filled)
export const isJokerRoll = (dice: DieValue[], scores: ScoreSheet): boolean => {
  const counts = getCounts(dice);
  const isYahtzee = counts.some(c => c === 5);
  // Joker applies if it's a Yahtzee AND the Yahtzee category is already filled (either 50 or 0)
  return isYahtzee && scores[Category.YAHTZEE] !== null;
};

export const calculateScore = (category: Category, dice: DieValue[], isJoker: boolean = false): number => {
  const counts = getCounts(dice);
  const sum = sumDice(dice);

  // Joker Rules overrides
  if (isJoker) {
    switch (category) {
      case Category.FULL_HOUSE: return 25;
      case Category.SMALL_STRAIGHT: return 30;
      case Category.LARGE_STRAIGHT: return 40;
      case Category.CHANCE: return sum;
      case Category.THREE_OF_A_KIND: return sum;
      case Category.FOUR_OF_A_KIND: return sum;
      case Category.YAHTZEE: return 0; // Should not be selectable if filled, but just in case
      // Upper section logic remains standard (sum of specific die), handled by default case
    }
  }

  switch (category) {
    case Category.ONES: return counts[1] * 1;
    case Category.TWOS: return counts[2] * 2;
    case Category.THREES: return counts[3] * 3;
    case Category.FOURS: return counts[4] * 4;
    case Category.FIVES: return counts[5] * 5;
    case Category.SIXES: return counts[6] * 6;
    
    case Category.THREE_OF_A_KIND:
      return counts.some(c => c >= 3) ? sum : 0;
      
    case Category.FOUR_OF_A_KIND:
      return counts.some(c => c >= 4) ? sum : 0;
      
    case Category.FULL_HOUSE: {
      const hasThree = counts.some(c => c === 3);
      const hasTwo = counts.some(c => c === 2);
      const hasFive = counts.some(c => c === 5); 
      return (hasThree && hasTwo) || hasFive ? 25 : 0;
    }

    case Category.SMALL_STRAIGHT: {
      const unique = Array.from(new Set(dice)).sort((a, b) => a - b);
      let consecutive = 0;
      let maxConsecutive = 0;
      for (let i = 0; i < unique.length - 1; i++) {
        if (unique[i + 1] === unique[i] + 1) {
          consecutive++;
        } else {
          consecutive = 0;
        }
        maxConsecutive = Math.max(maxConsecutive, consecutive);
      }
      return maxConsecutive >= 3 ? 30 : 0;
    }

    case Category.LARGE_STRAIGHT: {
      const unique = Array.from(new Set(dice)).sort((a, b) => a - b);
      if (unique.length < 5) return 0;
      const isStraight = unique[4] === unique[0] + 4;
      return isStraight ? 40 : 0;
    }

    case Category.YAHTZEE:
      return counts.some(c => c === 5) ? 50 : 0;

    case Category.CHANCE:
      return sum;
      
    default:
      return 0;
  }
};

export const calculateUpperTotal = (scores: ScoreSheet): number => {
  const upper = [Category.ONES, Category.TWOS, Category.THREES, Category.FOURS, Category.FIVES, Category.SIXES];
  return upper.reduce((acc, cat) => acc + (scores[cat] || 0), 0);
};

export const calculateTotalScore = (scores: ScoreSheet, yahtzeeBonus: number = 0): number => {
  let total = 0;
  Object.values(scores).forEach(val => {
    if (val !== null) total += val;
  });
  
  // Upper Bonus calculation
  const upperTotal = calculateUpperTotal(scores);
  if (upperTotal >= 63) {
    total += 35;
  }
  
  // Yahtzee Bonus
  total += yahtzeeBonus;
  
  return total;
};