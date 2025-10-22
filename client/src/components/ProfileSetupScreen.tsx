import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore } from "@/hooks/use-firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getAvatarSrc } from "@/utils/avatar";
import { HelpCircle, Info, Check, Camera } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

interface ProfileSetupScreenProps {
  onComplete: () => void;
}

export default function ProfileSetupScreen({ onComplete }: ProfileSetupScreenProps) {
  const { user, updateAppUser } = useAuth();
  const { uploadFile } = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(user?.photoURL || getAvatarSrc(null, { id: user?.uid || undefined, username: user?.displayName || undefined, email: user?.email || undefined }, 300));
  const [showNtrpGuide, setShowNtrpGuide] = useState(false);

  const [formData, setFormData] = useState({
    username: user?.displayName || '',
    ntrp: '3.5',
    age: '',
    region: '',
    bio: '',
    availableTimes: [] as string[],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePic(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleTimeToggle = (time: string) => {
    setFormData(prev => ({
      ...prev,
      availableTimes: prev.availableTimes.includes(time)
        ? prev.availableTimes.filter(t => t !== time)
        : [...prev.availableTimes, time]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let photoURL = user.photoURL;

      if (profilePic) {
        photoURL = await uploadFile(profilePic, `profile_pics/${user.uid}/${profilePic.name}`);
      }

      const userData = {
        id: user.uid,
        email: user.email!,
        username: formData.username,
        ntrp: formData.ntrp,
        age: formData.age,
        region: formData.region,
        bio: formData.bio,
        availableTimes: formData.availableTimes,
        photoURL,
        points: 100,
        wins: 0,
        losses: 0,
        mannerScore: 5, // 기본 매너 점수
        isProfileComplete: true, // 프로필 설정 완료
      };

      await updateAppUser(userData);
      
      toast({
        title: "프로필 설정 완료",
        description: "이제 클럽 활동을 시작할 수 있습니다!",
      });

      onComplete();
    } catch (error) {
      console.error("Profile setup error:", error);
      toast({
        title: "오류 발생",
        description: "프로필 설정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const timeOptions = ['평일 오전', '평일 오후', '주말 오전', '주말 오후'];

  const ntrpGuides = {
    '2.5': '이제 막 공을 맞히기 시작했으며, 공이 어디로 갈지 예측하는 법을 배우는 단계입니다.',
    '3.0': '중간 속도의 공을 꽤 일관적으로 칠 수 있지만, 아직 다양한 기술과 방향 제어는 부족합니다.',
    '3.5': '안정적인 스트로크와 방향 제어가 가능하며, 네트 플레이에도 자신감이 붙는 단계입니다.',
    '4.0': '거의 모든 스트로크를 안정적으로 구사하며, 경기의 흐름을 읽고 전략을 사용할 줄 압니다.',
    '4.5': '강력한 서브와 스트로크를 가지며, 상대방을 압도할 수 있는 무기를 가진 상급 동호인입니다.',
    '5.0': '모든 기술을 완벽하게 구사하며, 토너먼트 수준의 실력을 가진 준전문가급 선수입니다.'
  };

  return (
    <div className="min-h-screen flex flex-col overflow-y-auto" data-testid="profile-setup-screen">
      <div className="bg-gradient-to-r from-primary to-emerald-600 px-6 pt-12 pb-8">
        <h1 className="text-2xl font-bold text-white mb-2">프로필 설정</h1>
        <p className="text-emerald-100">매칭을 위한 기본 정보를 입력해주세요</p>
      </div>
      
      <div className="flex-1 p-6 -mt-4 bg-background rounded-t-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center -mt-12">
            <div className="relative">
              <img 
                src={previewUrl}
                alt="Profile picture" 
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                data-testid="img-profile-preview"
              />
              <label htmlFor="profile-pic" className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors cursor-pointer">
                <Camera className="w-4 h-4" />
              </label>
            </div>
            <Label htmlFor="profile-pic" className="mt-3 text-sm font-medium text-primary cursor-pointer hover:underline">
              사진 변경
            </Label>
            <Input
              type="file"
              id="profile-pic"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              data-testid="input-profile-pic"
            />
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="username" className="block text-sm font-semibold text-foreground mb-2">
                닉네임
              </Label>
              <Input
                type="text"
                id="username"
                placeholder="매치에서 사용할 닉네임"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full p-4 border border-input rounded-xl bg-background focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                required
                data-testid="input-username"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="ntrp" className="text-sm font-semibold text-foreground">
                    NTRP
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNtrpGuide(true)}
                    className="w-6 h-6 p-0 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                    data-testid="button-ntrp-guide"
                  >
                    <HelpCircle className="w-3 h-3" />
                  </Button>
                </div>
                <select
                  id="ntrp"
                  value={formData.ntrp}
                  onChange={(e) => setFormData(prev => ({ ...prev, ntrp: e.target.value }))}
                  className="w-full p-4 border border-input rounded-xl bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
                  required
                  data-testid="select-ntrp"
                >
                  <option value="2.5">2.5 - 초급</option>
                  <option value="3.0">3.0 - 초중급</option>
                  <option value="3.5">3.5 - 중급</option>
                  <option value="4.0">4.0 - 중상급</option>
                  <option value="4.5">4.5 - 상급</option>
                  <option value="5.0">5.0 - 고급</option>
                </select>
              </div>
              <div>
                <Label htmlFor="age" className="block text-sm font-semibold text-foreground mb-2">
                  연령대
                </Label>
                <select
                  id="age"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  className="w-full p-4 border border-input rounded-xl bg-background focus:ring-2 focus:ring-ring focus:border-transparent"
                  required
                  data-testid="select-age"
                >
                  <option value="">선택하세요</option>
                  <option value="20s">20대</option>
                  <option value="30s">30대</option>
                  <option value="40s">40대</option>
                  <option value="50s">50대 이상</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="region" className="block text-sm font-semibold text-foreground mb-2">
                주요 활동 지역
              </Label>
              <Input
                type="text"
                id="region"
                placeholder="예: 서울 강남구"
                value={formData.region}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                className="w-full p-4 border border-input rounded-xl bg-background focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                required
                data-testid="input-region"
              />
            </div>

            {/* Available Times */}
            <div>
              <Label className="block text-sm font-semibold text-foreground mb-3">
                선호 활동 시간 (복수선택 가능)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {timeOptions.map((time) => (
                  <label
                    key={time}
                    className={`flex items-center space-x-3 p-4 border border-input rounded-xl cursor-pointer hover:bg-muted transition-colors ${
                      formData.availableTimes.includes(time) 
                        ? 'bg-primary/10 border-primary' 
                        : ''
                    }`}
                    data-testid={`label-time-${time.replace(/\s+/g, '-')}`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.availableTimes.includes(time)}
                      onChange={() => handleTimeToggle(time)}
                      className="w-4 h-4 text-primary rounded focus:ring-ring"
                      data-testid={`checkbox-time-${time.replace(/\s+/g, '-')}`}
                    />
                    <span className="text-sm font-medium">{time}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bio Section */}
            <div>
              <Label htmlFor="bio" className="block text-sm font-semibold text-foreground mb-2">
                자기소개 (선택)
              </Label>
              <Textarea
                id="bio"
                rows={3}
                placeholder="테니스 경험이나 매칭 시 희망사항을 간단히 적어주세요"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full p-4 border border-input rounded-xl bg-background focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none"
                data-testid="textarea-bio"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
            data-testid="button-save-profile"
          >
            {loading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            프로필 저장하고 시작하기
          </Button>
        </form>
      </div>

      {/* NTRP 가이드 모달 */}
      <Dialog open={showNtrpGuide} onOpenChange={setShowNtrpGuide}>
        <DialogContent className="max-w-lg" data-testid="modal-ntrp-guide">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              NTRP 레벨 가이드
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              자신의 실력에 맞는 NTRP 레벨을 선택해주세요. 정확한 레벨 선택은 적절한 상대와의 매칭에 도움이 됩니다.
            </p>
            <div className="space-y-3">
              {Object.entries(ntrpGuides).map(([level, description]) => (
                <div key={level} className="p-3 bg-muted rounded-lg" data-testid={`ntrp-guide-${level}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                      NTRP {level}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {level === '2.5' ? '초급' : 
                       level === '3.0' ? '초중급' : 
                       level === '3.5' ? '중급' : 
                       level === '4.0' ? '중상급' : 
                       level === '4.5' ? '상급' : '고급'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button 
                onClick={() => setShowNtrpGuide(false)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-close-ntrp-guide"
              >
                확인
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
