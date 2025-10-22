import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore } from "@/hooks/use-firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "./LoadingSpinner";

interface PostCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function PostCreateModal({ isOpen, onClose, onPostCreated }: PostCreateModalProps) {
  const { appUser } = useAuth();
  const { addDocument } = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser || !formData.title.trim() || !formData.content.trim()) return;

    setLoading(true);
    try {
      await addDocument('posts', {
        authorId: appUser.id,
        title: formData.title.trim(),
        content: formData.content.trim(),
        likes: [],
        comments: [],
      });

      toast({
        title: "게시글 작성 완료",
        description: "새 게시글이 성공적으로 작성되었습니다.",
      });

      // 폼 초기화 및 모달 닫기
      setFormData({ title: '', content: '' });
      onPostCreated();
      onClose();
    } catch (error) {
      console.error("Post creation error:", error);
      toast({
        title: "게시글 작성 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ title: '', content: '' });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="modal-create-post">
      <div className="bg-background rounded-lg w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground" data-testid="text-modal-title">새 글 작성하기</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            data-testid="button-close-modal"
          >
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="게시글 제목을 입력하세요"
              disabled={loading}
              data-testid="input-post-title"
              className="w-full"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">내용 *</Label>
            <Textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="게시글 내용을 입력하세요..."
              disabled={loading}
              data-testid="textarea-post-content"
              className="w-full min-h-[200px] resize-none"
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.content.length}/1000
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
              data-testid="button-cancel-post"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.content.trim()}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-submit-post"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  작성중...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2" />
                  게시하기
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}