
import { Sport, ToleranceLevel } from './types';

export const MANDATORY_SPORTS: Sport[] = [
  {
    id: 'running',
    name: 'Running',
    icon: '🏃',
    imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=400',
    thresholds: {
      low: { minTemp: 12, maxTemp: 22, maxWind: 10, maxRain: 0 },
      moderate: { minTemp: 5, maxTemp: 28, maxWind: 20, maxRain: 1 },
      high: { minTemp: -5, maxTemp: 35, maxWind: 40, maxRain: 5 }
    }
  },
  {
    id: 'cycling',
    name: 'Road Cycling',
    icon: '🚴',
    imageUrl: 'https://images.unsplash.com/photo-1474962558142-9ca83af74bb7?auto=format&fit=crop&q=80&w=400',
    thresholds: {
      low: { minTemp: 15, maxTemp: 25, maxWind: 10, maxRain: 0 },
      moderate: { minTemp: 10, maxTemp: 30, maxWind: 25, maxRain: 0 },
      high: { minTemp: 0, maxTemp: 38, maxWind: 45, maxRain: 2 }
    }
  },
  {
    id: 'tennis',
    name: 'Tennis',
    icon: '🎾',
    imageUrl: 'https://images.unsplash.com/photo-1595435066319-70570494df3f?auto=format&fit=crop&q=80&w=400',
    thresholds: {
      low: { minTemp: 15, maxTemp: 26, maxWind: 5, maxRain: 0 },
      moderate: { minTemp: 10, maxTemp: 32, maxWind: 15, maxRain: 0 },
      high: { minTemp: 5, maxTemp: 38, maxWind: 30, maxRain: 0 }
    }
  },
  {
    id: 'calisthenics',
    name: 'Calisthenics',
    icon: '💪',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400',
    thresholds: {
      low: { minTemp: 15, maxTemp: 25, maxWind: 15, maxRain: 0 },
      moderate: { minTemp: 10, maxTemp: 30, maxWind: 25, maxRain: 1 },
      high: { minTemp: 0, maxTemp: 38, maxWind: 40, maxRain: 5 }
    }
  },
  {
    id: 'outdoor_yoga',
    name: 'Outdoor Yoga',
    icon: '🧘',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400',
    thresholds: {
      low: { minTemp: 18, maxTemp: 24, maxWind: 5, maxRain: 0 },
      moderate: { minTemp: 15, maxTemp: 28, maxWind: 10, maxRain: 0 },
      high: { minTemp: 10, maxTemp: 32, maxWind: 20, maxRain: 1 }
    }
  },
  {
    id: 'hiking',
    name: 'Hiking',
    icon: '🥾',
    imageUrl: 'https://images.unsplash.com/photo-1551632432-c73581c61972?auto=format&fit=crop&q=80&w=400',
    thresholds: {
      low: { minTemp: 10, maxTemp: 22, maxWind: 15, maxRain: 0 },
      moderate: { minTemp: 5, maxTemp: 28, maxWind: 30, maxRain: 2 },
      high: { minTemp: -10, maxTemp: 35, maxWind: 60, maxRain: 10 }
    }
  },
  {
    id: 'swimming',
    name: 'Open Water Swimming',
    icon: '🏊',
    imageUrl: 'https://images.unsplash.com/photo-1530549387631-6c129c1abc7a?auto=format&fit=crop&q=80&w=400',
    thresholds: {
      low: { minTemp: 20, maxTemp: 30, maxWind: 10, maxRain: 0 },
      moderate: { minTemp: 16, maxTemp: 32, maxWind: 25, maxRain: 2 },
      high: { minTemp: 12, maxTemp: 38, maxWind: 40, maxRain: 5 }
    }
  },
  {
    id: 'skateboarding',
    name: 'Skateboarding',
    icon: '🛹',
    imageUrl: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?auto=format&fit=crop&q=80&w=400',
    thresholds: {
      low: { minTemp: 15, maxTemp: 25, maxWind: 10, maxRain: 0 },
      moderate: { minTemp: 10, maxTemp: 30, maxWind: 20, maxRain: 0 },
      high: { minTemp: 5, maxTemp: 35, maxWind: 35, maxRain: 0 }
    }
  },
  {
    id: 'football',
    name: 'Football',
    icon: '⚽',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=400',
    thresholds: {
      low: { minTemp: 10, maxTemp: 24, maxWind: 15, maxRain: 0 },
      moderate: { minTemp: 5, maxTemp: 30, maxWind: 30, maxRain: 5 },
      high: { minTemp: -5, maxTemp: 35, maxWind: 50, maxRain: 15 }
    }
  },
  {
    id: 'beach_volleyball',
    name: 'Beach Volleyball',
    icon: '🏐',
    imageUrl: 'https://images.unsplash.com/photo-1510134446330-74e64f1d7d0a?auto=format&fit=crop&q=80&w=400',
    thresholds: {
      low: { minTemp: 20, maxTemp: 28, maxWind: 10, maxRain: 0 },
      moderate: { minTemp: 15, maxTemp: 32, maxWind: 20, maxRain: 0 },
      high: { minTemp: 10, maxTemp: 38, maxWind: 40, maxRain: 2 }
    }
  }
];
