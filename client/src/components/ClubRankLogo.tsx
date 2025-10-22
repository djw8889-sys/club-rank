interface ClubRankLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white';
  className?: string;
}

export default function ClubRankLogo({ 
  size = 'md', 
  variant = 'default',
  className = '' 
}: ClubRankLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const colorClasses = {
    default: 'text-green-600',
    white: 'text-white'
  };

  return (
    <div className={`flex items-center justify-center bg-green-50 rounded-full ${sizeClasses[size]} ${className}`}>
      <div className={`flex items-center justify-center ${colorClasses[variant]}`}>
        <svg 
          viewBox="0 0 120 120" 
          className={`${sizeClasses[size]} drop-shadow-sm`}
          fill="currentColor"
        >
          {/* Shield Background */}
          <path 
            d="M60 10 L85 25 L85 65 Q85 85 60 100 Q35 85 35 65 L35 25 Z" 
            fill="currentColor" 
            className="opacity-90"
          />
          
          {/* Shield Border */}
          <path 
            d="M60 10 L85 25 L85 65 Q85 85 60 100 Q35 85 35 65 L35 25 Z" 
            fill="none" 
            stroke={variant === 'white' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'} 
            strokeWidth="1"
          />
          
          {/* First Tennis Racket */}
          <g transform="translate(50, 55) rotate(-20)">
            {/* Racket Handle */}
            <rect x="-1" y="8" width="2" height="12" fill="white" className="opacity-80" />
            {/* Racket Head */}
            <ellipse cx="0" cy="0" rx="6" ry="8" fill="none" stroke="white" strokeWidth="1.5" className="opacity-80" />
            {/* Strings */}
            <line x1="-4" y1="-3" x2="4" y2="-3" stroke="white" strokeWidth="0.5" className="opacity-60" />
            <line x1="-4" y1="0" x2="4" y2="0" stroke="white" strokeWidth="0.5" className="opacity-60" />
            <line x1="-4" y1="3" x2="4" y2="3" stroke="white" strokeWidth="0.5" className="opacity-60" />
            <line x1="-2" y1="-6" x2="-2" y2="6" stroke="white" strokeWidth="0.5" className="opacity-60" />
            <line x1="0" y1="-6" x2="0" y2="6" stroke="white" strokeWidth="0.5" className="opacity-60" />
            <line x1="2" y1="-6" x2="2" y2="6" stroke="white" strokeWidth="0.5" className="opacity-60" />
          </g>
          
          {/* Second Tennis Racket */}
          <g transform="translate(70, 55) rotate(20)">
            {/* Racket Handle */}
            <rect x="-1" y="8" width="2" height="12" fill="white" className="opacity-80" />
            {/* Racket Head */}
            <ellipse cx="0" cy="0" rx="6" ry="8" fill="none" stroke="white" strokeWidth="1.5" className="opacity-80" />
            {/* Strings */}
            <line x1="-4" y1="-3" x2="4" y2="-3" stroke="white" strokeWidth="0.5" className="opacity-60" />
            <line x1="-4" y1="0" x2="4" y2="0" stroke="white" strokeWidth="0.5" className="opacity-60" />
            <line x1="-4" y1="3" x2="4" y2="3" stroke="white" strokeWidth="0.5" className="opacity-60" />
            <line x1="-2" y1="-6" x2="-2" y2="6" stroke="white" strokeWidth="0.5" className="opacity-60" />
            <line x1="0" y1="-6" x2="0" y2="6" stroke="white" strokeWidth="0.5" className="opacity-60" />
            <line x1="2" y1="-6" x2="2" y2="6" stroke="white" strokeWidth="0.5" className="opacity-60" />
          </g>
          
          {/* Crown */}
          <g transform="translate(60, 25)">
            {/* Crown Base */}
            <rect x="-8" y="0" width="16" height="4" fill="white" className="opacity-90" />
            {/* Crown Points */}
            <polygon points="-8,0 -4,-6 0,0" fill="white" className="opacity-90" />
            <polygon points="-4,0 0,-8 4,0" fill="white" className="opacity-90" />
            <polygon points="4,0 8,-6 8,0" fill="white" className="opacity-90" />
            {/* Crown Gems */}
            <circle cx="-4" cy="-3" r="1" fill={variant === 'white' ? 'rgba(255,255,255,0.8)' : 'rgba(34,197,94,0.8)'} />
            <circle cx="0" cy="-5" r="1.2" fill={variant === 'white' ? 'rgba(255,255,255,0.8)' : 'rgba(34,197,94,0.8)'} />
            <circle cx="4" cy="-3" r="1" fill={variant === 'white' ? 'rgba(255,255,255,0.8)' : 'rgba(34,197,94,0.8)'} />
          </g>
          
          {/* Club Rank initials */}
          <text 
            x="60" 
            y="85" 
            textAnchor="middle" 
            fill="white" 
            className="text-sm font-bold"
            fontSize="12"
          >
            CR
          </text>
        </svg>
      </div>
    </div>
  );
}