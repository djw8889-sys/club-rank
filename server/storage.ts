import { 
  Club, 
  ClubMember, 
  ClubMatch,
  UserRankingPoints,
  MatchParticipants,
  InsertClub, 
  InsertClubMember, 
  InsertClubMatch,
  InsertUserRankingPoints,
  InsertMatchParticipants
} from '@shared/schema';

// Storage interface for club management
export interface IStorage {
  createClub(club: InsertClub): Promise<Club>;
  getClubById(id: number): Promise<Club | null>;
  getClubsByRegion(region: string): Promise<Club[]>;
  updateClub(id: number, updates: Partial<InsertClub>): Promise<Club>;
  deleteClub(id: number): Promise<void>;

  addClubMember(member: InsertClubMember): Promise<ClubMember>;
  getClubMembers(clubId: number): Promise<ClubMember[]>;
  getUserClubs(userId: string): Promise<ClubMember[]>;
  getMemberById(memberId: number): Promise<ClubMember | null>;
  updateMemberRole(memberId: number, role: 'owner' | 'admin' | 'member'): Promise<ClubMember>;
  removeClubMember(memberId: number): Promise<void>;
  getUserClubMembership(userId: string, clubId: number): Promise<ClubMember | null>;

  createClubMatch(match: InsertClubMatch): Promise<ClubMatch>;
  getClubMatches(clubId: number): Promise<ClubMatch[]>;
  getMatchById(matchId: number): Promise<ClubMatch | null>;
  updateMatchStatus(matchId: number, status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'): Promise<ClubMatch>;
  updateMatchResult(matchId: number, result: {
    result: 'requesting_won' | 'receiving_won' | 'draw',
    requestingScore: number,
    receivingScore: number,
    eloChange: number
  }): Promise<ClubMatch>;

  getUserRankingPoints(userId: string, clubId: number): Promise<UserRankingPoints[]>;
  getUserRankingPointsByFormat(userId: string, clubId: number, gameFormat: string): Promise<UserRankingPoints | null>;
  createOrUpdateUserRankingPoints(data: InsertUserRankingPoints): Promise<UserRankingPoints>;
  getClubRankingsByFormat(clubId: number, gameFormat: string): Promise<UserRankingPoints[]>;

  addMatchParticipants(participants: InsertMatchParticipants[]): Promise<MatchParticipants[]>;
  getMatchParticipants(matchId: number): Promise<MatchParticipants[]>;
  getUserMatchHistory(userId: string, clubId?: number): Promise<MatchParticipants[]>;
  getPartnershipStats(userId: string, clubId: number): Promise<{
    partnerId: string;
    wins: number;
    losses: number;
    draws: number;
    gamesPlayed: number;
    winRate: number;
  }[]>;

  // ✅ 추가
  getUserStatsInClub(userId: string, clubId: number): Promise<{
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    points: number;
  } | null>;
}

// In-memory storage implementation for development
export class MemStorage implements IStorage {
  private clubs: Map<number, Club> = new Map();
  private clubMembers: Map<number, ClubMember> = new Map();
  private clubMatches: Map<number, ClubMatch> = new Map();
  private userRankingPoints: Map<number, UserRankingPoints> = new Map();
  private matchParticipants: Map<number, MatchParticipants> = new Map();
  private nextClubId = 1;
  private nextMemberId = 1;
  private nextMatchId = 1;
  private nextRankingId = 1;
  private nextParticipantId = 1;

  // Club operations ...
  // (중략 - 기존 코드 그대로 유지)

  async getPartnershipStats(userId: string, clubId: number): Promise<{
    partnerId: string;
    wins: number;
    losses: number;  
    draws: number;
    gamesPlayed: number;
    winRate: number;
  }[]> {
    const userHistory = await this.getUserMatchHistory(userId, clubId);
    const partnerStats = new Map<string, { wins: number; losses: number; draws: number; }>();

    for (const participation of userHistory) {
      if (!participation.partnerId) continue;

      const partnerId = participation.partnerId;
      if (!partnerStats.has(partnerId)) {
        partnerStats.set(partnerId, { wins: 0, losses: 0, draws: 0 });
      }

      const stats = partnerStats.get(partnerId)!;
      const match = this.clubMatches.get(participation.matchId);

      if (match && match.result) {
        const isUserWin = (
          (participation.team === 'requesting' && match.result === 'requesting_won') ||
          (participation.team === 'receiving' && match.result === 'receiving_won')
        );

        if (match.result === 'draw') {
          stats.draws++;
        } else if (isUserWin) {
          stats.wins++;
        } else {
          stats.losses++;
        }
      }
    }

    return Array.from(partnerStats.entries()).map(([partnerId, stats]) => {
      const gamesPlayed = stats.wins + stats.losses + stats.draws;
      return {
        partnerId,
        wins: stats.wins,
        losses: stats.losses,
        draws: stats.draws,
        gamesPlayed,
        winRate: gamesPlayed > 0 ? (stats.wins / gamesPlayed) * 100 : 0
      };
    }).sort((a, b) => b.winRate - a.winRate);
  }

  // ✅ 추가된 함수 (이 부분만 새로 들어갑니다)
  async getUserStatsInClub(userId: string, clubId: number): Promise<{
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    points: number;
  } | null> {
    const userMatches = await this.getUserMatchHistory(userId, clubId);
    if (!userMatches.length) return null;

    let wins = 0;
    let losses = 0;
    let draws = 0;

    for (const m of userMatches) {
      const match = await this.getMatchById(m.matchId);
      if (!match || !match.result) continue;

      if (match.result === 'draw') draws++;
      else if (
        (m.team === 'requesting' && match.result === 'requesting_won') ||
        (m.team === 'receiving' && match.result === 'receiving_won')
      )
        wins++;
      else losses++;
    }

    const total = wins + losses + draws;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const points = 1000 + wins * 10 - losses * 5;

    return { matchesPlayed: total, wins, losses, draws, winRate, points };
  }
}

export const storage = new MemStorage();
