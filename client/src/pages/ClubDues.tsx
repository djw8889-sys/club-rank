import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Plus, Check, X } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ClubDues() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clubId, setClubId] = useState("default-" + (user?.uid || ""));
  const [newDues, setNewDues] = useState({
    userId: "",
    amount: "",
    dueMonth: new Date().toISOString().slice(0, 7),
  });

  // 회비 목록 조회
  const { data: duesList, isLoading } = useQuery({
    queryKey: ["/api/dues", clubId],
    enabled: !!token && !!clubId,
    queryFn: async () => {
      const res = await fetch(`/api/dues/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("회비 조회 실패");
      return res.json();
    },
  });

  // 회비 생성
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/dues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...data, clubId }),
      });
      if (!res.ok) throw new Error("회비 생성 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dues", clubId] });
      toast({
        title: "회비 생성 완료",
        description: "회비가 성공적으로 생성되었습니다.",
      });
      setNewDues({ userId: "", amount: "", dueMonth: new Date().toISOString().slice(0, 7) });
    },
    onError: () => {
      toast({
        title: "회비 생성 실패",
        description: "회비 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 회비 상태 업데이트
  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/dues/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, paidAt: status === "paid" ? new Date() : null }),
      });
      if (!res.ok) throw new Error("회비 업데이트 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dues", clubId] });
      toast({
        title: "회비 상태 업데이트",
        description: "회비 상태가 업데이트되었습니다.",
      });
    },
  });

  const handleCreate = () => {
    if (!newDues.userId || !newDues.amount) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate({
      userId: newDues.userId,
      amount: parseInt(newDues.amount),
      dueMonth: newDues.dueMonth,
      status: "pending",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      paid: { label: "납부완료", className: "bg-green-500" },
      pending: { label: "미납", className: "bg-yellow-500" },
      overdue: { label: "연체", className: "bg-red-500" },
    };
    const { label, className } = variants[status] || variants.pending;
    return <Badge className={className} data-testid={`badge-dues-${status}`}>{label}</Badge>;
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
          <DollarSign className="text-primary" />
          회비 관리
        </h1>
        <p className="text-muted-foreground mt-2">클럽 회비를 관리하고 납부 현황을 확인하세요.</p>
      </div>

      {/* 회비 생성 카드 */}
      <Card className="mb-6" data-testid="card-create-dues">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus size={20} />
            새 회비 추가
          </CardTitle>
          <CardDescription>회원의 회비를 등록하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="회원 ID (예: user123)"
              value={newDues.userId}
              onChange={(e) => setNewDues({ ...newDues, userId: e.target.value })}
              data-testid="input-dues-userid"
            />
            <Input
              type="number"
              placeholder="금액 (원)"
              value={newDues.amount}
              onChange={(e) => setNewDues({ ...newDues, amount: e.target.value })}
              data-testid="input-dues-amount"
            />
            <Input
              type="month"
              value={newDues.dueMonth}
              onChange={(e) => setNewDues({ ...newDues, dueMonth: e.target.value })}
              data-testid="input-dues-month"
            />
          </div>
          <Button 
            className="mt-4 w-full md:w-auto" 
            onClick={handleCreate}
            disabled={createMutation.isPending}
            data-testid="button-create-dues"
          >
            <Plus size={16} className="mr-2" />
            {createMutation.isPending ? "생성 중..." : "회비 추가"}
          </Button>
        </CardContent>
      </Card>

      {/* 회비 목록 */}
      <Card data-testid="card-dues-list">
        <CardHeader>
          <CardTitle>회비 목록</CardTitle>
          <CardDescription>
            총 {duesList?.length || 0}건의 회비 기록이 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {duesList && duesList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>회원 ID</TableHead>
                  <TableHead>금액</TableHead>
                  <TableHead>납부월</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duesList.map((dues: any) => (
                  <TableRow key={dues.id} data-testid={`row-dues-${dues.id}`}>
                    <TableCell data-testid={`text-dues-userid-${dues.id}`}>{dues.userId}</TableCell>
                    <TableCell data-testid={`text-dues-amount-${dues.id}`}>
                      {dues.amount?.toLocaleString()}원
                    </TableCell>
                    <TableCell>{dues.dueMonth}</TableCell>
                    <TableCell>{getStatusBadge(dues.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {dues.status !== "paid" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateMutation.mutate({ id: dues.id, status: "paid" })}
                            disabled={updateMutation.isPending}
                            data-testid={`button-mark-paid-${dues.id}`}
                          >
                            <Check size={16} className="mr-1" />
                            납부 완료
                          </Button>
                        )}
                        {dues.status === "pending" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateMutation.mutate({ id: dues.id, status: "overdue" })}
                            disabled={updateMutation.isPending}
                            data-testid={`button-mark-overdue-${dues.id}`}
                          >
                            <X size={16} className="mr-1" />
                            연체
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8" data-testid="text-no-dues">
              등록된 회비가 없습니다.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
