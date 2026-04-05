import { GeocodingResult } from '@/types';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export async function geocodeLocation(query: string): Promise<GeocodingResult[]> {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '5',
      addressdetails: '1',
      'accept-language': 'pt-BR',
    });

    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        'User-Agent': 'AstroMap/1.0 (astrology app)',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.map((item: any) => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      address: {
        city: item.address?.city || item.address?.town || item.address?.village,
        state: item.address?.state,
        country: item.address?.country,
      },
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      format: 'json',
      'accept-language': 'pt-BR',
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: {
        'User-Agent': 'AstroMap/1.0 (astrology app)',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding error: ${response.status}`);
    }

    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

export function getTimezoneFromCoordinates(lat: number, lon: number): string {
  // Simplificação: usar timezone do browser ou Intl API
  // Em produção, seria melhor usar uma API como timezone-db
  try {
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'UTC',
      timeZoneName: 'short',
    });
    
    // Estimar timezone baseado na longitude (aproximação grosseira)
    const offset = Math.round(lon / 15);
    const sign = offset >= 0 ? '+' : '-';
    const hours = Math.abs(offset).toString().padStart(2, '0');
    
    return `UTC${sign}${hours}:00`;
  } catch {
    return 'UTC';
  }
}
