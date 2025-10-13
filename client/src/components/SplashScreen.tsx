import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Allow fade out animation
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center z-50" data-testid="splash-screen">
      {/* Tennis court background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-8 gap-4 h-full p-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded" />
          ))}
        </div>
      </div>
      
      <div className="text-center z-10">
        <div className="text-8xl mb-6">🎾</div>
        <h1 className="text-5xl font-bold text-white mb-4">ClubRank</h1>
        <p className="text-emerald-100 text-lg font-medium">데이터로 증명하는 우리 동네 최강 클럽</p>
        <div className="mt-8">
          <div className="loading-spinner mx-auto border-white border-t-emerald-200" />
        </div>
      </div>
    </div>
  );
}
