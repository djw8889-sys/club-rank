import { useState, useEffect } from 'react';

interface GeolocationPosition {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  error: string | null;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
  hasPermission: boolean;
}

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // Check for cached position on mount
  useEffect(() => {
    const cached = localStorage.getItem('user-location');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Check if cached position is less than 24 hours old
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setPosition(parsed);
          setHasPermission(true);
        } else {
          localStorage.removeItem('user-location');
        }
      } catch (e) {
        localStorage.removeItem('user-location');
      }
    }
  }, []);

  const requestPermission = async (): Promise<void> => {
    if (!navigator.geolocation) {
      setError('위치 서비스가 지원되지 않는 브라우저입니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const locationData: GeolocationPosition = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              timestamp: Date.now(),
            };
            resolve(locationData);
          },
          (error) => {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject(new Error('위치 권한이 거부되었습니다.'));
                break;
              case error.POSITION_UNAVAILABLE:
                reject(new Error('위치 정보를 사용할 수 없습니다.'));
                break;
              case error.TIMEOUT:
                reject(new Error('위치 요청 시간이 초과되었습니다.'));
                break;
              default:
                reject(new Error('알 수 없는 오류가 발생했습니다.'));
                break;
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
          }
        );
      });

      setPosition(position);
      setHasPermission(true);
      
      // Cache position for 24 hours
      localStorage.setItem('user-location', JSON.stringify(position));
    } catch (err) {
      setError(err instanceof Error ? err.message : '위치를 가져올 수 없습니다.');
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    position,
    error,
    isLoading,
    requestPermission,
    hasPermission,
  };
}

// Haversine distance calculation
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}