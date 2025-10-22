import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import SplashScreen from "@/components/SplashScreen";
import LoginScreen from "@/components/LoginScreen";
import ProfileSetupScreen from "@/components/ProfileSetupScreen";
import MainApp from "@/components/MainApp";
import ChatScreen from "@/components/ChatScreen";
import LoadingSpinner from "@/components/LoadingSpinner";

type ViewState = 'splash' | 'login' | 'profile-setup' | 'main' | 'chat';

export default function Home() {
  const { user, appUser, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('splash');

  // 디버깅을 위한 로그 추가
  console.log('🏠 Home component render:', { 
    loading, 
    hasUser: !!user, 
    hasAppUser: !!appUser, 
    currentView,
    profileComplete: appUser?.isProfileComplete 
  });

  useEffect(() => {
    console.log('🔄 Home useEffect triggered:', { loading, hasUser: !!user, hasAppUser: !!appUser });
    
    if (loading) {
      console.log('⏳ Still loading, staying in current view:', currentView);
      return;
    }

    if (!user) {
      console.log('🔑 No user, switching to login');
      setCurrentView('login');
    } else if (!appUser || appUser.isProfileComplete === false) {
      console.log('👤 User exists but profile incomplete, switching to profile-setup');
      setCurrentView('profile-setup');
    } else {
      console.log('✅ User and profile complete, switching to main');
      setCurrentView('main');
    }
  }, [user, appUser, loading]);

  const handleSplashComplete = () => {
    if (!user) {
      setCurrentView('login');
    } else if (!appUser || appUser.isProfileComplete === false) {
      setCurrentView('profile-setup');
    } else {
      setCurrentView('main');
    }
  };

  const handleProfileComplete = () => {
    setCurrentView('main');
  };

  const handleChatOpen = () => {
    setCurrentView('chat');
  };

  const handleChatBack = () => {
    setCurrentView('main');
  };

  if (loading) {
    console.log('🎡 Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <LoadingSpinner size="lg" text="앱 초기화 중..." />
      </div>
    );
  }

  console.log('🎨 Rendering main UI with currentView:', currentView);

  return (
    <div className="container mx-auto max-w-md min-h-screen bg-background shadow-2xl flex flex-col relative">
      {currentView === 'splash' && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
      
      {currentView === 'login' && <LoginScreen />}
      
      {currentView === 'profile-setup' && (
        <ProfileSetupScreen onComplete={handleProfileComplete} />
      )}
      
      {currentView === 'main' && <MainApp />}
      
      {currentView === 'chat' && (
        <ChatScreen onBack={handleChatBack} />
      )}
    </div>
  );
}
