/**
 * CP (Club Power) Rating System Calculator for Tennis Club Rankings
 * 
 * Based on standard ELO algorithm with tennis-specific adaptations:
 * - Singles matches: Direct CP calculation between two players
 * - Doubles matches: Average team CP vs Average team CP, then distribute points
 */

export interface ELOResult {
  winnerChange: number;
  loserChange: number;
  newWinnerRating: number;
  newLoserRating: number;
}

export interface TeamELOResult {
  player1Change: number;
  player2Change: number;
  newPlayer1Rating: number;
  newPlayer2Rating: number;
}

/**
 * Standard CP calculation for singles matches
 * @param winnerRating Current rating of winner
 * @param loserRating Current rating of loser
 * @param kFactor K-factor (rating volatility, default 32 for club play)
 * @returns CP changes and new ratings
 */
export function calculateSinglesELO(
  winnerRating: number, 
  loserRating: number, 
  kFactor: number = 32
): ELOResult {
  // Expected scores based on ELO difference
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));
  
  // Actual scores: 1 for winner, 0 for loser
  const winnerChange = Math.round(kFactor * (1 - expectedWinner));
  const loserChange = Math.round(kFactor * (0 - expectedLoser));
  
  return {
    winnerChange,
    loserChange,
    newWinnerRating: winnerRating + winnerChange,
    newLoserRating: loserRating + loserChange
  };
}

/**
 * CP calculation for doubles matches
 * Calculates team average CP, applies standard CP, then distributes points
 * @param winningTeam Array of [player1Rating, player2Rating] 
 * @param losingTeam Array of [player1Rating, player2Rating]
 * @param kFactor K-factor for doubles (typically lower than singles)
 * @returns Individual CP changes for all 4 players
 */
export function calculateDoublesELO(
  winningTeam: [number, number],
  losingTeam: [number, number],
  kFactor: number = 24
): { 
  winningTeam: TeamELOResult; 
  losingTeam: TeamELOResult; 
} {
  const [winPlayer1, winPlayer2] = winningTeam;
  const [losePlayer1, losePlayer2] = losingTeam;
  
  // Calculate team average ratings
  const winningAvg = (winPlayer1 + winPlayer2) / 2;
  const losingAvg = (losePlayer1 + losePlayer2) / 2;
  
  // Apply standard ELO calculation to team averages
  const teamELO = calculateSinglesELO(winningAvg, losingAvg, kFactor);
  
  // Distribute points based on individual contribution to team strength
  // Higher-rated players get slightly more points when winning, lose more when losing
  const winPlayer1Share = winPlayer1 / (winPlayer1 + winPlayer2);
  const winPlayer2Share = winPlayer2 / (winPlayer1 + winPlayer2);
  const losePlayer1Share = losePlayer1 / (losePlayer1 + losePlayer2);
  const losePlayer2Share = losePlayer2 / (losePlayer1 + losePlayer2);
  
  // Calculate individual changes (ensure integers)
  const winPlayer1Change = Math.round(teamELO.winnerChange * winPlayer1Share);
  const winPlayer2Change = Math.round(teamELO.winnerChange * winPlayer2Share);
  const losePlayer1Change = Math.round(teamELO.loserChange * losePlayer1Share);
  const losePlayer2Change = Math.round(teamELO.loserChange * losePlayer2Share);
  
  return {
    winningTeam: {
      player1Change: winPlayer1Change,
      player2Change: winPlayer2Change,
      newPlayer1Rating: winPlayer1 + winPlayer1Change,
      newPlayer2Rating: winPlayer2 + winPlayer2Change
    },
    losingTeam: {
      player1Change: losePlayer1Change,
      player2Change: losePlayer2Change,
      newPlayer1Rating: losePlayer1 + losePlayer1Change,
      newPlayer2Rating: losePlayer2 + losePlayer2Change
    }
  };
}

/**
 * Calculate ELO changes for a match based on game format
 * @param gameFormat Type of tennis match
 * @param winnerRatings Array of winner ratings [player1, player2?]
 * @param loserRatings Array of loser ratings [player1, player2?] 
 * @param kFactor Optional K-factor override
 * @returns ELO changes for all participants
 */
export function calculateMatchELO(
  gameFormat: 'mens_singles' | 'womens_singles' | 'mens_doubles' | 'womens_doubles' | 'mixed_doubles',
  winnerRatings: number[],
  loserRatings: number[],
  kFactor?: number
): {
  winners: number[];
  losers: number[];
  winnerChanges: number[];
  loserChanges: number[];
} {
  const isSingles = gameFormat.includes('singles');
  
  if (isSingles) {
    if (winnerRatings.length !== 1 || loserRatings.length !== 1) {
      throw new Error('Singles matches require exactly 1 player per side');
    }
    
    const result = calculateSinglesELO(winnerRatings[0], loserRatings[0], kFactor);
    return {
      winners: [result.newWinnerRating],
      losers: [result.newLoserRating],
      winnerChanges: [result.winnerChange],
      loserChanges: [result.loserChange]
    };
  } else {
    if (winnerRatings.length !== 2 || loserRatings.length !== 2) {
      throw new Error('Doubles matches require exactly 2 players per side');
    }
    
    const result = calculateDoublesELO(
      [winnerRatings[0], winnerRatings[1]], 
      [loserRatings[0], loserRatings[1]], 
      kFactor
    );
    
    return {
      winners: [result.winningTeam.newPlayer1Rating, result.winningTeam.newPlayer2Rating],
      losers: [result.losingTeam.newPlayer1Rating, result.losingTeam.newPlayer2Rating],
      winnerChanges: [result.winningTeam.player1Change, result.winningTeam.player2Change],
      loserChanges: [result.losingTeam.player1Change, result.losingTeam.player2Change]
    };
  }
}

/**
 * Get recommended K-factor based on player experience
 * @param gamesPlayed Number of games played by player
 * @returns Appropriate K-factor
 */
export function getKFactor(gamesPlayed: number): number {
  if (gamesPlayed < 10) return 40; // New players - higher volatility
  if (gamesPlayed < 30) return 32; // Regular players
  return 24; // Experienced players - lower volatility
}

/**
 * Calculate expected win probability based on ELO difference
 * @param playerRating Player's current rating
 * @param opponentRating Opponent's current rating
 * @returns Win probability (0.0 to 1.0)
 */
export function getWinProbability(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}