interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string, header: string) => void;
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: 'my-club-tab', header: '내 클럽', icon: '🏠', label: '내 클럽' },
    { id: 'ranking-tab', header: '랭킹', icon: '🏆', label: '랭킹' },
    { id: 'community-tab', header: '커뮤니티', icon: '💬', label: '커뮤니티' },
    { id: 'my-info-tab', header: '내 정보', icon: '👤', label: '내 정보' },
  ];

  return (
    <nav className="bg-background border-t border-border grid grid-cols-4 text-center sticky bottom-0" data-testid="bottom-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id, tab.header)}
          className={`nav-btn p-3 ${
            activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'
          }`}
          data-testid={`button-tab-${tab.id}`}
        >
          <div className="flex justify-center items-center">
            <span className="text-lg">{tab.icon}</span>
          </div>
          <span className="block text-xs mt-1">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
