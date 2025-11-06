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
const mockMatchHistory = [
  { 
    id: 1, 
    opponent: "서울테니스클럽", 
    date: "2024-11-15", 
    result: "승리", 
    score: "3-1",
    cpChange: "+15",
    gameFormat: "mens_doubles"
  },
  { 
    id: 2, 
    opponent: "강남라켓클럽", 
    date: "2024-10-28", 
    result: "패배", 
    score: "1-3",
    cpChange: "-12",
    gameFormat: "mixed_doubles"
  },
  { 
    id: 3, 
    opponent: "잠실테니스클럽", 
    date: "2024-10-10", 
    result: "승리", 
    score: "2-2 (승부차기)",
    cpChange: "+8",
    gameFormat: "mens_doubles"
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
  const [isLoading] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span className="text-2xl">📊</span>
            <span>{clubName} 교류전 전적</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
                        {match.cpChange} CP
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
          </div>
      </DialogContent>
    </Dialog>
  );
}