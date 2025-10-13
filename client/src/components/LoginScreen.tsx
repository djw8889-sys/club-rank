import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import ClubRankLogo from "./ClubRankLogo";
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
      
      // Show user-friendly error message
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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white" data-testid="login-screen">
      {/* Hero section with logo */}
      <div className="h-1/2 bg-gradient-to-br from-primary via-lime-400 to-accent relative flex flex-col items-center justify-center overflow-hidden">
        {/* Animated Tennis Balls Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-6xl animate-bounce">🎾</div>
          <div className="absolute top-20 right-20 text-4xl animate-pulse">🎾</div>
          <div className="absolute bottom-20 left-20 text-5xl animate-bounce delay-100">🎾</div>
        </div>
        <div className="text-center text-white">
          <ClubRankLogo size="xl" variant="white" className="mx-auto mb-6 bg-white/20" />
          <h1 className="text-5xl font-black mb-3 tracking-tight drop-shadow-lg">ClubRank</h1>
          <p className="text-white/90 text-xl font-medium">테니스 클럽 관리의 모든 것</p>
        </div>
      </div>
      
      <div className="flex-1 p-6 flex flex-col justify-center bg-white">
        <div className="space-y-4 mb-8">
          <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-primary/10 to-transparent rounded-xl">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <i className="fas fa-users text-primary text-xl" />
            </div>
            <div>
              <p className="font-semibold text-foreground">클럽 간 교류전 & 랭킹</p>
              <p className="text-xs text-muted-foreground">실시간 ELO 랭킹 시스템</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-accent/10 to-transparent rounded-xl">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
              <i className="fas fa-trophy text-accent text-xl" />
            </div>
            <div>
              <p className="font-semibold text-foreground">자동 대진표 & 통계</p>
              <p className="text-xs text-muted-foreground">데이터 기반 클럽 관리</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-lime-400 hover:from-lime-400 hover:to-primary text-accent font-bold py-4 rounded-2xl flex items-center justify-center shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-105 transform"
            data-testid="button-google-login"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
            ) : (
              <i className="fab fa-google mr-3" />
            )}
            {loading ? "로그인 중..." : "구글로 시작하기"}
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-6 text-center leading-relaxed">
          서비스 이용을 위해 개인정보 처리방침과<br />
          이용약관에 동의가 필요합니다.
        </p>
        
        <FirebaseSetupGuide />
      </div>
    </div>
  );
}
