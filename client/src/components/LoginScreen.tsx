import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import FirebaseSetupGuide from "./FirebaseSetupGuide";

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Login failed:", error);
      
      let errorMessage = "로그인에 실패했습니다. 다시 시도해주세요.";
      
      if (error?.code === 'auth/unauthorized-domain') {
        errorMessage = "현재 도메인이 승인되지 않았습니다. Firebase 콘솔에서 도메인을 추가해야 합니다.";
      } else if (error?.code === 'auth/operation-not-allowed') {
        errorMessage = "Google 로그인이 비활성화되어 있습니다. Firebase 콘솔에서 Google 인증 제공업체를 활성화해주세요.";
      } else if (error?.code === 'auth/popup-blocked') {
        errorMessage = "팝업이 차단되었습니다. 브라우저 설정을 확인하거나 페이지를 새로고침해주세요.";
      } else if (error?.code === 'auth/popup-closed-by-user') {
        errorMessage = "로그인이 취소되었습니다. 다시 시도해주세요.";
      } else if (error?.code === 'auth/cancelled-popup-request') {
        errorMessage = "다른 로그인 팝업이 이미 열려있습니다. 잠시 후 다시 시도해주세요.";
      } else if (error?.code === 'auth/network-request-failed') {
        errorMessage = "네트워크 연결을 확인해주세요.";
      }
      
      toast({
        title: "로그인 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f2f4f6]" data-testid="login-screen">
      {/* Header with Logo */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo Area */}
          <div className="text-center mb-8">
            {/* ClubRank Logo - Tennis Ball + Ranking Arrow */}
            <div className="inline-block mb-4">
              <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                {/* Tennis Ball */}
                <circle cx="60" cy="60" r="45" fill="#0d924a" />
                <circle cx="60" cy="60" r="40" fill="none" stroke="#f2f4f6" strokeWidth="3" />
                {/* Tennis Ball Lines */}
                <path d="M 25 60 Q 40 35, 60 30" fill="none" stroke="#f2f4f6" strokeWidth="3" />
                <path d="M 95 60 Q 80 85, 60 90" fill="none" stroke="#f2f4f6" strokeWidth="3" />
                {/* Ranking Arrow */}
                <g transform="translate(75, 25)">
                  <path d="M 0 20 L 0 -10 L -8 -2 M 0 -10 L 8 -2" 
                        stroke="#0a6233" strokeWidth="4" fill="none" strokeLinecap="round"/>
                  <circle cx="0" cy="25" r="3" fill="#0a6233" />
                  <circle cx="0" cy="35" r="3" fill="#0a6233" opacity="0.6" />
                </g>
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-[#333333] mb-2">ClubRank</h1>
            <p className="text-lg text-[#666666] font-medium">테니스 클럽 관리의 새로운 기준</p>
          </div>

          {/* Login Button */}
          <div className="space-y-4 mb-8">
            <Button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-[#0d924a] hover:bg-[#0a6233] text-white font-semibold py-6 rounded-lg shadow-md transition-colors duration-200"
              data-testid="button-google-login"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                  로그인 중...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <i className="fab fa-google mr-3 text-lg" />
                  구글로 시작하기
                </div>
              )}
            </Button>
          </div>

          {/* Service Description */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-center text-[#333333] font-bold text-lg mb-4">
              클럽랭크는 무엇인가요?
            </h3>
            <p className="text-center text-[#666666] leading-relaxed mb-6">
              전국 테니스 동호회를 연결하고,<br />
              클럽 간 랭킹 경쟁을 통해<br />
              즐거운 커뮤니티 문화를 만듭니다.
            </p>
            
            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-[#0d924a]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-trophy text-[#0d924a]" />
                </div>
                <div>
                  <p className="font-semibold text-[#333333] text-sm">클럽 랭킹 시스템</p>
                  <p className="text-xs text-[#666666]">CP 기반 실시간 순위 업데이트</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-[#0d924a]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-users text-[#0d924a]" />
                </div>
                <div>
                  <p className="font-semibold text-[#333333] text-sm">교류전 관리</p>
                  <p className="text-xs text-[#666666]">자동 대진표 & 경기 일정</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-[#0d924a]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-chart-line text-[#0d924a]" />
                </div>
                <div>
                  <p className="font-semibold text-[#333333] text-sm">데이터 분석</p>
                  <p className="text-xs text-[#666666]">경기 형식별 통계 & 트렌드</p>
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-[#999999] mt-6 text-center leading-relaxed">
            서비스 이용을 위해 개인정보 처리방침과<br />
            이용약관에 동의가 필요합니다.
          </p>
        </div>
      </div>

      <FirebaseSetupGuide />
    </div>
  );
}
