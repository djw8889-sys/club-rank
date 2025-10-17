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
  // Club operations
  createClub(club: InsertClub): Promise<Club>;
  getClubById(id: number): Promise<Club | null>;
  getClubsByRegion(region: string): Promise<Club[]>;
  updateClub(id: number, updates: Partial<InsertClub>): Promise<Club>;
  deleteClub(id: number): Promise<void>;
  
  // Club member operations  
  addClubMember(member: InsertClubMember): Promise<ClubMember>;
  getClubMembers(clubId: number): Promise<ClubMember[]>;
  getUserClubs(userId: string): Promise<ClubMember[]>;
  getMemberById(memberId: number): Promise<ClubMember | null>;
  updateMemberRole(memberId: number, role: 'owner' | 'admin' | 'member'): Promise<ClubMember>;
  removeClubMember(memberId: number): Promise<void>;
  getUserClubMembership(userId: string, clubId: number): Promise<ClubMember | null>;
  
  // Club match operations
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
  
  // User Ranking Points operations
  getUserRankingPoints(userId: string, clubId: number): Promise<UserRankingPoints[]>;
  getUserRankingPointsByFormat(userId: string, clubId: number, gameFormat: string): Promise<UserRankingPoints | null>;
  createOrUpdateUserRankingPoints(data: InsertUserRankingPoints): Promise<UserRankingPoints>;
  getClubRankingsByFormat(clubId: number, gameFormat: string): Promise<UserRankingPoints[]>;
  
  // Match Participants operations  
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

  // Club operations
  async createClub(club: InsertClub): Promise<Club> {
    const newClub: Club = {
      id: this.nextClubId++,
      name: club.name,
      logoUrl: club.logoUrl || null,
      bannerUrl: club.bannerUrl || null,
      description: club.description || null,
      primaryColor: club.primaryColor || '#22c55e',
      rankingPoints: club.rankingPoints || 1000,
      region: club.region,
      establishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.clubs.set(newClub.id, newClub);
    return newClub;
  }

  async getClubById(id: number): Promise<Club | null> {
    return this.clubs.get(id) || null;
  }

  async getClubsByRegion(region: string): Promise<Club[]> {
    return Array.from(this.clubs.values()).filter(club => club.region === region);
  }

  async updateClub(id: number, updates: Partial<InsertClub>): Promise<Club> {
    const club = this.clubs.get(id);
    if (!club) throw new Error('Club not found');
    
    const updatedClub = { ...club, ...updates, updatedAt: new Date() };
    this.clubs.set(id, updatedClub);
    return updatedClub;
  }

  async deleteClub(id: number): Promise<void> {
    this.clubs.delete(id);
  }

  // Club member operations
  async addClubMember(member: InsertClubMember): Promise<ClubMember> {
    const newMember: ClubMember = {
      id: this.nextMemberId++,
      ...member,
      role: member.role || 'member',
      isActive: member.isActive ?? true,
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.clubMembers.set(newMember.id, newMember);
    return newMember;
  }

  async getClubMembers(clubId: number): Promise<ClubMember[]> {
    return Array.from(this.clubMembers.values())
      .filter(member => member.clubId === clubId && member.isActive);
  }

  async getUserClubs(userId: string): Promise<ClubMember[]> {
    return Array.from(this.clubMembers.values())
      .filter(member => member.userId === userId && member.isActive);
  }

  async updateMemberRole(memberId: number, role: 'owner' | 'admin' | 'member'): Promise<ClubMember> {
    const member = this.clubMembers.get(memberId);
    if (!member) throw new Error('Member not found');
    
    const updatedMember = { ...member, role, updatedAt: new Date() };
    this.clubMembers.set(memberId, updatedMember);
    return updatedMember;
  }

  async removeClubMember(memberId: number): Promise<void> {
    const member = this.clubMembers.get(memberId);
    if (member) {
      const updatedMember = { ...member, isActive: false, updatedAt: new Date() };
      this.clubMembers.set(memberId, updatedMember);
    }
  }

  async getUserClubMembership(userId: string, clubId: number): Promise<ClubMember | null> {
    return Array.from(this.clubMembers.values())
      .find(member => member.userId === userId && member.clubId === clubId && member.isActive) || null;
  }

  async getMemberById(memberId: number): Promise<ClubMember | null> {
    return this.clubMembers.get(memberId) || null;
  }

  // Club match operations
  async createClubMatch(match: InsertClubMatch): Promise<ClubMatch> {
    const newMatch: ClubMatch = {
      id: this.nextMatchId++,
      requestingClubId: match.requestingClubId,
      receivingClubId: match.receivingClubId,
      status: match.status || 'pending',
      matchDate: match.matchDate || null,
      matchLocation: match.matchLocation || null,
      matchType: match.matchType || 'friendly',
      gameFormat: match.gameFormat || 'mens_doubles',
      result: match.result || null,
      requestingScore: match.requestingScore || 0,
      receivingScore: match.receivingScore || 0,
      eloChange: match.eloChange || 0,
      requestingTeamPlayer1: match.requestingTeamPlayer1 || null,
      requestingTeamPlayer2: match.requestingTeamPlayer2 || null,
      receivingTeamPlayer1: match.receivingTeamPlayer1 || null,
      receivingTeamPlayer2: match.receivingTeamPlayer2 || null,
      notes: match.notes || null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.clubMatches.set(newMatch.id, newMatch);
    return newMatch;
  }

  async getClubMatches(clubId: number): Promise<ClubMatch[]> {
    return Array.from(this.clubMatches.values())
      .filter(match => match.requestingClubId === clubId || match.receivingClubId === clubId);
  }

  async getMatchById(matchId: number): Promise<ClubMatch | null> {
    return this.clubMatches.get(matchId) || null;
  }

  async updateMatchStatus(matchId: number, status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'): Promise<ClubMatch> {
    const match = this.clubMatches.get(matchId);
    if (!match) throw new Error('Match not found');
    
    const updatedMatch = { 
      ...match, 
      status, 
      updatedAt: new Date(),
      completedAt: status === 'completed' ? new Date() : match.completedAt
    };
    this.clubMatches.set(matchId, updatedMatch);
    return updatedMatch;
  }

  async updateMatchResult(matchId: number, resultData: {
    result: 'requesting_won' | 'receiving_won' | 'draw',
    requestingScore: number,
    receivingScore: number,
    eloChange: number
  }): Promise<ClubMatch> {
    const match = this.clubMatches.get(matchId);
    if (!match) throw new Error('Match not found');
    
    const updatedMatch = { 
      ...match, 
      ...resultData,
      status: 'completed' as const,
      completedAt: new Date(),
      updatedAt: new Date()
    };
    this.clubMatches.set(matchId, updatedMatch);
    return updatedMatch;
  }

  // User Ranking Points operations
  async getUserRankingPoints(userId: string, clubId: number): Promise<UserRankingPoints[]> {
    return Array.from(this.userRankingPoints.values())
      .filter(urp => urp.userId === userId && urp.clubId === clubId);
  }

  async getUserRankingPointsByFormat(userId: string, clubId: number, gameFormat: string): Promise<UserRankingPoints | null> {
    return Array.from(this.userRankingPoints.values())
      .find(urp => urp.userId === userId && urp.clubId === clubId && urp.gameFormat === gameFormat) || null;
  }

  async createOrUpdateUserRankingPoints(data: InsertUserRankingPoints): Promise<UserRankingPoints> {
    const existing = await this.getUserRankingPointsByFormat(data.userId, data.clubId, data.gameFormat);
    
    if (existing) {
      const updated = {
        ...existing,
        rankingPoints: data.rankingPoints ?? existing.rankingPoints,
        wins: data.wins ?? existing.wins,
        losses: data.losses ?? existing.losses,
        draws: data.draws ?? existing.draws,
        updatedAt: new Date()
      };
      this.userRankingPoints.set(existing.id, updated);
      return updated;
    } else {
      const newRankingPoints: UserRankingPoints = {
        id: this.nextRankingId++,
        userId: data.userId,
        clubId: data.clubId,
        gameFormat: data.gameFormat,
        rankingPoints: data.rankingPoints ?? 1200,
        wins: data.wins ?? 0,
        losses: data.losses ?? 0,
        draws: data.draws ?? 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.userRankingPoints.set(newRankingPoints.id, newRankingPoints);
      return newRankingPoints;
    }
  }

  async getClubRankingsByFormat(clubId: number, gameFormat: string): Promise<UserRankingPoints[]> {
    return Array.from(this.userRankingPoints.values())
      .filter(urp => urp.clubId === clubId && urp.gameFormat === gameFormat)
      .sort((a, b) => (b.rankingPoints || 1200) - (a.rankingPoints || 1200));
  }

  // Match Participants operations
  async addMatchParticipants(participants: InsertMatchParticipants[]): Promise<MatchParticipants[]> {
    const result: MatchParticipants[] = [];
    
    for (const participant of participants) {
      const newParticipant: MatchParticipants = {
        id: this.nextParticipantId++,
        matchId: participant.matchId,
        userId: participant.userId,
        team: participant.team,
        partnerId: participant.partnerId || null,
        rpBefore: participant.rpBefore,
        rpAfter: participant.rpAfter,
        rpChange: participant.rpChange,
        createdAt: new Date()
      };
      this.matchParticipants.set(newParticipant.id, newParticipant);
      result.push(newParticipant);
    }
    
    return result;
  }

  async getMatchParticipants(matchId: number): Promise<MatchParticipants[]> {
    return Array.from(this.matchParticipants.values())
      .filter(mp => mp.matchId === matchId);
  }

  async getUserMatchHistory(userId: string, clubId?: number): Promise<MatchParticipants[]> {
    const userParticipants = Array.from(this.matchParticipants.values())
      .filter(mp => mp.userId === userId);
    
    if (!clubId) return userParticipants;
    
    // 클럽 ID로 필터링하려면 매치 정보를 확인해야 함
    const filteredParticipants: MatchParticipants[] = [];
    for (const participant of userParticipants) {
      const match = this.clubMatches.get(participant.matchId);
      if (match && (match.requestingClubId === clubId || match.receivingClubId === clubId)) {
        filteredParticipants.push(participant);
      }
    }
    
    return filteredParticipants.sort((a, b) => 
      new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime()
    );
  }

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
      if (!participation.partnerId) continue; // 단식은 제외
      
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
}

export const storage = new MemStorage();
// ✅ 클럽 내 사용자 통계 계산
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

    if (match.result === "draw") draws++;
    else if (
      (m.team === "requesting" && match.result === "requesting_won") ||
      (m.team === "receiving" && match.result === "receiving_won")
    ) wins++;
    else losses++;
  }

  const total = wins + losses + draws;
  const winRate = total > 0 ? (wins / total) * 100 : 0;
  const points = 1000 + wins * 10 - losses * 5;

  return {
    matchesPlayed: total,
    wins,
    losses,
    draws,
    winRate,
    points,
  };
}
