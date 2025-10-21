// server/storage.ts
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
  // 추가: 사용자에게 기본 클럽 멤버십 보장
  ensureDefaultMembership(userId: string): Promise<ClubMember>;
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

    // 참고: 여기서는 사용자 uid를 알 수 없으므로 “system-init”만 등록.
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
    const list = Array.from(this.clubMembers.values()).filter(
      (m) => m.userId === userId && m.isActive,
    );
    return list;
  }

  async getUserClubMemberships(userId: string): Promise<ClubMember[]> {
    const memberships = await this.getUserClubs(userId);
    return memberships;
  }

  async getUserStatsInClub(_clubId: number, _userId: string) {
    // 데모용 기본값
    return {
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      points: 1000,
    };
  }

  // 🔥 핵심: 로그인 사용자가 멤버십이 없으면 기본 클럽에 자동 가입
  async ensureDefaultMembership(userId: string): Promise<ClubMember> {
    const existing = (await this.getUserClubs(userId))[0];
    if (existing) return existing;

    // 기본 클럽이 없을 리 없지만, 안전하게 보장
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
}

export const storage = new MemStorage();
