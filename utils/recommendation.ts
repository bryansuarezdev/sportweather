
import { Sport, WeatherData, ToleranceLevel, RecommendationStatus } from '../types';

export const getSportRecommendation = (
  sport: Sport,
  weather: WeatherData,
  tolerance: ToleranceLevel
): RecommendationStatus => {
  const thresholds = sport.thresholds[tolerance];

  const tempOk = weather.temp >= thresholds.minTemp && weather.temp <= thresholds.maxTemp;
  const windOk = weather.wind <= thresholds.maxWind;
  const rainOk = weather.rain <= thresholds.maxRain;

  if (tempOk && windOk && rainOk) {
    return '🟢';
  }

  // Slight exceedances get yellow
  const tempYellow = weather.temp >= (thresholds.minTemp - 5) && weather.temp <= (thresholds.maxTemp + 5);
  const windYellow = weather.wind <= (thresholds.maxWind * 1.5);
  const rainYellow = weather.rain <= (thresholds.maxRain * 2 + 2);

  if (tempYellow && windYellow && rainYellow) {
    return '🟡';
  }

  return '🔴';
};

export const getStatusText = (status: RecommendationStatus): string => {
  switch (status) {
    case '🟢': return 'Óptimo';
    case '🟡': return 'Moderado';
    case '🔴': return 'Limitado';
  }
};
