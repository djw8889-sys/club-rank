import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function FirebaseSetupGuide() {
  const [showGuide, setShowGuide] = useState(false);
  const currentDomain = window.location.origin;

  if (!showGuide) {
    return (
      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <i className="fas fa-exclamation-triangle text-amber-500" />
            <span className="text-sm text-amber-700">
              로그인에 문제가 있나요?
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGuide(true)}
            className="text-amber-700 border-amber-300 hover:bg-amber-100"
          >
            설정 가이드
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-amber-800">
          <i className="fas fa-cog mr-2" />
          Firebase 도메인 설정 가이드
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowGuide(false)}
          className="text-amber-700"
        >
          <i className="fas fa-times" />
        </Button>
      </div>
      
      <div className="space-y-4 text-sm text-amber-700">
        <div className="bg-white p-3 rounded border">
          <strong>현재 도메인:</strong>
          <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs font-mono">
            {currentDomain}
          </code>
        </div>
        
        <div>
          <strong>Firebase Console 설정 단계:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-2 ml-4">
            <li>
              <a 
                href="https://console.firebase.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                Firebase Console
              </a>에 접속하여 프로젝트 선택
            </li>
            <li>
              왼쪽 메뉴에서 <strong>Authentication</strong> → <strong>Settings</strong> 클릭
            </li>
            <li>
              <strong>승인된 도메인</strong> 섹션에서 <strong>도메인 추가</strong> 클릭
            </li>
            <li>
              다음 도메인을 추가:
              <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-xs">
                {currentDomain.replace('https://', '').replace('http://', '')}
              </div>
            </li>
            <li>
              <strong>Google</strong> 인증 제공업체가 활성화되어 있는지 확인
            </li>
          </ol>
        </div>
        
        <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
          <p>
            <strong>💡 팁:</strong> 도메인 설정 후 몇 분 기다린 다음 페이지를 새로고침하여 다시 시도해보세요.
          </p>
        </div>
      </div>
    </div>
  );
}