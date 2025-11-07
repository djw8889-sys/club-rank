import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardCheck, Plus } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Attendance() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clubId, setClubId] = useState("default-" + (user?.uid || ""));
  const [newAttendance, setNewAttendance] = useState({
    userId: "",
    eventName: "",
    eventDate: new Date().toISOString().slice(0, 10),
    status: "absent",
  });

  // 출석 기록 조회
  const { data: attendanceList, isLoading } = useQuery({
    queryKey: ["/api/attendance", clubId],
    enabled: !!token && !!clubId,
    queryFn: async () => {
      const res = await fetch(`/api/attendance/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("출석 조회 실패");
      return res.json();
    },
  });

  // 출석 기록 생성
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...data, clubId, eventDate: new Date(data.eventDate) }),
      });
      if (!res.ok) throw new Error("출석 생성 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance", clubId] });
      toast({
        title: "출석 기록 완료",
        description: "출석 기록이 성공적으로 생성되었습니다.",
      });
      setNewAttendance({
        userId: "",
        eventName: "",
        eventDate: new Date().toISOString().slice(0, 10),
        status: "absent",
      });
    },
    onError: () => {
      toast({
        title: "출석 기록 실패",
        description: "출석 기록 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 출석 상태 업데이트
  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/attendance/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("출석 업데이트 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance", clubId] });
      toast({
        title: "출석 상태 업데이트",
        description: "출석 상태가 업데이트되었습니다.",
      });
    },
  });

  const handleCreate = () => {
    if (!newAttendance.userId || !newAttendance.eventName) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newAttendance);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      present: { label: "출석", className: "bg-green-500" },
      absent: { label: "결석", className: "bg-red-500" },
      late: { label: "지각", className: "bg-yellow-500" },
      excused: { label: "사유있음", className: "bg-blue-500" },
    };
    const { label, className } = variants[status] || variants.absent;
    return <Badge className={className} data-testid={`badge-attendance-${status}`}>{label}</Badge>;
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ClipboardCheck className="text-primary" />
          출석 관리
        </h1>
        <p className="text-muted-foreground mt-2">클럽 행사의 출석을 관리하세요.</p>
      </div>

      {/* 출석 기록 생성 카드 */}
      <Card className="mb-6" data-testid="card-create-attendance">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus size={20} />
            출석 기록 추가
          </CardTitle>
          <CardDescription>회원의 행사 출석을 등록하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="회원 ID (예: user123)"
              value={newAttendance.userId}
              onChange={(e) => setNewAttendance({ ...newAttendance, userId: e.target.value })}
              data-testid="input-attendance-userid"
            />
            <Input
              placeholder="행사명 (예: 정기모임)"
              value={newAttendance.eventName}
              onChange={(e) => setNewAttendance({ ...newAttendance, eventName: e.target.value })}
              data-testid="input-attendance-eventname"
            />
            <Input
              type="date"
              value={newAttendance.eventDate}
              onChange={(e) => setNewAttendance({ ...newAttendance, eventDate: e.target.value })}
              data-testid="input-attendance-date"
            />
            <Select
              value={newAttendance.status}
              onValueChange={(value) => setNewAttendance({ ...newAttendance, status: value })}
            >
              <SelectTrigger data-testid="select-attendance-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">출석</SelectItem>
                <SelectItem value="absent">결석</SelectItem>
                <SelectItem value="late">지각</SelectItem>
                <SelectItem value="excused">사유있음</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="mt-4 w-full md:w-auto" 
            onClick={handleCreate}
            disabled={createMutation.isPending}
            data-testid="button-create-attendance"
          >
            <Plus size={16} className="mr-2" />
            {createMutation.isPending ? "기록 중..." : "출석 기록"}
          </Button>
        </CardContent>
      </Card>

      {/* 출석 목록 */}
      <Card data-testid="card-attendance-list">
        <CardHeader>
          <CardTitle>출석 기록</CardTitle>
          <CardDescription>
            총 {attendanceList?.length || 0}건의 출석 기록이 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceList && attendanceList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>회원 ID</TableHead>
                  <TableHead>행사명</TableHead>
                  <TableHead>행사 날짜</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceList.map((attendance: any) => (
                  <TableRow key={attendance.id} data-testid={`row-attendance-${attendance.id}`}>
                    <TableCell data-testid={`text-attendance-userid-${attendance.id}`}>
                      {attendance.userId}
                    </TableCell>
                    <TableCell>{attendance.eventName}</TableCell>
                    <TableCell>
                      {new Date(attendance.eventDate).toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell>{getStatusBadge(attendance.status)}</TableCell>
                    <TableCell>
                      <Select
                        value={attendance.status}
                        onValueChange={(value) =>
                          updateMutation.mutate({ id: attendance.id, status: value })
                        }
                      >
                        <SelectTrigger className="w-32" data-testid={`select-update-status-${attendance.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">출석</SelectItem>
                          <SelectItem value="absent">결석</SelectItem>
                          <SelectItem value="late">지각</SelectItem>
                          <SelectItem value="excused">사유있음</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8" data-testid="text-no-attendance">
              등록된 출석 기록이 없습니다.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
