import { ZODIAC_SIGNS, ZodiacSign, PlanetPosition, HouseCusp } from '@/types';

export function getZodiacSign(longitude: number): ZodiacSign {
  const normalized = longitude % 360;
  const index = Math.floor(normalized / 30) % 12;
  return ZODIAC_SIGNS[index].name;
}

export function getSignDegree(longitude: number): number {
  return longitude % 30;
}

export function formatDegree(degree: number): string {
  const d = Math.floor(degree);
  const m = Math.floor((degree - d) * 60);
  return `${d}°${m.toString().padStart(2, '0')}'`;
}

export function getHouseForPlanet(longitude: number, houses: HouseCusp[]): number {
  // Encontra em qual casa o planeta está
  for (let i = 0; i < 12; i++) {
    const houseStart = houses[i].longitude;
    const houseEnd = houses[(i + 1) % 12].longitude;
    
    // Trata o caso de "wrap around" (casa que cruza 0°)
    if (houseEnd < houseStart) {
      if (longitude >= houseStart || longitude < houseEnd) {
        return i + 1;
      }
    } else {
      if (longitude >= houseStart && longitude < houseEnd) {
        return i + 1;
      }
    }
  }
  return 1; // Default para casa 1
}

export function getElementColor(element: 'fire' | 'earth' | 'air' | 'water'): string {
  switch (element) {
    case 'fire':
      return '#ef4444'; // red-500
    case 'earth':
      return '#22c55e'; // green-500
    case 'air':
      return '#3b82f6'; // blue-500
    case 'water':
      return '#06b6d4'; // cyan-500
  }
}

export function getDignity(planet: string, sign: ZodiacSign): string {
  // Dignidades planetárias clássicas
  const dignities: Record<string, ZodiacSign[]> = {
    sun: ['Leão'],
    moon: ['Câncer'],
    mercury: ['Gêmeos', 'Virgem'],
    venus: ['Touro', 'Libra'],
    mars: ['Áries', 'Escorpião'],
    jupiter: ['Sagitário', 'Peixes'],
    saturn: ['Capricórnio', 'Aquário'],
    uranus: ['Aquário'],
    neptune: ['Peixes'],
    pluto: ['Escorpião'],
  };

  const fall: Record<string, ZodiacSign[]> = {
    sun: ['Aquário'],
    moon: ['Capricórnio'],
    mercury: ['Sagitário', 'Peixes'],
    venus: ['Áries', 'Escorpião'],
    mars: ['Libra', 'Touro'],
    jupiter: ['Gêmeos', 'Virgem'],
    saturn: ['Câncer', 'Leão'],
  };

  if (dignities[planet]?.includes(sign)) return 'domicílio';
  if (fall[planet]?.includes(sign)) return 'queda';
  return 'neutro';
}

export function calculateAspectType(angle: number): { type: string; exactAngle: number } | null {
  const aspects = [
    { angle: 0, name: 'conjunção' },
    { angle: 60, name: 'sextil' },
    { angle: 90, name: 'quadratura' },
    { angle: 120, name: 'trígono' },
    { angle: 180, name: 'oposição' },
    { angle: 30, name: 'semisextil' },
    { angle: 45, name: 'semiquadratura' },
    { angle: 135, name: 'sesquiquadratura' },
    { angle: 150, name: 'quincúncio' },
  ];

  for (const aspect of aspects) {
    const diff = Math.abs(angle - aspect.angle);
    if (diff <= 8 || diff >= 352) { // orb de 8°
      return { type: aspect.name, exactAngle: aspect.angle };
    }
    // Verifica ângulo no outro sentido
    const diff2 = Math.abs(angle - (360 - aspect.angle));
    if (diff2 <= 8) {
      return { type: aspect.name, exactAngle: aspect.angle };
    }
  }

  return null;
}
