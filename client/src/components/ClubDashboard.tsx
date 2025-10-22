import { useState } from "react";
import { useMyClubMembership, useClubMembers, useLeaveClub } from "@/hooks/use-clubs";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import LoadingSpinner from "./LoadingSpinner";
import ClubManagementModal from "./ClubManagementModal";
import BracketGeneratorModal from "./BracketGeneratorModal";
import ClubAnalyticsModal from "./ClubAnalyticsModal";

interface ClubMembership {
  membership: {
    id: number;
    userId: string;
    clubId: number;
    role: 'owner' | 'admin' | 'member';
    joinedAt: Date;
    isActive: boolean;
  };
  club: {
    id: number;
    name: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    description: string | null;
    primaryColor: string | null;
    rankingPoints: number | null;
    region: string;
    establishedAt: Date | null;
  };
}

interface ClubDashboardProps {
  membership: ClubMembership;
}

const ROLE_LABELS = {
  owner: '클럽장',
  admin: '관리자',
  member: '멤버'
};

const ROLE_COLORS = {
  owner: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  member: 'bg-gray-100 text-gray-800 border-gray-200'
};

export default function ClubDashboard({ membership }: ClubDashboardProps) {
  const { toast } = useToast();
  const leaveClubMutation = useLeaveClub();
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [showBracketModal, setShowBracketModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  
  const { data: members = [], isLoading: membersLoading } = useClubMembers(membership.club.id);
  
  const { club } = membership;
  const userRole = membership.membership.role;
  const canLeaveClub = userRole !== 'owner'; // 클럽장은 탈퇴 불가

  const handleLeaveClub = async () => {
    try {
      await leaveClubMutation.mutateAsync(club.id);
      
      toast({
        title: "클럽 탈퇴 완료",
        description: `${club.name}에서 탈퇴했습니다.`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "클럽 탈퇴 중 오류가 발생했습니다.";
      toast({
        title: "클럽 탈퇴 실패",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 클럽 헤더 */}
      <div 
        className="relative p-6 rounded-xl text-white overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${club.primaryColor || '#22c55e'}, ${club.primaryColor || '#22c55e'}dd)`
        }}
      >
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2" data-testid="text-club-name">
                {club.name}
              </h2>
              <div className="flex items-center space-x-4 text-white/90">
                <div className="flex items-center space-x-1">
                  <i className="fas fa-map-marker-alt" />
                  <span data-testid="text-club-region">{club.region}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <i className="fas fa-trophy" />
                  <span data-testid="text-club-points">{club.rankingPoints || 1000}점</span>
                </div>
              </div>
            </div>
            
            <Badge className={`${ROLE_COLORS[userRole]} border`} data-testid="badge-user-role">
              {ROLE_LABELS[userRole]}
            </Badge>
          </div>
          
          {club.description && (
            <p className="text-white/90 text-sm" data-testid="text-club-description">
              {club.description}
            </p>
          )}
        </div>
        
        {/* 배경 패턴 */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <i className="fas fa-shield-alt text-6xl" />
        </div>
      </div>

      {/* 클럽 통계 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-background border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary" data-testid="text-member-count">
            {members.length}
          </div>
          <div className="text-xs text-muted-foreground">총 멤버 수</div>
        </div>
        <div className="bg-background border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {club.establishedAt ? 
              Math.floor((new Date().getTime() - new Date(club.establishedAt).getTime()) / (1000 * 60 * 60 * 24)) 
              : 0
            }
          </div>
          <div className="text-xs text-muted-foreground">운영 일수</div>
        </div>
        <div className="bg-background border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">0</div>
          <div className="text-xs text-muted-foreground">교류전 승수</div>
        </div>
      </div>

      {/* 클럽 멤버 */}
      <div className="bg-background border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-4 flex items-center">
          <i className="fas fa-users mr-2 text-primary" />
          클럽 멤버 ({members.length}명)
        </h3>
        
        {membersLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            멤버 정보를 불러올 수 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">
                    <i className="fas fa-user" />
                  </div>
                  <div>
                    <div className="font-medium" data-testid={`text-member-${member.id}`}>
                      멤버 {member.id}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString()} 가입
                    </div>
                  </div>
                </div>
                
                <Badge 
                  className={`${ROLE_COLORS[member.role as keyof typeof ROLE_COLORS]} border text-xs`}
                  data-testid={`badge-member-role-${member.id}`}
                >
                  {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 액션 버튼들 */}
      <div className="space-y-3">
        {userRole === 'owner' || userRole === 'admin' ? (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowManagementModal(true)}
            data-testid="button-manage-club"
          >
            <i className="fas fa-cog mr-2" />
            클럽 관리
          </Button>
        ) : null}
        
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setShowAnalyticsModal(true)}
          data-testid="button-club-matches"
        >
          <i className="fas fa-chart-line mr-2" />
          클럽 전적 분석
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setShowBracketModal(true)}
          data-testid="button-generate-bracket"
        >
          <i className="fas fa-sitemap mr-2" />
          대진표 생성
        </Button>
        
        {canLeaveClub && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full text-destructive hover:text-destructive"
                data-testid="button-leave-club"
              >
                <i className="fas fa-sign-out-alt mr-2" />
                클럽 탈퇴
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>클럽 탈퇴</AlertDialogTitle>
                <AlertDialogDescription>
                  정말로 {club.name}에서 탈퇴하시겠습니까? 
                  탈퇴 후에는 클럽 정보에 접근할 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-leave">취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLeaveClub}
                  disabled={leaveClubMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-confirm-leave"
                >
                  {leaveClubMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      탈퇴 중...
                    </>
                  ) : (
                    "탈퇴하기"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* 모달들 */}
      <ClubManagementModal 
        isOpen={showManagementModal}
        onClose={() => setShowManagementModal(false)}
        membership={membership}
      />
      
      <BracketGeneratorModal 
        isOpen={showBracketModal}
        onClose={() => setShowBracketModal(false)}
        clubId={membership.club.id}
        members={members}
      />
      
      <ClubAnalyticsModal 
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        clubId={membership.club.id}
        clubName={membership.club.name}
        members={members}
      />
    </div>
  );
}