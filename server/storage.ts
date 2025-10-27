export class MemStorage {
  private data: Record<string, any[]> = {
    users: [],
    clubs: [],
    matches: [],
    rankings: [],
  };

  // ✅ club 관련
  getClubById(id: string) {
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

  // ✅ rankings 관련
  getUserRankingPoints(userId: string) {
    return this.data.rankings.find((r) => r.userId === userId);
  }

  getUserRankingPointsByFormat(userId: string, format: string) {
    return this.data.rankings.find(
      (r) => r.userId === userId && r.format === format,
    );
  }

  getClubRankingsByFormat(format: string) {
    return this.data.rankings.filter((r) => r.format === format);
  }

  createOrUpdateUserRankingPoints(userId: string, data: any) {
    const existing = this.getUserRankingPoints(userId);
    if (existing) {
      Object.assign(existing, data);
    } else {
      this.data.rankings.push({ userId, ...data });
    }
  }

  // ✅ match 관련
  getUserMatchHistory(userId: string) {
    return this.data.matches.filter(
      (m) => m.player1 === userId || m.player2 === userId,
    );
  }

  updateMatchResult(matchId: string, result: any) {
    const match = this.data.matches.find((m) => m.id === matchId);
    if (match) Object.assign(match, result);
    return match;
  }

  getMatchById(matchId: string) {
    return this.data.matches.find((m) => m.id === matchId);
  }

  getPartnershipStats(userId: string) {
    return this.data.matches.filter(
      (m) => m.player1 === userId || m.player2 === userId,
    );
  }

  addMatchParticipants(matchId: string, participants: string[]) {
    const match = this.getMatchById(matchId);
    if (match) match.participants = participants;
  }
}

// ✅ routes들이 사용하는 이름과 일치시킴
export const memStorage = new MemStorage();
