import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import LoadingSpinner from "./LoadingSpinner";

interface ClubMember {
  id: number;
  userId: string;
  clubId: number;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  isActive: boolean;
}

interface ClubAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: number;
  clubName: string;
  members: ClubMember[];
}

// 모의 데이터 - 실제로는 API에서 가져올 데이터
const mockPersonalRankings = [
  { id: 1, name: "김테니스", wins: 15, losses: 3, winRate: 83.3, points: 1250 },
  { id: 2, name: "이스매시", wins: 12, losses: 6, winRate: 66.7, points: 1180 },
  { id: 3, name: "박서브", wins: 10, losses: 8, winRate: 55.6, points: 1120 },
  { id: 4, name: "최발리", wins: 8, losses: 10, winRate: 44.4, points: 1080 },
  { id: 5, name: "정패싱", wins: 6, losses: 12, winRate: 33.3, points: 1020 },
];

const mockMatchHistory = [
  { 
    id: 1, 
    opponent: "서울테니스클럽", 
    date: "2024-11-15", 
    result: "승리", 
    score: "3-1",
    eloChange: "+15",
    gameFormat: "mens_doubles"
  },
  { 
    id: 2, 
    opponent: "강남라켓클럽", 
    date: "2024-10-28", 
    result: "패배", 
    score: "1-3",
    eloChange: "-12",
    gameFormat: "mixed_doubles"
  },
  { 
    id: 3, 
    opponent: "잠실테니스클럽", 
    date: "2024-10-10", 
    result: "승리", 
    score: "2-2 (승부차기)",
    eloChange: "+8",
    gameFormat: "mens_doubles"
  },
];

const mockPartnerCompatibility = [
  { 
    player1: "김테니스", 
    player2: "이스매시", 
    matches: 8, 
    wins: 6, 
    winRate: 75, 
    chemistry: "우수" 
  },
  { 
    player1: "박서브", 
    player2: "최발리", 
    matches: 6, 
    wins: 4, 
    winRate: 66.7, 
    chemistry: "좋음" 
  },
  { 
    player1: "김테니스", 
    player2: "정패싱", 
    matches: 5, 
    wins: 2, 
    winRate: 40, 
    chemistry: "보통" 
  },
];

const GAME_FORMAT_LABELS = {
  mens_singles: "남자 단식",
  womens_singles: "여자 단식", 
  mens_doubles: "남자 복식",
  womens_doubles: "여자 복식",
  mixed_doubles: "혼합 복식"
};

export default function ClubAnalyticsModal({ isOpen, onClose, clubId, clubName, members }: ClubAnalyticsModalProps) {
  const [activeTab, setActiveTab] = useState("rankings");
  const [isLoading] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span className="text-2xl">📊</span>
            <span>{clubName} 전적 분석</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rankings" data-testid="tab-personal-rankings">
              개인 랭킹
            </TabsTrigger>
            <TabsTrigger value="matches" data-testid="tab-match-history">
              경기별 전적
            </TabsTrigger>
            <TabsTrigger value="partners" data-testid="tab-partner-compatibility">
              파트너 궁합
            </TabsTrigger>
          </TabsList>

          {/* 개인 랭킹 탭 */}
          <TabsContent value="rankings" className="space-y-6">
            <div className="text-sm text-muted-foreground">
              클럽 내 개인별 승률과 포인트를 기준으로 한 랭킹입니다.
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="space-y-3">
                {mockPersonalRankings.map((player, index) => (
                  <div 
                    key={player.id}
                    className="bg-muted rounded-lg p-4"
                    data-testid={`ranking-player-${player.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-amber-600' : 'bg-slate-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold">{player.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {player.wins}승 {player.losses}패
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {player.points}점
                        </div>
                        <div className="text-sm text-muted-foreground">
                          승률 {player.winRate}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>승률</span>
                        <span>{player.winRate}%</span>
                      </div>
                      <Progress value={player.winRate} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 경기별 전적 탭 */}
          <TabsContent value="matches" className="space-y-6">
            <div className="text-sm text-muted-foreground">
              다른 클럽과의 교류전 기록과 상세 결과입니다.
            </div>
            
            {/* 전체 통계 요약 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">12</div>
                <div className="text-xs text-muted-foreground">총 경기</div>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">8</div>
                <div className="text-xs text-muted-foreground">승리</div>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">4</div>
                <div className="text-xs text-muted-foreground">패배</div>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">66.7%</div>
                <div className="text-xs text-muted-foreground">승률</div>
              </div>
            </div>
            
            <div className="space-y-3">
              {mockMatchHistory.map((match) => (
                <div 
                  key={match.id}
                  className="bg-muted rounded-lg p-4"
                  data-testid={`match-history-${match.id}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">vs {match.opponent}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(match.date).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className={
                          match.result === "승리" 
                            ? "text-green-600 border-green-600" 
                            : "text-red-600 border-red-600"
                        }
                      >
                        {match.result}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        {match.eloChange} CP
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{match.score}</span>
                    <Badge variant="secondary">
                      {GAME_FORMAT_LABELS[match.gameFormat as keyof typeof GAME_FORMAT_LABELS]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* 파트너 궁합 탭 */}
          <TabsContent value="partners" className="space-y-6">
            <div className="text-sm text-muted-foreground">
              복식 경기에서 함께 뛴 파트너들 간의 궁합도를 분석합니다.
            </div>
            
            <div className="space-y-3">
              {mockPartnerCompatibility.map((partnership, index) => (
                <div 
                  key={index}
                  className="bg-muted rounded-lg p-4"
                  data-testid={`partnership-${index}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">
                        {partnership.player1} & {partnership.player2}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {partnership.matches}경기 함께 출전
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <Badge 
                        variant="outline"
                        className={
                          partnership.chemistry === "우수" ? "text-green-600 border-green-600" :
                          partnership.chemistry === "좋음" ? "text-blue-600 border-blue-600" :
                          "text-yellow-600 border-yellow-600"
                        }
                      >
                        {partnership.chemistry}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        승률 {partnership.winRate}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{partnership.wins}승 {partnership.matches - partnership.wins}패</span>
                      <span>궁합도 {partnership.winRate}%</span>
                    </div>
                    <Progress value={partnership.winRate} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center">
                <i className="fas fa-lightbulb mr-2 text-blue-600" />
                추천 파트너 조합
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                데이터 분석 결과 가장 높은 승률을 보이는 파트너 조합입니다.
              </p>
              <div className="text-sm">
                <span className="font-medium">김테니스 & 이스매시</span> - 승률 75% (8경기 중 6승)
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}