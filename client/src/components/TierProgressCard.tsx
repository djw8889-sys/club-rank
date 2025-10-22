import { User } from '@shared/schema';
import { getTierProgress } from '@/utils/tierCalculator';

interface TierProgressCardProps {
  user: User;
}

export default function TierProgressCard({ user }: TierProgressCardProps) {
  const { currentTier, nextTier, progress, requirements } = getTierProgress(user.points, user.wins, user.losses);

  return (
    <div className="bg-background rounded-xl border border-border p-4 space-y-3" data-testid="card-tier-progress">
      {/* Current Tier */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentTier.bgColor}`}>
            <i className={`fas fa-medal text-lg ${currentTier.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground" data-testid="text-current-tier">
              {currentTier.name} 등급
            </h3>
            <p className="text-sm text-muted-foreground">현재 등급</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-accent" data-testid="text-current-points">{user.points}P</p>
          <p className="text-xs text-muted-foreground">{user.wins}승 {user.losses}패</p>
        </div>
      </div>

      {/* Progress to Next Tier */}
      {nextTier && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              다음 등급: <span className={currentTier.color}>{nextTier.name}</span>
            </span>
            <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary rounded-full h-2 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              data-testid="progress-bar"
            />
          </div>
          
          {/* Requirements */}
          {requirements.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">승급 조건:</p>
              {requirements.map((requirement, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <i className="fas fa-circle text-xs text-muted-foreground" />
                  <span className="text-xs text-muted-foreground" data-testid={`requirement-${index}`}>
                    {requirement}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Champion Status */}
      {!nextTier && (
        <div className="text-center py-2">
          <div className="flex items-center justify-center space-x-2">
            <i className="fas fa-crown text-yellow-500 text-lg" />
            <span className="font-bold text-yellow-600">최고 등급 달성!</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">축하합니다! 챔피언 등급입니다.</p>
        </div>
      )}
    </div>
  );
}