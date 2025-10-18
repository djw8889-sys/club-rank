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
  InsertMatchParticipants,
} from "@shared/schema";

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
  updateMemberRole(
    memberId: number,
    role: "owner" | "admin" | "member",
  ): Promise<ClubMember>;
  removeClubMember(memberId: number): Promise<void>;
  getUserClubMembership(
    userId: string,
    clubId: number,
  ): Promise<ClubMember | null>;

  createClubMatch(match: InsertClubMatch): Promise<ClubMatch>;
  getClubMatches(clubId: number): Promise<ClubMatch[]>;
  getMatchById(matchId: number): Promise<ClubMatch | null>;
  updateMatchStatus(
    matchId: number,
    status: "pending" | "accepted" | "rejected" | "completed" | "cancelled",
  ): Promise<ClubMatch>;
  updateMatchResult(
    matchId: number,
    result: {
      result: "requesting_won" | "receiving_won" | "draw";
      requestingScore: number;
      receivingScore: number;
      eloChange: number;
    },
  ): Promise<ClubMatch>;

  getUserRankingPoints(
    userId: string,
    clubId: number,
  ): Promise<UserRankingPoints[]>;
  getUserRankingPointsByFormat(
    userId: string,
    clubId: number,
    gameFormat: string,
  ): Promise<UserRankingPoints | null>;
  createOrUpdateUserRankingPoints(
    data: InsertUserRankingPoints,
  ): Promise<UserRankingPoints>;
  getClubRankingsByFormat(
    clubId: number,
    gameFormat: string,
  ): Promise<UserRankingPoints[]>;

  addMatchParticipants(
    participants: InsertMatchParticipants[],
  ): Promise<MatchParticipants[]>;
  getMatchParticipants(matchId: number): Promise<MatchParticipants[]>;
  getUserMatchHistory(
    userId: string,
    clubId?: number,
  ): Promise<MatchParticipants[]>;
  getPartnershipStats(
    userId: string,
    clubId: number,
  ): Promise<
    {
      partnerId: string;
      wins: number;
      losses: number;
      draws: number;
      gamesPlayed: number;
      winRate: number;
    }[]
  >;

  getUserStatsInClub(
    userId: string,
    clubId: number,
  ): Promise<{
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    points: number;
  } | null>;

  getUserClubMemberships(userId: string): Promise<ClubMember[]>;
}

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

  // ✅ 클럽 생성
  async createClub({
    name,
    region,
    ownerId,
  }: {
    name: string;
    region: string;
    ownerId: string;
  }): Promise<Club> {
    try {
      console.log("🏗️ [Storage] Creating club:", name, region, ownerId);
      if (!name || !region) throw new Error("클럽 이름과 지역은 필수입니다.");

      const id = this.nextClubId++;
      const newClub: Club = {
        id,
        name,
        region,
        description: "",
        logoUrl: null,
        bannerUrl: null,
        primaryColor: "#00AEEF",
        rankingPoints: 1000,
        establishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.clubs.set(id, newClub);

      const newMember: ClubMember = {
        id: this.nextMemberId++,
        userId: ownerId,
        clubId: id,
        role: "owner",
        joinedAt: new Date(),
        isActive: true,
      };
      this.clubMembers.set(newMember.id, newMember);

      console.log("✅ [Storage] Club created successfully:", newClub.name);
      return newClub;
    } catch (error: any) {
      console.error("🔥 [Storage] Error creating club:", error.message);
      throw error;
    }
  }

  // ✅ 클럽 ID로 클럽 정보 조회
  async getClubById(id: number): Promise<Club | null> {
    try {
      const club = this.clubs.get(id);
      if (!club) {
        console.warn(`⚠️ [Storage] Club not found for id: ${id}`);
        return null;
      }
      return club;
    } catch (error: any) {
      console.error("🔥 [Storage] Error in getClubById:", error.message);
      throw new Error("클럽 데이터를 불러오는 중 오류가 발생했습니다.");
    }
  }

  // ✅ 유저가 속한 클럽 목록 조회
  async getUserClubs(userId: string): Promise<ClubMember[]> {
    return Array.from(this.clubMembers.values()).filter(
      (m) => m.userId === userId,
    );
  }

  // ✅ my-membership용 함수
  async getUserClubMemberships(userId: string): Promise<ClubMember[]> {
    try {
      console.log("📦 [Storage] Fetching user club memberships for:", userId);
      const memberships = await this.getUserClubs(userId);
      if (!memberships || memberships.length === 0) {
        console.warn("⚠️ No club memberships found for user:", userId);
        return [];
      }
      console.log("✅ [Storage] Loaded club memberships:", memberships.length);
      return memberships;
    } catch (error: any) {
      console.error(
        "🔥 [Storage] Error in getUserClubMemberships:",
        error.message,
      );
      throw new Error("클럽 데이터를 불러오는 중 오류가 발생했습니다.");
    }
  }

  // ✅ 파트너십 통계
  async getPartnershipStats(
    userId: string,
    clubId: number,
  ): Promise<
    {
      partnerId: string;
      wins: number;
      losses: number;
      draws: number;
      gamesPlayed: number;
      winRate: number;
    }[]
  > {
    const userHistory = await this.getUserMatchHistory(userId, clubId);
    const partnerStats = new Map<
      string,
      { wins: number; losses: number; draws: number }
    >();

    for (const participation of userHistory) {
      if (!participation.partnerId) continue;
      const partnerId = participation.partnerId;
      if (!partnerStats.has(partnerId))
        partnerStats.set(partnerId, { wins: 0, losses: 0, draws: 0 });
      const stats = partnerStats.get(partnerId)!;
      const match = this.clubMatches.get(participation.matchId);
      if (match && match.result) {
        const isUserWin =
          (participation.team === "requesting" &&
            match.result === "requesting_won") ||
          (participation.team === "receiving" &&
            match.result === "receiving_won");
        if (match.result === "draw") stats.draws++;
        else if (isUserWin) stats.wins++;
        else stats.losses++;
      }
    }

    return Array.from(partnerStats.entries())
      .map(([partnerId, stats]) => {
        const gamesPlayed = stats.wins + stats.losses + stats.draws;
        return {
          partnerId,
          wins: stats.wins,
          losses: stats.losses,
          draws: stats.draws,
          gamesPlayed,
          winRate: gamesPlayed > 0 ? (stats.wins / gamesPlayed) * 100 : 0,
        };
      })
      .sort((a, b) => b.winRate - a.winRate);
  }

  // ✅ 유저별 통계
  async getUserStatsInClub(
    userId: string,
    clubId: number,
  ): Promise<{
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    points: number;
  } | null> {
    const userMatches = await this.getUserMatchHistory(userId, clubId);
    if (!userMatches.length) return null;
    let wins = 0,
      losses = 0,
      draws = 0;
    for (const m of userMatches) {
      const match = await this.getMatchById(m.matchId);
      if (!match || !match.result) continue;
      if (match.result === "draw") draws++;
      else if (
        (m.team === "requesting" && match.result === "requesting_won") ||
        (m.team === "receiving" && match.result === "receiving_won")
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
