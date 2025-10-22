import { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { calculateTier } from "@/utils/tierCalculator";
import { getAvatarSrc } from "@/utils/avatar";

interface PlayerCardProps {
  player: User;
  onMatchRequest: (playerId: string) => void;
}

export default function PlayerCard({ player, onMatchRequest }: PlayerCardProps) {
  const handleMatchRequest = () => {
    onMatchRequest(player.id);
  };
  
  const tier = calculateTier(player.points, player.wins, player.losses);

  return (
    <div className="bg-background rounded-xl shadow-sm match-card border border-border overflow-hidden" data-testid={`card-player-${player.id}`}>
      <div className="p-4">
        <div className="flex items-start space-x-4">
          {/* Profile image with online indicator */}
          <div className="relative">
            <img 
              src={getAvatarSrc(player.photoURL, player, 150)} 
              alt={`${player.username} profile`}
              className="w-16 h-16 rounded-full object-cover border-2 border-border"
              data-testid={`img-player-${player.id}`}
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground" data-testid={`text-player-name-${player.id}`}>
                  {player.username}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    NTRP {player.ntrp}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${tier.color} ${tier.bgColor}`} data-testid={`text-player-tier-${player.id}`}>
                    <i className="fas fa-medal mr-1" />
                    {tier.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{player.age}세</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-muted-foreground">근처</div>
                <div className="flex text-accent text-xs">
                  <i className="fas fa-star" />
                  <span className="ml-1">4.8</span>
                </div>
              </div>
            </div>
            
            {player.bio && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2" data-testid={`text-player-bio-${player.id}`}>
                {player.bio}
              </p>
            )}
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <i className="fas fa-map-marker-alt" />
                <span data-testid={`text-player-region-${player.id}`}>{player.region}</span>
                <i className="fas fa-clock ml-2" />
                <span data-testid={`text-player-times-${player.id}`}>
                  {player.availableTimes.slice(0, 2).join(', ')}
                </span>
              </div>
              <Button
                onClick={handleMatchRequest}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                data-testid={`button-match-request-${player.id}`}
              >
                매칭 신청
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
