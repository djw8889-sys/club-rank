import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateClub } from "@/hooks/use-clubs";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "./LoadingSpinner";

const clubCreationSchema = z.object({
  name: z.string().min(2, "클럽명은 2글자 이상이어야 합니다.").max(50, "클럽명은 50글자 이하여야 합니다."),
  region: z.string().min(1, "지역을 선택해주세요."),
  description: z.string().max(500, "소개글은 500글자 이하여야 합니다.").optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "올바른 색상 코드를 입력해주세요.").optional(),
});

type ClubCreationFormData = z.infer<typeof clubCreationSchema>;

interface ClubCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REGIONS = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시", 
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원도", 
  "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", 
  "경상남도", "제주특별자치도"
];

export default function ClubCreationModal({ isOpen, onClose }: ClubCreationModalProps) {
  const { toast } = useToast();
  const createClubMutation = useCreateClub();

  const form = useForm<ClubCreationFormData>({
    resolver: zodResolver(clubCreationSchema),
    defaultValues: {
      name: "",
      region: "",
      description: "",
      primaryColor: "#22c55e",
    },
  });

  const onSubmit = async (data: ClubCreationFormData) => {
    try {
      await createClubMutation.mutateAsync(data);
      
      toast({
        title: "클럽 생성 완료",
        description: `${data.name} 클럽이 성공적으로 생성되었습니다!`,
      });
      
      form.reset();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "클럽 생성 중 오류가 발생했습니다.";
      toast({
        title: "클럽 생성 실패",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span className="text-2xl">🏠</span>
            <span>새 클럽 만들기</span>
          </DialogTitle>
          <DialogDescription>
            당신의 테니스 클럽을 만들어 멤버들과 함께 활동해보세요.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>클럽명 *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="예: 서울테니스클럽"
                      data-testid="input-club-name"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>활동 지역 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-club-region">
                        <SelectValue placeholder="지역을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>클럽 소개</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="클럽에 대한 간단한 소개를 작성해주세요..."
                      className="min-h-[80px]"
                      data-testid="textarea-club-description"
                      {...field} 
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
                  <FormLabel>클럽 컬러</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-3">
                      <Input 
                        type="color"
                        className="w-12 h-10 p-1 rounded cursor-pointer"
                        data-testid="input-club-color"
                        {...field} 
                      />
                      <Input 
                        placeholder="#22c55e"
                        className="flex-1"
                        data-testid="input-club-color-text"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                data-testid="button-cancel-club-creation"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={createClubMutation.isPending}
                className="flex-1"
                data-testid="button-create-club"
              >
                {createClubMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    생성 중...
                  </>
                ) : (
                  "클럽 만들기"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}