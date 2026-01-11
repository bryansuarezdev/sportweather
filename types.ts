
export type ToleranceLevel = 'low' | 'moderate' | 'high';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  sports: string[];
  tolerance: ToleranceLevel;
}

export interface WeatherData {
  time: string;
  temp: number;
  rain: number;
  wind: number;
  condition: number;
  isToday: boolean;
}

export interface SportThresholds {
  minTemp: number;
  maxTemp: number;
  maxWind: number;
  maxRain: number;
}

export type RecommendationStatus = '🟢' | '🟡' | '🔴';

export interface Sport {
  id: string;
  name: string;
  icon: string;
  imageUrl: string;
  thresholds: Record<ToleranceLevel, SportThresholds>;
}

export interface LocationInfo {
  name: string;
  lat: number;
  lon: number;
  country?: string;
}
