// server/storage.ts
export class MemStorage {
  private data: Record<string, any[]> = {
    users: [],
    clubs: [],
    matches: [],
    rankings: [],
    dues: [],
    attendance: [],
    meetings: [],
  };

  // ----- Club 관련 -----
  /**
   * ✅ 클럽 ID로 조회
   * - Flexible comparison: supports both string and numeric IDs
   * - Handles route params (always strings) matching numeric DB IDs
   */
  getClubById(id: string | number) {
    return this.data.clubs.find((club) => club.id == id); // ✅ Use loose equality
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
          role: club.owner === userId ? "owner" : "member",
          joinedAt: new Date(),
        },
        club, // ✅ club 필드 포함
      }));

    return memberships;
  }

  /**
   * ✅ 클럽 멤버 목록 조회
   * - Accepts both numeric and string club IDs (e.g., "default-userId")
   * - Uses loose equality to match route params (strings) with numeric IDs
   */
  getClubMembers(clubId: string | number) {
    const club = this.data.clubs.find((c) => c.id == clubId); // ✅ Use loose equality
    if (!club || !club.members) {
      return [];
    }

    // Return member list with basic info
    return club.members.map((userId: string, index: number) => ({
      id: index + 1,
      userId,
      clubId,
      role: club.owner === userId ? "owner" : "member",
      joinedAt: new Date(),
      isActive: true,
    }));
  }

  /**
   * ✅ 클럽 탈퇴
   * - Accepts both numeric and string club IDs (e.g., "default-userId")
   * - Uses loose equality to match route params (strings) with numeric IDs
   */
  leaveClub(userId: string, clubId: string | number) {
    const club = this.data.clubs.find((c) => c.id == clubId); // ✅ Use loose equality
    if (club && club.members) {
      club.members = club.members.filter((id: string) => id !== userId);
    }
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

  // ----- Dues 관련 (회비) -----
  /**
   * ✅ 클럽 회비 목록 조회
   */
  getClubDues(clubId: string | number, userId?: string) {
    return this.data.dues.filter(
      (d) => d.clubId == clubId && (!userId || d.userId === userId),
    );
  }

  /**
   * ✅ 회비 생성
   */
  createDues(dues: any) {
    const newDues = {
      ...dues,
      id: this.data.dues.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.dues.push(newDues);
    return newDues;
  }

  /**
   * ✅ 회비 상태 업데이트
   */
  updateDuesStatus(duesId: number, status: string, paidAt?: Date) {
    const dues = this.data.dues.find((d) => d.id === duesId);
    if (dues) {
      dues.status = status;
      if (paidAt) dues.paidAt = paidAt;
      dues.updatedAt = new Date();
    }
    return dues;
  }

  /**
   * ✅ 회비 삭제
   */
  deleteDues(duesId: number) {
    const index = this.data.dues.findIndex((d) => d.id === duesId);
    if (index !== -1) {
      this.data.dues.splice(index, 1);
      return true;
    }
    return false;
  }

  // ----- Attendance 관련 (출석) -----
  /**
   * ✅ 클럽 출석 기록 조회
   */
  getClubAttendance(clubId: string | number, eventDate?: Date) {
    return this.data.attendance.filter(
      (a) =>
        a.clubId == clubId &&
        (!eventDate ||
          new Date(a.eventDate).toDateString() === eventDate.toDateString()),
    );
  }

  /**
   * ✅ 출석 기록 생성
   */
  createAttendance(attendance: any) {
    const newAttendance = {
      ...attendance,
      id: this.data.attendance.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.attendance.push(newAttendance);
    return newAttendance;
  }

  /**
   * ✅ 출석 상태 업데이트
   */
  updateAttendanceStatus(attendanceId: number, status: string, notes?: string) {
    const attendance = this.data.attendance.find((a) => a.id === attendanceId);
    if (attendance) {
      attendance.status = status;
      if (notes !== undefined) attendance.notes = notes;
      attendance.updatedAt = new Date();
    }
    return attendance;
  }

  /**
   * ✅ 출석 기록 삭제
   */
  deleteAttendance(attendanceId: number) {
    const index = this.data.attendance.findIndex((a) => a.id === attendanceId);
    if (index !== -1) {
      this.data.attendance.splice(index, 1);
      return true;
    }
    return false;
  }

  // ----- Meetings 관련 (정기모임) -----
  /**
   * ✅ 클럽 모임 목록 조회
   */
  getClubMeetings(clubId: string | number) {
    return this.data.meetings.filter((m) => m.clubId == clubId);
  }

  /**
   * ✅ 모임 단건 조회
   */
  getMeetingById(meetingId: number) {
    return this.data.meetings.find((m) => m.id === meetingId);
  }

  /**
   * ✅ 모임 생성
   */
  createMeeting(meeting: any) {
    const newMeeting = {
      ...meeting,
      id: this.data.meetings.length + 1,
      participants: meeting.participants || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.meetings.push(newMeeting);
    return newMeeting;
  }

  /**
   * ✅ 모임 참가
   */
  joinMeeting(meetingId: number, userId: string) {
    const meeting = this.data.meetings.find((m) => m.id === meetingId);
    if (meeting && !meeting.participants.includes(userId)) {
      if (
        !meeting.maxParticipants ||
        meeting.participants.length < meeting.maxParticipants
      ) {
        meeting.participants.push(userId);
        meeting.updatedAt = new Date();
        return meeting;
      }
    }
    return null;
  }

  /**
   * ✅ 모임 참가 취소
   */
  leaveMeeting(meetingId: number, userId: string) {
    const meeting = this.data.meetings.find((m) => m.id === meetingId);
    if (meeting) {
      meeting.participants = meeting.participants.filter(
        (p: string) => p !== userId,
      );
      meeting.updatedAt = new Date();
    }
    return meeting;
  }

  /**
   * ✅ 모임 업데이트
   */
  updateMeeting(meetingId: number, updates: any) {
    const meeting = this.data.meetings.find((m) => m.id === meetingId);
    if (meeting) {
      Object.assign(meeting, updates, { updatedAt: new Date() });
    }
    return meeting;
  }

  /**
   * ✅ 모임 삭제
   */
  deleteMeeting(meetingId: number) {
    const index = this.data.meetings.findIndex((m) => m.id === meetingId);
    if (index !== -1) {
      this.data.meetings.splice(index, 1);
      return true;
    }
    return false;
  }
}

// ✅ Export 이름 통일
export const storage = new MemStorage();
