
import { WeatherData, LocationInfo } from '../types';

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData[]> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,precipitation_sum,windspeed_10m_max,weathercode&timezone=auto`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.daily) return [];

  return data.daily.time.map((time: string, index: number) => ({
    time,
    temp: data.daily.temperature_2m_max[index],
    rain: data.daily.precipitation_sum[index],
    wind: data.daily.windspeed_10m_max[index],
    condition: data.daily.weathercode[index],
    isToday: index === 0
  }));
};

export const searchLocation = async (query: string): Promise<LocationInfo[]> => {
  if (!query || query.length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=es&format=json`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.results) return [];

  return data.results.map((res: any) => ({
    name: res.name,
    lat: res.latitude,
    lon: res.longitude,
    country: res.country
  }));
};

export const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'es'
      }
    });
    const data = await response.json();
    return data.address.city || data.address.town || data.address.village || data.address.state || 'Tu ubicación';
  } catch (e) {
    return 'Tu ubicación';
  }
};

export const getWeatherDescription = (code: number): string => {
  const codes: Record<number, string> = {
    0: 'Cielo despejado',
    1: 'Principalmente despejado',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Niebla',
    48: 'Niebla con escarcha',
    51: 'Llovizna ligera',
    53: 'Llovizna moderada',
    55: 'Llovizna densa',
    61: 'Lluvia débil',
    63: 'Lluvia moderada',
    65: 'Lluvia fuerte',
    71: 'Nieve leve',
    73: 'Nieve moderada',
    75: 'Nieve fuerte',
    80: 'Chubascos leves',
    81: 'Chubascos moderados',
    82: 'Chubascos violentos',
    95: 'Tormenta eléctrica'
  };
  return codes[code] || 'Clima variable';
};
