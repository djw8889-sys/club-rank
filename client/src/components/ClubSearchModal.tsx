import { useState } from "react";
import { useClubSearch, useJoinClub } from "@/hooks/use-clubs";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "./LoadingSpinner";

interface Club {
  id: number;
  name: string;
  description: string | null;
  region: string;
  primaryColor: string | null;
  rankingPoints: number | null;
  memberCount: number;
  establishedAt: Date | null;
}

interface ClubSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REGIONS = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시", 
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원도", 
  "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", 
  "경상남도", "제주특별자치도"
];

export default function ClubSearchModal({ isOpen, onClose }: ClubSearchModalProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const { toast } = useToast();
  const joinClubMutation = useJoinClub();

  const { data: clubs = [], isLoading, isError } = useClubSearch(selectedRegion);

  const handleJoinClub = async (club: Club) => {
    try {
      await joinClubMutation.mutateAsync(club.id);
      
      toast({
        title: "클럽 가입 완료",
        description: `${club.name}에 성공적으로 가입했습니다!`,
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: "클럽 가입 실패",
        description: error.message || "클럽 가입 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span className="text-2xl">🛡️</span>
            <span>클럽 찾기</span>
          </DialogTitle>
          <DialogDescription>
            원하는 지역의 클럽을 찾아 가입해보세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">지역 선택</label>
            <Select onValueChange={setSelectedRegion} value={selectedRegion}>
              <SelectTrigger data-testid="select-search-region">
                <SelectValue placeholder="지역을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 클럽 목록 */}
          <div className="space-y-3">
            {!selectedRegion ? (
              <div className="text-center py-8 text-muted-foreground">
                지역을 선택하면 클럽 목록이 표시됩니다
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-muted-foreground text-sm">클럽을 검색하는 중...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-8 text-destructive">
                클럽 검색 중 오류가 발생했습니다
              </div>
            ) : clubs.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-search text-2xl text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2" data-testid="text-no-clubs-found">
                  {selectedRegion}에서 클럽을 찾을 수 없습니다
                </p>
                <p className="text-xs text-muted-foreground">
                  다른 지역을 선택하거나 새로운 클럽을 만들어보세요
                </p>
              </div>
            ) : (
              clubs.map((club) => (
                <div 
                  key={club.id}
                  className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                  data-testid={`card-club-${club.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: club.primaryColor || '#22c55e' }}
                        />
                        <h3 className="font-semibold text-lg" data-testid={`text-club-name-${club.id}`}>
                          {club.name}
                        </h3>
                      </div>
                      
                      {club.description && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {club.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <i className="fas fa-users" />
                          <span data-testid={`text-member-count-${club.id}`}>
                            {club.memberCount}명
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <i className="fas fa-trophy" />
                          <span data-testid={`text-ranking-points-${club.id}`}>
                            {club.rankingPoints || 1000}점
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleJoinClub(club)}
                      disabled={joinClubMutation.isPending}
                      size="sm"
                      data-testid={`button-join-club-${club.id}`}
                    >
                      {joinClubMutation.isPending ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        "가입하기"
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
              data-testid="button-close-club-search"
            >
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}