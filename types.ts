export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;

export enum Category {
  ONES = 'ONES',
  TWOS = 'TWOS',
  THREES = 'THREES',
  FOURS = 'FOURS',
  FIVES = 'FIVES',
  SIXES = 'SIXES',
  THREE_OF_A_KIND = '3 OF A KIND',
  FOUR_OF_A_KIND = '4 OF A KIND',
  FULL_HOUSE = 'FULL HOUSE',
  SMALL_STRAIGHT = 'SM. STRAIGHT',
  LARGE_STRAIGHT = 'LG. STRAIGHT',
  CHANCE = 'CHANCE',
  YAHTZEE = 'YAHTZEE'
}

export interface ScoreSheet {
  [Category.ONES]: number | null;
  [Category.TWOS]: number | null;
  [Category.THREES]: number | null;
  [Category.FOURS]: number | null;
  [Category.FIVES]: number | null;
  [Category.SIXES]: number | null;
  [Category.THREE_OF_A_KIND]: number | null;
  [Category.FOUR_OF_A_KIND]: number | null;
  [Category.FULL_HOUSE]: number | null;
  [Category.SMALL_STRAIGHT]: number | null;
  [Category.LARGE_STRAIGHT]: number | null;
  [Category.CHANCE]: number | null;
  [Category.YAHTZEE]: number | null;
}

export interface GameState {
  dice: DieValue[];
  held: boolean[];
  rollsLeft: number;
  scores: ScoreSheet;
  selectedCategory: Category | null;
  phase: 'idle' | 'playing' | 'scoring' | 'gameOver';
  turn: number; // 1 to 13
  bonusApplied: boolean;
  soundEnabled: boolean;
  highScore: number;
  yahtzeeBonus: number; // Tracks accumulated bonus points (100 per extra Yahtzee)
}