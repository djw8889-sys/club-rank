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

export interface ClubRanking {
  clubId: number;
  name: string;
  points: number;
  members: number;
}

export interface IStorage {
  createClub(club: InsertClub): Promise<Club>;
  getClubById(id: number): Promise<Club | null>;
  getUserClubs(userId: string): Promise<ClubMember[]>;
  getUserClubMemberships(userId: string): Promise<ClubMember[]>;
  getUserStatsInClub(
    clubId: number,
    userId: string,
  ): Promise<{
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    points: number;
  } | null>;
  ensureDefaultMembership(userId: string): Promise<ClubMember>;

  // 추가 메서드 (랭킹용)
  getUserRankingPoints(): Promise<UserRankingPoints[]>;
  getUserRankingPointsByFormat(): Promise<UserRankingPoints[]>;
  getClubRankingsByFormat(): Promise<ClubRanking[]>;
  getUserMatchHistory(): Promise<ClubMatch[]>;
  updateMatchResult(): Promise<void>;
  createOrUpdateUserRankingPoints(): Promise<UserRankingPoints>;
  addMatchParticipants(): Promise<MatchParticipants>;
  getMatchById(): Promise<ClubMatch | null>;
  getPartnershipStats(): Promise<any>;
}

type Id = number;

export class MemStorage implements IStorage {
  private clubs = new Map<Id, Club>();
  private clubMembers = new Map<Id, ClubMember>();
  private clubMatches = new Map<Id, ClubMatch>();
  private userRankingPoints = new Map<Id, UserRankingPoints>();
  private matchParticipants = new Map<Id, MatchParticipants>();
  private nextClubId = 1;
  private nextMemberId = 1;

  constructor() {
    this.initializeDefaultClub();
  }

  private initializeDefaultClub() {
    if (this.clubs.size > 0) return;
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
  }

  async createClub(club: InsertClub): Promise<Club> {
    const id = this.nextClubId++;
    const now = new Date();
    const created: Club = {
      id,
      name: club.name,
      region: club.region ?? "미정",
      description: club.description ?? "",
      logoUrl: club.logoUrl ?? null,
      bannerUrl: club.bannerUrl ?? null,
      primaryColor: club.primaryColor ?? "#00AEEF",
      rankingPoints: 1000,
      establishedAt: club.establishedAt ?? now,
      createdAt: now,
      updatedAt: now,
    };
    this.clubs.set(id, created);
    return created;
  }

  async getClubById(id: number): Promise<Club | null> {
    return this.clubs.get(id) ?? null;
  }

  async getUserClubs(userId: string): Promise<ClubMember[]> {
    return Array.from(this.clubMembers.values()).filter(
      (m) => m.userId === userId && m.isActive,
    );
  }

  async getUserClubMemberships(userId: string): Promise<ClubMember[]> {
    return this.getUserClubs(userId);
  }

  async getUserStatsInClub(_clubId: number, _userId: string) {
    return {
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      points: 1000,
    };
  }

  async ensureDefaultMembership(userId: string): Promise<ClubMember> {
    const existing = (await this.getUserClubs(userId))[0];
    if (existing) return existing;

    const defaultClub =
      Array.from(this.clubs.values())[0] ??
      (await this.createClub({ name: "MatchPoint 기본 클럽" }));

    const newMember: ClubMember = {
      id: this.nextMemberId++,
      userId,
      clubId: defaultClub.id,
      role: "member",
      joinedAt: new Date(),
      isActive: true,
    };
    this.clubMembers.set(newMember.id, newMember);
    return newMember;
  }

  async getUserRankingPoints(): Promise<UserRankingPoints[]> {
    return Array.from(this.userRankingPoints.values());
  }

  async getUserRankingPointsByFormat(): Promise<UserRankingPoints[]> {
    return this.getUserRankingPoints();
  }

  async getClubRankingsByFormat(): Promise<ClubRanking[]> {
    return Array.from(this.clubs.values()).map((c) => ({
      clubId: c.id,
      name: c.name,
      points: c.rankingPoints ?? 1000,
      members: Array.from(this.clubMembers.values()).filter(
        (m) => m.clubId === c.id,
      ).length,
    }));
  }

  async getUserMatchHistory(): Promise<ClubMatch[]> {
    return Array.from(this.clubMatches.values());
  }

  async updateMatchResult(): Promise<void> {
    return;
  }

  async createOrUpdateUserRankingPoints(): Promise<UserRankingPoints> {
    const dummy: UserRankingPoints = {
      id: 1,
      userId: "system-init",
      format: "singles",
      points: 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userRankingPoints.set(dummy.id, dummy);
    return dummy;
  }

  async addMatchParticipants(): Promise<MatchParticipants> {
    const dummy: MatchParticipants = {
      id: 1,
      matchId: 1,
      userId: "system-init",
      team: "A",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.matchParticipants.set(dummy.id, dummy);
    return dummy;
  }

  async getMatchById(): Promise<ClubMatch | null> {
    return Array.from(this.clubMatches.values())[0] ?? null;
  }

  async getPartnershipStats(): Promise<any> {
    return { matchesPlayed: 0, wins: 0, losses: 0 };
  }
}

export const storage = new MemStorage();
