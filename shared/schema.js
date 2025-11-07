// Database schema for Club Rank - Tennis club management platform
// Supporting both PostgreSQL (Drizzle ORM) and Firebase Firestore
import { pgTable, serial, varchar, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
// =============================================================================
// DRIZZLE ORM TABLE DEFINITIONS (PostgreSQL)
// =============================================================================
// Clubs table - Core club information
export const clubs = pgTable('clubs', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    logoUrl: text('logo_url'),
    bannerUrl: text('banner_url'),
    description: text('description'),
    primaryColor: varchar('primary_color', { length: 7 }).default('#22c55e'), // 기본 녹색
    rankingPoints: integer('ranking_points').default(1000), // ELO 시작점수
    region: varchar('region', { length: 50 }).notNull(), // 지역
    establishedAt: timestamp('established_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});
// Club Members table - User-Club relationship with roles
export const clubMembers = pgTable('club_members', {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(), // Firebase UID 호환
    clubId: integer('club_id').notNull(),
    role: varchar('role', { length: 20 }).notNull().default('member'), // 'owner', 'admin', 'member'
    joinedAt: timestamp('joined_at').defaultNow(),
    isActive: boolean('is_active').default(true), // 활성 멤버 여부
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});
// Club Matches table - Inter-club match requests and results
export const clubMatches = pgTable('club_matches', {
    id: serial('id').primaryKey(),
    requestingClubId: integer('requesting_club_id').notNull(), // 교류전 신청한 클럽
    receivingClubId: integer('receiving_club_id').notNull(), // 교류전 요청받은 클럽
    status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'accepted', 'rejected', 'completed', 'cancelled'
    matchDate: timestamp('match_date'), // 예정된 경기 날짜
    matchLocation: varchar('match_location', { length: 200 }), // 경기 장소
    matchType: varchar('match_type', { length: 50 }).default('friendly'), // 'friendly', 'tournament', 'league'
    gameFormat: varchar('game_format', { length: 30 }).default('mens_doubles'), // 'mens_singles', 'womens_singles', 'mens_doubles', 'womens_doubles', 'mixed_doubles'
    result: varchar('result', { length: 20 }), // 'requesting_won', 'receiving_won', 'draw'
    requestingScore: integer('requesting_score').default(0), // 신청 클럽 점수
    receivingScore: integer('receiving_score').default(0), // 수신 클럽 점수
    cpChange: integer('cp_change').default(0), // CP (Club Power) 변화량 (+/- for requesting club)
    // Participant tracking for individual RP calculation
    requestingTeamPlayer1: varchar('requesting_team_player1', { length: 255 }), // 신청팀 선수1 Firebase UID
    requestingTeamPlayer2: varchar('requesting_team_player2', { length: 255 }), // 신청팀 선수2 Firebase UID (복식인 경우)
    receivingTeamPlayer1: varchar('receiving_team_player1', { length: 255 }), // 수신팀 선수1 Firebase UID
    receivingTeamPlayer2: varchar('receiving_team_player2', { length: 255 }), // 수신팀 선수2 Firebase UID (복식인 경우)
    notes: text('notes'), // 경기 관련 메모
    completedAt: timestamp('completed_at'), // 경기 완료 시간
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});
// User Ranking Points table - Individual ELO-based RP tracking per club
export const userRankingPoints = pgTable('user_ranking_points', {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(), // Firebase UID
    clubId: integer('club_id').notNull(), // 클럽별로 RP 관리
    gameFormat: varchar('game_format', { length: 30 }).notNull(), // 경기 방식별 RP
    rankingPoints: integer('ranking_points').default(1200), // ELO 시작점수 (1200)
    wins: integer('wins').default(0), // 승수
    losses: integer('losses').default(0), // 패수
    draws: integer('draws').default(0), // 무승부
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});
// Match Participants table - Track individual player participation in club matches
export const matchParticipants = pgTable('match_participants', {
    id: serial('id').primaryKey(),
    matchId: integer('match_id').notNull(), // clubMatches 테이블 참조
    userId: varchar('user_id', { length: 255 }).notNull(), // Firebase UID
    team: varchar('team', { length: 20 }).notNull(), // 'requesting' | 'receiving'
    partnerId: varchar('partner_id', { length: 255 }), // 파트너 Firebase UID (복식인 경우)
    rpBefore: integer('rp_before').notNull(), // 경기 전 RP
    rpAfter: integer('rp_after').notNull(), // 경기 후 RP
    rpChange: integer('rp_change').notNull(), // RP 변화량
    createdAt: timestamp('created_at').defaultNow()
});
// Club Dues table - Track membership fees and payment status
export const clubDues = pgTable('club_dues', {
    id: serial('id').primaryKey(),
    clubId: integer('club_id').notNull(), // 클럽 ID
    userId: varchar('user_id', { length: 255 }).notNull(), // 회원 Firebase UID
    amount: integer('amount').notNull(), // 회비 금액
    dueMonth: varchar('due_month', { length: 7 }).notNull(), // '2024-12' 형식
    status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'paid', 'overdue'
    paidAt: timestamp('paid_at'), // 납부 일시
    notes: text('notes'), // 비고
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});
// Club Attendance table - Track member attendance at events
export const clubAttendance = pgTable('club_attendance', {
    id: serial('id').primaryKey(),
    clubId: integer('club_id').notNull(), // 클럽 ID
    userId: varchar('user_id', { length: 255 }).notNull(), // 회원 Firebase UID
    eventDate: timestamp('event_date').notNull(), // 행사 날짜
    eventName: varchar('event_name', { length: 200 }).notNull(), // 행사명
    status: varchar('status', { length: 20 }).notNull().default('absent'), // 'present', 'absent', 'late', 'excused'
    notes: text('notes'), // 비고
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});
// Club Meetings table - Regular meeting schedules and information
export const clubMeetings = pgTable('club_meetings', {
    id: serial('id').primaryKey(),
    clubId: integer('club_id').notNull(), // 클럽 ID
    title: varchar('title', { length: 200 }).notNull(), // 모임 제목
    description: text('description'), // 모임 설명
    meetingDate: timestamp('meeting_date').notNull(), // 모임 날짜
    location: varchar('location', { length: 200 }), // 장소
    maxParticipants: integer('max_participants'), // 최대 인원
    participants: text('participants').array(), // 참가자 Firebase UID 배열
    status: varchar('status', { length: 20 }).notNull().default('scheduled'), // 'scheduled', 'completed', 'cancelled'
    createdBy: varchar('created_by', { length: 255 }).notNull(), // 생성자 Firebase UID
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});
// =============================================================================
// ZOD SCHEMAS FOR VALIDATION
// =============================================================================
// Insert schema for clubs (omitting auto-generated fields)
export const insertClubSchema = createInsertSchema(clubs).omit({
    id: true,
    establishedAt: true,
    createdAt: true,
    updatedAt: true
});
// Insert schema for club members
export const insertClubMemberSchema = createInsertSchema(clubMembers).omit({
    id: true,
    joinedAt: true,
    createdAt: true,
    updatedAt: true
}).extend({
    role: z.enum(['owner', 'admin', 'member']).default('member')
});
// Insert schema for club matches
export const insertClubMatchSchema = createInsertSchema(clubMatches).omit({
    id: true,
    completedAt: true,
    createdAt: true,
    updatedAt: true
}).extend({
    status: z.enum(['pending', 'accepted', 'rejected', 'completed', 'cancelled']).default('pending'),
    matchType: z.enum(['friendly', 'tournament', 'league']).default('friendly'),
    gameFormat: z.enum(['mens_singles', 'womens_singles', 'mens_doubles', 'womens_doubles', 'mixed_doubles']).default('mens_doubles'),
    result: z.enum(['requesting_won', 'receiving_won', 'draw']).optional()
});
// Insert schema for user ranking points
export const insertUserRankingPointsSchema = createInsertSchema(userRankingPoints).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
// Insert schema for match participants
export const insertMatchParticipantsSchema = createInsertSchema(matchParticipants).omit({
    id: true,
    createdAt: true
});
// Insert schema for club dues
export const insertClubDuesSchema = createInsertSchema(clubDues).omit({
    id: true,
    createdAt: true,
    updatedAt: true
}).extend({
    status: z.enum(['pending', 'paid', 'overdue']).default('pending')
});
// Insert schema for club attendance
export const insertClubAttendanceSchema = createInsertSchema(clubAttendance).omit({
    id: true,
    createdAt: true,
    updatedAt: true
}).extend({
    status: z.enum(['present', 'absent', 'late', 'excused']).default('absent'),
    eventDate: z.coerce.date() // ✅ Coerce string to Date for JSON compatibility
});
// Insert schema for club meetings
export const insertClubMeetingsSchema = createInsertSchema(clubMeetings).omit({
    id: true,
    createdAt: true,
    updatedAt: true
}).extend({
    status: z.enum(['scheduled', 'completed', 'cancelled']).default('scheduled'),
    meetingDate: z.coerce.date() // ✅ Coerce string to Date for JSON compatibility
});
