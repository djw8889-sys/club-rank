import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "./LoadingSpinner";

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

interface ClubManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  membership: ClubMembership;
}

const clubSettingsSchema = z.object({
  name: z.string().min(2, "클럽명은 2글자 이상이어야 합니다.").max(50, "클럽명은 50글자 이하여야 합니다."),
  description: z.string().max(500, "소개글은 500글자 이하여야 합니다.").optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "올바른 색상 코드를 입력해주세요."),
  logoUrl: z.string().url("올바른 URL을 입력해주세요.").optional().or(z.literal("")),
  bannerUrl: z.string().url("올바른 URL을 입력해주세요.").optional().or(z.literal("")),
});

type ClubSettingsFormData = z.infer<typeof clubSettingsSchema>;

export default function ClubManagementModal({ isOpen, onClose, membership }: ClubManagementModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("identity");
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<ClubSettingsFormData>({
    resolver: zodResolver(clubSettingsSchema),
    defaultValues: {
      name: membership.club.name || "",
      description: membership.club.description || "",
      primaryColor: membership.club.primaryColor || "#22c55e",
      logoUrl: membership.club.logoUrl || "",
      bannerUrl: membership.club.bannerUrl || "",
    },
  });

  const onSubmitSettings = async (data: ClubSettingsFormData) => {
    try {
      setIsUpdating(true);
      
      // TODO: API 연동 구현
      await new Promise(resolve => setTimeout(resolve, 1000)); // 임시 지연
      
      toast({
        title: "클럽 설정 업데이트 완료",
        description: "클럽 정보가 성공적으로 업데이트되었습니다.",
      });
      
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "클럽 설정 업데이트 중 오류가 발생했습니다.";
      toast({
        title: "업데이트 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span className="text-2xl">⚙️</span>
            <span>{membership.club.name} 관리</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="identity" data-testid="tab-club-identity">
              클럽 정체성
            </TabsTrigger>
            <TabsTrigger value="fees" data-testid="tab-club-fees">
              회비 관리
            </TabsTrigger>
            <TabsTrigger value="meetings" data-testid="tab-club-meetings">
              정기 모임
            </TabsTrigger>
            <TabsTrigger value="matches" data-testid="tab-club-inter-matches">
              교류전
            </TabsTrigger>
          </TabsList>

          {/* 클럽 정체성 탭 */}
          <TabsContent value="identity" className="space-y-6">
            <div className="text-sm text-muted-foreground">
              클럽의 로고, 배너, 색상, 소개글을 설정하여 클럽만의 개성을 표현하세요.
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitSettings)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>클럽명</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="클럽 이름" data-testid="input-club-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>클럽 소개글</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="클럽을 소개하는 글을 작성해주세요..." 
                          className="min-h-[100px]"
                          data-testid="textarea-club-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>대표 색상</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Input 
                            {...field} 
                            type="color" 
                            className="w-16 h-10 p-1 border rounded"
                            data-testid="input-club-color"
                          />
                          <Input 
                            {...field} 
                            placeholder="#22c55e"
                            className="flex-1"
                            data-testid="input-club-color-hex"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>로고 URL (선택사항)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="https://example.com/logo.png"
                          data-testid="input-club-logo-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bannerUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>배너 URL (선택사항)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="https://example.com/banner.png"
                          data-testid="input-club-banner-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isUpdating}
                  data-testid="button-save-club-settings"
                >
                  {isUpdating ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      업데이트 중...
                    </>
                  ) : (
                    "설정 저장"
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>

          {/* 회비 관리 탭 */}
          <TabsContent value="fees" className="space-y-6">
            <div className="text-sm text-muted-foreground">
              클럽 회비를 관리하고 납부 현황을 확인하세요. (MVP: 수동 확인 방식)
            </div>
            
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <i className="fas fa-credit-card mr-2 text-primary" />
                회비 설정
              </h4>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium">월 회비</label>
                  <Input 
                    placeholder="30,000" 
                    className="mt-1"
                    data-testid="input-monthly-fee"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">계좌 정보</label>
                  <Input 
                    placeholder="하나은행 123-456789-01234" 
                    className="mt-1"
                    data-testid="input-account-info"
                  />
                </div>
              </div>
              
              <Button variant="outline" className="w-full" data-testid="button-save-fee-settings">
                <i className="fas fa-save mr-2" />
                회비 설정 저장
              </Button>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <i className="fas fa-check-circle mr-2 text-green-600" />
                납부 현황 (수동 확인)
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-background rounded">
                  <span>김테니스 (2024년 12월)</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    납부 완료
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-background rounded">
                  <span>이스매시 (2024년 12월)</span>
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    미납
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 정기 모임 탭 */}
          <TabsContent value="meetings" className="space-y-6">
            <div className="text-sm text-muted-foreground">
              정기 모임을 등록하고 회원들의 참석 현황을 관리하세요.
            </div>
            
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <i className="fas fa-calendar-plus mr-2 text-primary" />
                새 모임 등록
              </h4>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium">모임 제목</label>
                  <Input 
                    placeholder="12월 정기 모임" 
                    className="mt-1"
                    data-testid="input-meeting-title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">날짜</label>
                  <Input 
                    type="datetime-local" 
                    className="mt-1"
                    data-testid="input-meeting-date"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="text-sm font-medium">장소</label>
                <Input 
                  placeholder="테니스파크 코트 1-2번" 
                  className="mt-1"
                  data-testid="input-meeting-location"
                />
              </div>
              
              <Button className="w-full" data-testid="button-create-meeting">
                <i className="fas fa-plus mr-2" />
                모임 등록
              </Button>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <i className="fas fa-users mr-2 text-green-600" />
                다가오는 모임
              </h4>
              
              <div className="space-y-3">
                <div className="bg-background rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">12월 정기 모임</h5>
                    <Badge variant="outline">진행 예정</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    📅 2024년 12월 25일 오후 2시<br />
                    📍 테니스파크 코트 1-2번
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span>참석 현황: 8명 참석, 2명 불참, 3명 미응답</span>
                    <Button size="sm" variant="outline" data-testid="button-send-reminder">
                      <i className="fas fa-bell mr-1" />
                      알림 발송
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 교류전 탭 */}
          <TabsContent value="matches" className="space-y-6">
            <div className="text-sm text-muted-foreground">
              다른 클럽과의 교류전을 신청하고 관리하세요.
            </div>
            
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <i className="fas fa-handshake mr-2 text-primary" />
                교류전 신청
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">상대 클럽</label>
                  <Input 
                    placeholder="클럽 검색..." 
                    className="mt-1"
                    data-testid="input-opponent-club"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">희망 일시</label>
                    <Input 
                      type="datetime-local" 
                      className="mt-1"
                      data-testid="input-match-datetime"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">경기 장소</label>
                    <Input 
                      placeholder="테니스 코트명" 
                      className="mt-1"
                      data-testid="input-match-location"
                    />
                  </div>
                </div>
                
                <Button className="w-full" data-testid="button-request-match">
                  <i className="fas fa-paper-plane mr-2" />
                  교류전 신청
                </Button>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <i className="fas fa-trophy mr-2 text-amber-600" />
                교류전 내역
              </h4>
              
              <div className="space-y-3">
                <div className="bg-background rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">vs 서울테니스클럽</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      승리
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    📅 2024년 11월 15일<br />
                    📍 올림픽 테니스장<br />
                    🏆 3-1 승리 (+15 ELO)
                  </p>
                </div>
                
                <div className="bg-background rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">vs 강남라켓클럽</span>
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      패배
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    📅 2024년 10월 28일<br />
                    📍 강남 스포츠센터<br />
                    💔 1-3 패배 (-12 ELO)
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}