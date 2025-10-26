// ✅ @shared/schema 제거된 안전 버전
export interface Club {
  id: number;
  name: string;
  region: string;
  description: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string;
  rankingPoints?: number;
  establishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClubMember {
  id: number;
  userId: string;
  clubId: number;
  role: "member" | "owner";
  joinedAt: Date;
  isActive: boolean;
}

export interface ClubMatch {
  id: number;
  date: Date;
  clubId: number;
  format: string;
  result?: string;
}

export interface UserRankingPoints {
  id: number;
  userId: string;
  format: string;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchParticipants {
  id: number;
  matchId: number;
  userId: string;
  team: "A" | "B";
  createdAt: Date;
  updatedAt: Date;
}

export interface ClubRanking {
  clubId: number;
  name: string;
  points: number;
  members: number;
}

export class MemStorage {
  private clubs = new Map<number, Club>();
  private clubMembers = new Map<number, ClubMember>();
  private userRankingPoints = new Map<number, UserRankingPoints>();

  constructor() {
    const defaultClub: Club = {
      id: 1,
      name: "Default Club",
      region: "Seoul",
      description: "Auto created default club",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.clubs.set(1, defaultClub);
  }

  async getClubById(id: number) {
    return this.clubs.get(id) ?? null;
  }

  async getClubRankingsByFormat(): Promise<ClubRanking[]> {
    return Array.from(this.clubs.values()).map((club) => ({
      clubId: club.id,
      name: club.name,
      points: club.rankingPoints ?? 1000,
      members: 1,
    }));
  }

  async getUserRankingPoints(): Promise<UserRankingPoints[]> {
    return Array.from(this.userRankingPoints.values());
  }

  async getUserRankingPointsByFormat(): Promise<UserRankingPoints[]> {
    return this.getUserRankingPoints();
  }

  async createOrUpdateUserRankingPoints(): Promise<UserRankingPoints> {
    const entry: UserRankingPoints = {
      id: 1,
      userId: "system",
      format: "singles",
      points: 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userRankingPoints.set(1, entry);
    return entry;
  }
}

export const storage = new MemStorage();
