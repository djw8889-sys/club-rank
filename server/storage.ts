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
  getUserClubs(userId: string): Promise<ClubMember[]>;
  getUserClubMemberships(userId: string): Promise<ClubMember[]>;
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
}

export class MemStorage implements IStorage {
  private clubs: Map<number, Club> = new Map();
  private clubMembers: Map<number, ClubMember> = new Map();
  private clubMatches: Map<number, ClubMatch> = new Map();
  private userRankingPoints: Map<number, UserRankingPoints> = new Map();
  private matchParticipants: Map<number, MatchParticipants> = new Map();
  private nextClubId = 1;
  private nextMemberId = 1;

  constructor() {
    // ✅ 서버 시작 시 기본 클럽 자동 생성
    this.initializeDefaultClub();
  }

  private async initializeDefaultClub() {
    if (this.clubs.size === 0) {
      const defaultClub: Club = {
        id: this.nextClubId++,
        name: "MatchPoint 기본 클럽",
        region: "서울특별시",
        description: "Railway 기본 클럽 (자동 생성됨)",
        logoUrl: null,
        bannerUrl: null,
        primaryColor: "#00AEEF",
        rankingPoints: 1000,
        establishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.clubs.set(defaultClub.id, defaultClub);

      const defaultMember: ClubMember = {
        id: this.nextMemberId++,
        userId: "system-init",
        clubId: defaultClub.id,
        role: "owner",
        joinedAt: new Date(),
        isActive: true,
      };
      this.clubMembers.set(defaultMember.id, defaultMember);
      console.log("🟢 [Storage] 기본 클럽 자동 생성 완료:", defaultClub.name);
    }
  }

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
    const userMatches: MatchParticipants[] = [];
    if (!userMatches.length) return null;
    return {
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      points: 1000,
    };
  }
}

export const storage = new MemStorage();
