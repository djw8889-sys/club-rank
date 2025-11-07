/**
 * Avatar utility functions for consistent avatar generation across the app
 */

/**
 * Generate a safe local avatar fallback (SVG data URI)
 * @param user - User object with id, username, or email
 * @param size - Avatar size in pixels (default: 120)
 * @returns Safe SVG data URI for avatar
 */
export function getAvatarUrl(user: { id?: string; username?: string; email?: string } | null | undefined, size: number = 120): string {
  // Get seed for consistent color generation
  const seed = user?.id || user?.username || user?.email?.split('@')[0] || 'anonymous';
  
  // Generate consistent color from seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  
  const hue = Math.abs(hash % 360);
  const bgColor = `hsl(${hue}, 60%, 45%)`;
  const initial = (user?.username?.[0] || user?.email?.[0] || '?').toUpperCase();
  
  // Generate safe SVG avatar as data URI
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${bgColor}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="${size * 0.5}" fill="white" font-weight="bold">
        ${initial}
      </text>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Get avatar src with photoURL fallback to local SVG avatar
 * @param photoURL - User's uploaded photo URL
 * @param user - User object for generating fallback avatar
 * @param size - Avatar size in pixels (default: 120)
 * @returns Final avatar URL (user photo or safe SVG fallback)
 */
export function getAvatarSrc(photoURL: string | null | undefined, user: { id?: string; username?: string; email?: string } | null | undefined, size: number = 120): string {
  return photoURL || getAvatarUrl(user, size);
}

/**
 * Safe default avatar SVG (for error fallback)
 */
export const DEFAULT_AVATAR_SVG = `data:image/svg+xml;base64,${btoa(`
  <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="120" fill="#9ca3af"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
          font-family="Arial, sans-serif" font-size="60" fill="white" font-weight="bold">
      ?
    </text>
  </svg>
`.trim())}`;