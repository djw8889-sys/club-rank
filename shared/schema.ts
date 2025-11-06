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

// Insert types from schemas
export type InsertClub = z.infer<typeof insertClubSchema>;
export type InsertClubMember = z.infer<typeof insertClubMemberSchema>;
export type InsertClubMatch = z.infer<typeof insertClubMatchSchema>;
export type InsertUserRankingPoints = z.infer<typeof insertUserRankingPointsSchema>;
export type InsertMatchParticipants = z.infer<typeof insertMatchParticipantsSchema>;

// Select types from tables
export type Club = typeof clubs.$inferSelect;
export type ClubMember = typeof clubMembers.$inferSelect;
export type ClubMatch = typeof clubMatches.$inferSelect;
export type UserRankingPoints = typeof userRankingPoints.$inferSelect;
export type MatchParticipants = typeof matchParticipants.$inferSelect;

// =============================================================================
// FIREBASE FIRESTORE INTERFACES (Legacy - transitioning to Drizzle)
// =============================================================================

export interface User {
  id: string;
  email: string;
  username: string;
  photoURL: string | null;
  ntrp: string;
  region: string;
  age: string;
  bio: string | null;
  availableTimes: string[];
  points: number;
  wins: number;
  losses: number;
  mannerScore: number; // 매너 점수 (1-5, 기본값 5)
  mannerReviewsCount: number; // 매너 리뷰 받은 횟수
  mannerScoreSum: number; // 매너 점수 합계
  tier?: string; // Calculated tier based on performance
  role?: 'admin' | 'user'; // User role for permissions
  isProfileComplete?: boolean; // 프로필 설정 완료 여부
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  requesterId: string;
  targetId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  scheduledAt?: Date;
  location?: string;
  pointsCost: number;
  gameFormat?: 'mens_singles' | 'womens_singles' | 'mens_doubles' | 'womens_doubles' | 'mixed_doubles'; // 경기 방식
  result?: 'requester_won' | 'target_won' | 'draw';
  isReviewed: boolean; // 전체 리뷰 완료 여부 (양쪽 다 완료)
  reviewedByRequester: boolean; // 요청자 리뷰 완료 여부
  reviewedByTarget: boolean; // 대상자 리뷰 완료 여부
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  matchId: string;
  senderId: string;
  message: string;
  createdAt: Date;
}

// 1:1 채팅을 위한 새로운 인터페이스들
export interface ChatRoom {
  id: string;
  participants: string[]; // 참여자 ID 배열 (항상 2명)
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

export interface Participant {
  id: string;
  chatRoomId: string;
  userId: string;
  joinedAt: Date;
}

export interface Post {
  id: string;
  authorId: string;
  title: string;
  content: string;
  likes: string[]; // 좋아요한 사용자 ID 배열
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

export interface Friend {
  id: string;
  userId1: string; // 친구 요청을 보낸 사용자
  userId2: string; // 친구 요청을 받은 사용자
  status: 'pending' | 'accepted'; // 친구 관계 상태
  createdAt: Date;
  updatedAt: Date;
}

// Input types for creating new records (omitting auto-generated fields)
export interface InsertUser {
  email: string;
  username: string;
  photoURL?: string | null;
  ntrp: string;
  region: string;
  age: string;
  bio?: string | null;
  availableTimes: string[];
  mannerScore?: number; // 기본값 5
  mannerReviewsCount?: number; // 기본값 0
  mannerScoreSum?: number; // 기본값 0 (누적 합계)
  role?: 'admin' | 'user';
}

export interface InsertMatch {
  requesterId: string;
  targetId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  scheduledAt?: Date;
  location?: string;
  pointsCost: number;
  gameFormat?: 'mens_singles' | 'womens_singles' | 'mens_doubles' | 'womens_doubles' | 'mixed_doubles'; // 경기 방식
  result?: 'requester_won' | 'target_won' | 'draw';
  isReviewed?: boolean; // 기본값 false (전체 리뷰 완료)
  reviewedByRequester?: boolean; // 기본값 false
  reviewedByTarget?: boolean; // 기본값 false
}

export interface InsertChat {
  matchId: string;
  senderId: string;
  message: string;
}

export interface InsertPost {
  authorId: string;
  title: string;
  content: string;
}

// 새로운 채팅 관련 Insert 타입들
export interface InsertChatRoom {
  participants: string[];
}

export interface InsertMessage {
  chatRoomId: string;
  senderId: string;
  content: string;
}

export interface InsertComment {
  authorId: string;
  content: string;
}

export interface InsertFriend {
  userId1: string;
  userId2: string;
  status: 'pending' | 'accepted';
}

// =============================================================================
// CLUB-RELATED FIREBASE INTERFACES (Will be migrated to Drizzle)
// =============================================================================

// Temporary Club interface for Firebase compatibility
export interface ClubFirebase {
  id: string;
  name: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  primaryColor: string;
  rankingPoints: number;
  region: string;
  establishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertClubFirebase {
  name: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  primaryColor?: string;
  rankingPoints?: number;
  region: string;
}

// Club Members Firebase interface
export interface ClubMemberFirebase {
  id: string;
  userId: string;
  clubId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertClubMemberFirebase {
  userId: string;
  clubId: string;
  role?: 'owner' | 'admin' | 'member';
  isActive?: boolean;
}

// Club Matches Firebase interface
export interface ClubMatchFirebase {
  id: string;
  requestingClubId: string;
  receivingClubId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  matchDate?: Date | null;
  matchLocation?: string | null;
  matchType: 'friendly' | 'tournament' | 'league';
  gameFormat?: 'mens_singles' | 'womens_singles' | 'mens_doubles' | 'womens_doubles' | 'mixed_doubles';
  result?: 'requesting_won' | 'receiving_won' | 'draw' | null;
  requestingScore: number;
  receivingScore: number;
  cpChange: number;
  notes?: string | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertClubMatchFirebase {
  requestingClubId: string;
  receivingClubId: string;
  status?: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  matchDate?: Date | null;
  matchLocation?: string | null;
  matchType?: 'friendly' | 'tournament' | 'league';
  gameFormat?: 'mens_singles' | 'womens_singles' | 'mens_doubles' | 'womens_doubles' | 'mixed_doubles';
  result?: 'requesting_won' | 'receiving_won' | 'draw' | null;
  requestingScore?: number;
  receivingScore?: number;
  cpChange?: number;
  notes?: string | null;
}