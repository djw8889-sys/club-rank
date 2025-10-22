/**
 * Avatar utility functions for consistent avatar generation across the app
 */

/**
 * Generate a consistent boring avatars URL for a user
 * @param user - User object with id, username, or email
 * @param size - Avatar size in pixels (default: 120)
 * @returns Boring avatars URL
 */
export function getAvatarUrl(user: { id?: string; username?: string; email?: string } | null | undefined, size: number = 120): string {
  if (!user) {
    return `https://source.boringavatars.com/beam/${size}/anonymous`;
  }

  // Use ID as primary seed for consistency, fallback to username or email local part
  const seed = user.id || user.username || user.email?.split('@')[0] || 'user';
  
  return `https://source.boringavatars.com/beam/${size}/${encodeURIComponent(seed)}`;
}

/**
 * Get avatar src with photoURL fallback to boring avatars
 * @param photoURL - User's uploaded photo URL
 * @param user - User object for generating fallback avatar
 * @param size - Avatar size in pixels (default: 120)
 * @returns Final avatar URL
 */
export function getAvatarSrc(photoURL: string | null | undefined, user: { id?: string; username?: string; email?: string } | null | undefined, size: number = 120): string {
  return photoURL || getAvatarUrl(user, size);
}