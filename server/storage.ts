export class MemStorage {
  private data: Record<string, any[]> = {
    users: [],
    clubs: [],
    matches: [],
    rankings: [],
  };

  // ✅ Example dummy methods
  getUserClubMemberships(userId: string) {
    return this.data.clubs.filter((club) => club.members?.includes(userId));
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

export const memStorage = new MemStorage();
