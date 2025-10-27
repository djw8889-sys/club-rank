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
    this.data.clubs.push(club);
    return club;
  }

  ensureDefaultMembership(userId: string) {
    if (!this.getUserClubMemberships(userId).length) {
      const defaultClub = { id: "default", members: [userId] };
      this.data.clubs.push(defaultClub);
      return defaultClub;
    }
  }

  getUserClubMemberships(userId: string) {
    return this.data.clubs.filter((club) => club.members?.includes(userId));
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
