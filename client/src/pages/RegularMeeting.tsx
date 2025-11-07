import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Plus, UserPlus, UserMinus } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function RegularMeeting() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clubId, setClubId] = useState("default-" + (user?.uid || ""));
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    description: "",
    meetingDate: "",
    location: "",
    maxParticipants: "",
  });

  // 모임 목록 조회
  const { data: meetingsList, isLoading } = useQuery({
    queryKey: ["/api/meetings", clubId],
    enabled: !!token && !!clubId,
    queryFn: async () => {
      const res = await fetch(`/api/meetings/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("모임 조회 실패");
      return res.json();
    },
  });

  // 모임 생성
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          clubId,
          meetingDate: new Date(data.meetingDate),
          maxParticipants: data.maxParticipants ? parseInt(data.maxParticipants) : null,
        }),
      });
      if (!res.ok) throw new Error("모임 생성 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", clubId] });
      toast({
        title: "모임 생성 완료",
        description: "정기모임이 성공적으로 생성되었습니다.",
      });
      setNewMeeting({
        title: "",
        description: "",
        meetingDate: "",
        location: "",
        maxParticipants: "",
      });
      setShowCreateForm(false);
    },
    onError: () => {
      toast({
        title: "모임 생성 실패",
        description: "모임 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 모임 참가
  const joinMutation = useMutation({
    mutationFn: async (meetingId: number) => {
      const res = await fetch(`/api/meetings/${meetingId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("모임 참가 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", clubId] });
      toast({
        title: "참가 완료",
        description: "모임에 참가했습니다.",
      });
    },
    onError: () => {
      toast({
        title: "참가 실패",
        description: "정원이 초과되었거나 이미 참가한 모임입니다.",
        variant: "destructive",
      });
    },
  });

  // 모임 참가 취소
  const leaveMutation = useMutation({
    mutationFn: async (meetingId: number) => {
      const res = await fetch(`/api/meetings/${meetingId}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("참가 취소 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings", clubId] });
      toast({
        title: "참가 취소",
        description: "모임 참가를 취소했습니다.",
      });
    },
  });

  const handleCreate = () => {
    if (!newMeeting.title || !newMeeting.meetingDate) {
      toast({
        title: "입력 오류",
        description: "제목과 날짜는 필수입니다.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newMeeting);
  };

  const isUserParticipant = (meeting: any) => {
    return meeting.participants?.includes(user?.uid);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      scheduled: { label: "예정", className: "bg-blue-500" },
      completed: { label: "완료", className: "bg-green-500" },
      cancelled: { label: "취소됨", className: "bg-red-500" },
    };
    const { label, className } = variants[status] || variants.scheduled;
    return <Badge className={className}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="text-primary" />
            정기모임 관리
          </h1>
          <p className="text-muted-foreground mt-2">클럽 정기모임을 관리하세요.</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          data-testid="button-toggle-create-form"
        >
          <Plus size={16} className="mr-2" />
          {showCreateForm ? "폼 닫기" : "모임 생성"}
        </Button>
      </div>

      {/* 모임 생성 폼 */}
      {showCreateForm && (
        <Card className="mb-6" data-testid="card-create-meeting">
          <CardHeader>
            <CardTitle>새 모임 생성</CardTitle>
            <CardDescription>정기모임 정보를 입력하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="모임 제목"
              value={newMeeting.title}
              onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
              data-testid="input-meeting-title"
            />
            <Textarea
              placeholder="모임 설명"
              value={newMeeting.description}
              onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
              data-testid="input-meeting-description"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="datetime-local"
                value={newMeeting.meetingDate}
                onChange={(e) => setNewMeeting({ ...newMeeting, meetingDate: e.target.value })}
                data-testid="input-meeting-date"
              />
              <Input
                placeholder="장소"
                value={newMeeting.location}
                onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                data-testid="input-meeting-location"
              />
              <Input
                type="number"
                placeholder="최대 인원 (선택)"
                value={newMeeting.maxParticipants}
                onChange={(e) => setNewMeeting({ ...newMeeting, maxParticipants: e.target.value })}
                data-testid="input-meeting-maxparticipants"
              />
            </div>
            <Button 
              onClick={handleCreate} 
              disabled={createMutation.isPending}
              data-testid="button-submit-meeting"
            >
              {createMutation.isPending ? "생성 중..." : "모임 생성"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 모임 목록 */}
      <div className="grid gap-6">
        {meetingsList && meetingsList.length > 0 ? (
          meetingsList.map((meeting: any) => (
            <Card key={meeting.id} data-testid={`card-meeting-${meeting.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl" data-testid={`text-meeting-title-${meeting.id}`}>
                      {meeting.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {meeting.description || "설명 없음"}
                    </CardDescription>
                  </div>
                  {getStatusBadge(meeting.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-muted-foreground" />
                    <span>{new Date(meeting.meetingDate).toLocaleString("ko-KR")}</span>
                  </div>
                  {meeting.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={16} className="text-muted-foreground" />
                      <span>{meeting.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={16} className="text-muted-foreground" />
                    <span>
                      참가자: {meeting.participants?.length || 0}명
                      {meeting.maxParticipants && ` / ${meeting.maxParticipants}명`}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {isUserParticipant(meeting) ? (
                      <Button
                        variant="outline"
                        onClick={() => leaveMutation.mutate(meeting.id)}
                        disabled={leaveMutation.isPending}
                        data-testid={`button-leave-meeting-${meeting.id}`}
                      >
                        <UserMinus size={16} className="mr-2" />
                        참가 취소
                      </Button>
                    ) : (
                      <Button
                        onClick={() => joinMutation.mutate(meeting.id)}
                        disabled={joinMutation.isPending}
                        data-testid={`button-join-meeting-${meeting.id}`}
                      >
                        <UserPlus size={16} className="mr-2" />
                        참가하기
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground" data-testid="text-no-meetings">
                등록된 정기모임이 없습니다.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
