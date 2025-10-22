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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import LoadingSpinner from "./LoadingSpinner";

interface ClubMember {
  id: number;
  userId: string;
  clubId: number;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  isActive: boolean;
}

interface BracketGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: number;
  members: ClubMember[];
}

const bracketSchema = z.object({
  playersPerCourt: z.number().min(2, "코트당 최소 2명이 필요합니다.").max(6, "코트당 최대 6명까지 가능합니다."),
  gameFormat: z.enum(['mens_singles', 'womens_singles', 'mens_doubles', 'womens_doubles', 'mixed_doubles']),
  genderComposition: z.enum(['all', 'male_only', 'female_only', 'mixed']),
  selectedMembers: z.array(z.number()).min(4, "최소 4명 이상 선택해야 합니다."),
});

type BracketFormData = z.infer<typeof bracketSchema>;

interface GeneratedMatch {
  id: string;
  court: number;
  players: string[];
  gameFormat: string;
}

const GAME_FORMAT_LABELS = {
  mens_singles: "남자 단식",
  womens_singles: "여자 단식", 
  mens_doubles: "남자 복식",
  womens_doubles: "여자 복식",
  mixed_doubles: "혼합 복식"
};

const GENDER_LABELS = {
  all: "전체",
  male_only: "남성만",
  female_only: "여성만", 
  mixed: "혼성"
};

export default function BracketGeneratorModal({ isOpen, onClose, clubId, members }: BracketGeneratorModalProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMatches, setGeneratedMatches] = useState<GeneratedMatch[]>([]);
  const [showResults, setShowResults] = useState(false);

  const form = useForm<BracketFormData>({
    resolver: zodResolver(bracketSchema),
    defaultValues: {
      playersPerCourt: 4,
      gameFormat: 'mens_doubles',
      genderComposition: 'all',
      selectedMembers: [],
    },
  });

  const selectedMembers = form.watch('selectedMembers');
  const playersPerCourt = form.watch('playersPerCourt');

  const handleMemberToggle = (memberId: number, checked: boolean) => {
    const current = selectedMembers;
    if (checked) {
      form.setValue('selectedMembers', [...current, memberId]);
    } else {
      form.setValue('selectedMembers', current.filter(id => id !== memberId));
    }
  };

  const generateRandomBracket = (playerIds: number[], playersPerCourt: number): GeneratedMatch[] => {
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    const matches: GeneratedMatch[] = [];
    
    let courtNumber = 1;
    for (let i = 0; i < shuffled.length; i += playersPerCourt) {
      const courtPlayers = shuffled.slice(i, i + playersPerCourt);
      if (courtPlayers.length === playersPerCourt) {
        matches.push({
          id: `match-${courtNumber}`,
          court: courtNumber,
          players: courtPlayers.map(id => `멤버 ${id}`),
          gameFormat: form.getValues('gameFormat'),
        });
        courtNumber++;
      }
    }
    
    return matches;
  };

  const onSubmit = async (data: BracketFormData) => {
    try {
      setIsGenerating(true);
      
      // 대진표 생성 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const matches = generateRandomBracket(data.selectedMembers, data.playersPerCourt);
      setGeneratedMatches(matches);
      setShowResults(true);
      
      toast({
        title: "대진표 생성 완료",
        description: `${matches.length}개 코트의 대진표가 생성되었습니다.`,
      });
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "대진표 생성 중 오류가 발생했습니다.";
      toast({
        title: "생성 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setShowResults(false);
    setGeneratedMatches([]);
    form.reset();
    onClose();
  };

  const estimatedCourts = Math.floor(selectedMembers.length / playersPerCourt);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span className="text-2xl">🎯</span>
            <span>자동 대진표 생성</span>
          </DialogTitle>
          <DialogDescription>
            참석자와 경기 방식을 선택하면 랜덤으로 대진표를 생성합니다.
          </DialogDescription>
        </DialogHeader>

        {!showResults ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 경기 설정 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">경기 설정</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="playersPerCourt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>코트당 인원</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value.toString()}
                            onValueChange={(value) => field.onChange(parseInt(value))}
                          >
                            <SelectTrigger data-testid="select-players-per-court">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2">2명 (단식)</SelectItem>
                              <SelectItem value="4">4명 (복식)</SelectItem>
                              <SelectItem value="6">6명 (3vs3)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gameFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>경기 방식</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger data-testid="select-game-format">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(GAME_FORMAT_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="genderComposition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>성별 구성</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger data-testid="select-gender-composition">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(GENDER_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 참석자 선택 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">참석자 선택</h3>
                  <div className="text-sm text-muted-foreground">
                    {selectedMembers.length}명 선택 | 예상 코트: {estimatedCourts}개
                  </div>
                </div>
                
                <div className="max-h-64 overflow-y-auto border rounded-lg p-4 space-y-2">
                  {members.map((member) => (
                    <div 
                      key={member.id} 
                      className="flex items-center space-x-3 p-2 hover:bg-muted rounded-lg"
                    >
                      <Checkbox
                        checked={selectedMembers.includes(member.id)}
                        onCheckedChange={(checked) => handleMemberToggle(member.id, checked as boolean)}
                        data-testid={`checkbox-member-${member.id}`}
                      />
                      <div className="flex-1">
                        <div className="font-medium">멤버 {member.id}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(member.joinedAt).toLocaleDateString()} 가입
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {member.role === 'owner' ? '클럽장' : member.role === 'admin' ? '관리자' : '멤버'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isGenerating || selectedMembers.length < 4}
                data-testid="button-generate-bracket"
              >
                {isGenerating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    대진표 생성 중...
                  </>
                ) : (
                  <>
                    <i className="fas fa-random mr-2" />
                    대진표 생성
                  </>
                )}
              </Button>
            </form>
          </Form>
        ) : (
          /* 생성된 대진표 결과 */
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">🎉 대진표 생성 완료!</h3>
              <p className="text-muted-foreground">
                총 {generatedMatches.length}개 코트의 대진이 완성되었습니다.
              </p>
            </div>

            <div className="space-y-4">
              {generatedMatches.map((match) => (
                <div 
                  key={match.id} 
                  className="bg-muted rounded-lg p-4"
                  data-testid={`generated-match-${match.court}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">코트 {match.court}번</h4>
                    <Badge variant="outline">
                      {GAME_FORMAT_LABELS[match.gameFormat as keyof typeof GAME_FORMAT_LABELS]}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {match.players.map((player, index) => (
                      <div 
                        key={index}
                        className="bg-background rounded p-2 text-center text-sm font-medium"
                      >
                        {player}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowResults(false)}
                data-testid="button-regenerate"
              >
                <i className="fas fa-redo mr-2" />
                다시 생성
              </Button>
              <Button 
                className="flex-1"
                onClick={handleClose}
                data-testid="button-save-bracket"
              >
                <i className="fas fa-save mr-2" />
                저장하고 닫기
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}