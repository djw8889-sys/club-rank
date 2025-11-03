// server/storage.ts
export class MemStorage {
  private data: Record<string, any[]> = {
    users: [],
    clubs: [],
    matches: [],
    rankings: [],
  };

  // ----- Club 관련 -----
  getClubById(id: string | number) {
    return this.data.clubs.find((club) => club.id === id);
  }

  createClub(club: any) {
    const newClub = { ...club, members: club.members || [] };
    this.data.clubs.push(newClub);
    return newClub;
  }

  ensureDefaultMembership(userId: string) {
    const userClubs = this.getUserClubMemberships(userId);
    if (userClubs.length === 0) {
      const defaultClub = {
        id: `default-${userId}`,
        name: "기본 클럽",
        description: "처음 생성된 기본 클럽입니다.",
        members: [userId],
      };
      this.data.clubs.push(defaultClub);
      return defaultClub;
    }
    return userClubs[0].club;
  }

  /**
   * ✅ 내 클럽 멤버십 목록 조회
   * - 각 멤버십에 club 데이터 포함
   */
  getUserClubMemberships(userId: string) {
    const memberships = this.data.clubs
      .filter((club) => club.members?.includes(userId))
      .map((club) => ({
        membership: {
          clubId: club.id,
          userId,
          isActive: true,
        },
        club, // ✅ club 필드 포함
      }));

    return memberships;
  }

  // ----- Ranking 관련 -----
  getUserRankingPoints(userId: string, clubId?: string | number) {
    return this.data.rankings.filter(
      (r) => r.userId === userId && (!clubId || r.clubId === clubId),
    );
  }

  getUserRankingPointsByFormat(
    userId: string,
    clubId: string | number,
    format: string,
  ) {
    return this.data.rankings.find(
      (r) => r.userId === userId && r.format === format && r.clubId === clubId,
    );
  }

  getClubRankingsByFormat(clubId: string | number, format: string) {
    return this.data.rankings.filter(
      (r) => r.format === format && r.clubId === clubId,
    );
  }

  createOrUpdateUserRankingPoints(data: any) {
    const existing = this.data.rankings.find(
      (r) =>
        r.userId === data.userId &&
        r.clubId === data.clubId &&
        r.gameFormat === data.gameFormat,
    );

    if (existing) {
      Object.assign(existing, data);
    } else {
      this.data.rankings.push(data);
    }
  }

  // ----- Match 관련 -----
  getUserMatchHistory(userId: string, clubId?: string | number) {
    return this.data.matches.filter(
      (m) =>
        (m.player1 === userId || m.player2 === userId) &&
        (!clubId || m.clubId === clubId),
    );
  }

  updateMatchResult(matchId: string | number, result: any) {
    const match = this.data.matches.find((m) => m.id === matchId);
    if (match) Object.assign(match, result);
    return match;
  }

  getMatchById(matchId: string | number) {
    return this.data.matches.find((m) => m.id === matchId);
  }

  getPartnershipStats(userId: string, clubId?: string | number) {
    return this.data.matches.filter(
      (m) =>
        (m.player1 === userId || m.player2 === userId) &&
        (!clubId || m.clubId === clubId),
    );
  }

  addMatchParticipants(participants: any[]) {
    this.data.matches.push(...participants);
  }
}

// ✅ Export 이름 통일
export const storage = new MemStorage();
