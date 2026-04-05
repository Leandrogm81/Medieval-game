'use client';

import type { 
  PlanetPosition, 
  HouseCusp, 
  Aspect, 
  BirthData, 
  NatalChart,
  ZodiacSign 
} from '@/types';
import { PLANETS, ZODIAC_SIGNS } from '@/types';
import { getZodiacSign, getSignDegree, getHouseForPlanet } from './astrology';

import * as Astronomy from 'astronomy-engine';

let astronomyLoaded = false;

export async function initSweph(): Promise<void> {
  if (astronomyLoaded) return;
  
  try {
    if (typeof Astronomy.Body !== 'object' || typeof Astronomy.GeoVector !== 'function') {
      throw new Error('Astronomy Engine module is incomplete');
    }
    astronomyLoaded = true;
    console.log('Astronomy Engine initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Astronomy Engine:', error);
    throw new Error('Não foi possível inicializar a biblioteca de cálculos astronômicos');
  }
}

// Calculate Julian Day from Date
function dateToJD(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  
  let y = year;
  let m = month;
  
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
  
  return jd + hour / 24;
}

// Calculate Obliquity of the Ecliptic
function getObliquity(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  // Obliquity in degrees (IAU 2006)
  return 23.439291 - 0.0130042 * T - 0.00000016 * T * T + 0.0000005 * T * T * T;
}

// Calculate Local Sidereal Time (in degrees)
function getLST(jd: number, longitude: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  
  // GMST in degrees
  let GMST = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
  GMST = GMST % 360;
  if (GMST < 0) GMST += 360;
  
  // LST = GMST + longitude (in degrees)
  let LST = GMST + longitude;
  LST = LST % 360;
  if (LST < 0) LST += 360;
  
  return LST;
}

// Calculate Ascendant using correct formula
// For the southern hemisphere, we need to add 180° to get the correct Ascendant
function getAscendant(LST: number, latitude: number, obliquity: number): number {
  const RAMC = LST;
  
  const ramcRad = RAMC * Math.PI / 180;
  const latRad = latitude * Math.PI / 180;
  const oblRad = obliquity * Math.PI / 180;
  
  const sinRAMC = Math.sin(ramcRad);
  const cosRAMC = Math.cos(ramcRad);
  const sinObl = Math.sin(oblRad);
  const cosObl = Math.cos(oblRad);
  const tanLat = Math.tan(latRad);
  
  const y = -cosRAMC;
  const x = sinRAMC * cosObl + tanLat * sinObl;
  
  let ascRad = Math.atan2(y, x);
  let asc = ascRad * 180 / Math.PI;
  
  // For southern hemisphere (negative latitude), add 180° to get correct Ascendant
  if (latitude < 0) {
    asc = (asc + 180) % 360;
  }
  
  asc = ((asc % 360) + 360) % 360;
  
  return asc;
}

// Calculate MC (Medium Coeli / Midheaven)
function getMC(LST: number, obliquity: number): number {
  // MC is approximately equal to the RAMC (Right Ascension of Medium Coeli)
  // converted to ecliptic longitude
  const RAMC = LST * Math.PI / 180;
  const oblRad = obliquity * Math.PI / 180;
  
  // tan(MC) = sin(RAMC) / cos(RAMC) * cos(obl)
  // MC = atan2(sin(RAMC), cos(RAMC) * cos(obl))
  const y = Math.sin(RAMC);
  const x = Math.cos(RAMC) * Math.cos(oblRad);
  
  let mcRad = Math.atan2(y, x);
  let mc = mcRad * 180 / Math.PI;
  
  mc = mc % 360;
  if (mc < 0) mc += 360;
  
  return mc;
}

// Calculate Placidus House cusps
function calculatePlacidusHouses(jd: number, latitude: number, longitude: number): HouseCusp[] {
  const LST = getLST(jd, longitude);
  const obliquity = getObliquity(jd);
  
  // Calculate Ascendant and MC
  const ascendant = getAscendant(LST, latitude, obliquity);
  const MC = getMC(LST, obliquity);
  
  const houses: HouseCusp[] = [];
  
  // House 1 = Ascendant
  // House 10 = MC
  // House 4 = IC (opposite of MC)
  // House 7 = DESC (opposite of Ascendant)
  
  const IC = (MC + 180) % 360;
  const DESC = (ascendant + 180) % 360;
  
  // For Placidus, we need to calculate the times when points on the ecliptic
  // reach certain house divisions. This is complex and requires iterative solutions.
  // 
  // A simplified but more accurate approach:
  // House cusps 11 and 12 are between MC and ASC (above horizon)
  // House cusps 2 and 3 are between ASC and IC (below horizon)
  // House cusps 5 and 6 are between IC and DESC (below horizon)
  // House cusps 8 and 9 are between DESC and MC (above horizon)
  
  // We calculate these by interpolation in the ecliptic, adjusted for latitude
  
  // Calculate House 11 and 12
  // These are calculated by finding points that have the same RAMC ratio
  // House 11 is at 1/3 of the distance from MC to ASC
  // House 12 is at 2/3 of the distance from MC to ASC
  
  const mcToAsc = ((ascendant - MC + 360) % 360);
  
  // House 11
  const cusp11 = (MC + mcToAsc / 3) % 360;
  
  // House 12
  const cusp12 = (MC + 2 * mcToAsc / 3) % 360;
  
  // House 2 and 3 (between ASC and IC, going through the bottom of the chart)
  const ascToIc = ((IC - ascendant + 360) % 360);
  
  // House 2
  const cusp2 = (ascendant + ascToIc / 3) % 360;
  
  // House 3
  const cusp3 = (ascendant + 2 * ascToIc / 3) % 360;
  
  // House 5 and 6 (between IC and DESC)
  const icToDesc = ((DESC - IC + 360) % 360);
  
  // House 5
  const cusp5 = (IC + icToDesc / 3) % 360;
  
  // House 6
  const cusp6 = (IC + 2 * icToDesc / 3) % 360;
  
  // House 8 and 9 (between DESC and MC)
  const descToMc = ((MC - DESC + 360) % 360);
  
  // House 8
  const cusp8 = (DESC + descToMc / 3) % 360;
  
  // House 9
  const cusp9 = (DESC + 2 * descToMc / 3) % 360;
  
  // Build the houses array (cusps 1-12)
  // House 1 = ASC, House 2, House 3, House 4 = IC, House 5, House 6,
  // House 7 = DESC, House 8, House 9, House 10 = MC, House 11, House 12
  const cuspArray = [
    ascendant, // House 1
    cusp2,      // House 2
    cusp3,      // House 3
    IC,         // House 4
    cusp5,      // House 5
    cusp6,      // House 6
    DESC,       // House 7
    cusp8,      // House 8
    cusp9,      // House 9
    MC,         // House 10
    cusp11,     // House 11
    cusp12,     // House 12
  ];
  
  for (let i = 0; i < 12; i++) {
    let cusp = cuspArray[i];
    if (isNaN(cusp)) {
      cusp = (ascendant + i * 30) % 360;
    }
    cusp = ((cusp % 360) + 360) % 360;
    
    houses.push({
      number: i + 1,
      longitude: cusp,
      sign: getZodiacSign(cusp),
      degree: getSignDegree(cusp),
    });
  }
  
  return houses;
}

// Calculate Whole Signs houses
function calculateWholeSignsHouses(ascendant: number): HouseCusp[] {
  const houses: HouseCusp[] = [];
  // Find the sign that contains the Ascendant
  const ascSignStart = Math.floor(ascendant / 30) * 30;
  
  // Each house starts at the beginning of each sign
  // House 1 starts at the sign of the Ascendant
  for (let i = 0; i < 12; i++) {
    const longitude = (ascSignStart + i * 30) % 360;
    houses.push({
      number: i + 1,
      longitude,
      sign: getZodiacSign(longitude),
      degree: 0, // Always 0° in Whole Signs
    });
  }
  
  return houses;
}

async function calculatePlanetPosition(date: Date, planetId: string): Promise<PlanetPosition> {
  if (!astronomyLoaded) {
    throw new Error('Astronomy Engine not initialized');
  }
  
  const bodyMap: Record<string, any> = {
    sun: Astronomy.Body.Sun,
    moon: Astronomy.Body.Moon,
    mercury: Astronomy.Body.Mercury,
    venus: Astronomy.Body.Venus,
    mars: Astronomy.Body.Mars,
    jupiter: Astronomy.Body.Jupiter,
    saturn: Astronomy.Body.Saturn,
    uranus: Astronomy.Body.Uranus,
    neptune: Astronomy.Body.Neptune,
    pluto: Astronomy.Body.Pluto,
  };
  
  const body = bodyMap[planetId];
  
  if (!body) {
    if (planetId === 'node') return calculateNodePosition(date);
    if (planetId === 'chiron') return calculateChironPosition(date);
    throw new Error(`Unknown planet: ${planetId}`);
  }
  
  const vector = Astronomy.GeoVector(body, date, true);
  const ecliptic = Astronomy.Ecliptic(vector);
  
  const longitude = ecliptic.elon;
  const latitude = ecliptic.elat;
  
  // Calculate speed (change in longitude over 1 hour)
  const date1 = new Date(date.getTime() + 3600000);
  const vector1 = Astronomy.GeoVector(body, date1, true);
  const ecliptic1 = Astronomy.Ecliptic(vector1);
  let speed = ecliptic1.elon - longitude;
  if (speed > 180) speed -= 360;
  if (speed < -180) speed += 360;
  
  const planetInfo = PLANETS.find(p => p.id === planetId)!;
  
  return {
    name: planetInfo.name,
    symbol: planetInfo.symbol,
    longitude,
    latitude,
    speed,
    sign: getZodiacSign(longitude),
    degree: getSignDegree(longitude),
    house: 1,
    retrograde: speed < 0,
  };
}

function calculateNodePosition(date: Date): PlanetPosition {
  const jd = dateToJD(date);
  const jd2000 = 2451545.0;
  const years = (jd - jd2000) / 365.25;
  // Mean Node - regresses ~19.3° per year
  const longitude = (125.04355 - years * 19.34) % 360;
  const normalized = longitude < 0 ? longitude + 360 : longitude;
  
  return {
    name: 'Nodo Norte',
    symbol: '☊',
    longitude: normalized,
    latitude: 0,
    speed: -0.053,
    sign: getZodiacSign(normalized),
    degree: getSignDegree(normalized),
    house: 1,
    retrograde: true,
  };
}

function calculateChironPosition(date: Date): PlanetPosition {
  const jd = dateToJD(date);
  const jd2000 = 2451545.0;
  const years = (jd - jd2000) / 365.25;
  // Chiron orbital period ~50.7 years
  const longitude = (207.67 + years * 7.1) % 360;
  
  return {
    name: 'Quíron',
    symbol: '⚷',
    longitude,
    latitude: 0,
    speed: 0.019,
    sign: getZodiacSign(longitude),
    degree: getSignDegree(longitude),
    house: 1,
    retrograde: false,
  };
}

// Parse timezone offset from string like "UTC-3:00" or "UTC+2:00"
function parseTimezoneOffset(timezone: string): number {
  if (!timezone) return 0;
  
  const match = timezone.match(/UTC([+-]?)(\d{1,2})(?::(\d{2}))?/i);
  if (!match) return 0;
  
  const sign = match[1] === '-' ? -1 : 1;
  const hours = parseInt(match[2], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;
  
  return sign * (hours + minutes / 60);
}

// Estimate timezone from longitude
function estimateTimezoneFromLongitude(longitude: number): number {
  // Each 15° of longitude = 1 hour
  // Round to nearest integer hour
  return Math.round(longitude / 15);
}

export async function calculateNatalChart(birthData: BirthData): Promise<NatalChart> {
  if (!astronomyLoaded) {
    throw new Error('Astronomy Engine must be initialized before calculation');
  }
  
  // Parse date and time
  const [year, month, day] = birthData.date.split('-').map(Number);
  const [hours, minutes] = birthData.time.split(':').map(Number);
  
  // Get timezone offset (in hours)
  // Priority: 1. timezone field, 2. estimate from longitude
  let timezoneOffset = parseTimezoneOffset(birthData.timezone || '');
  if (timezoneOffset === 0 && birthData.longitude !== 0) {
    timezoneOffset = estimateTimezoneFromLongitude(birthData.longitude);
  }
  
  // Convert local time to UTC
  // If local time is 14:00 and timezone is UTC-3, then UTC is 14:00 + 3 = 17:00
  // Formula: UTC = local - timezone_offset (because timezone is already negative for west)
  // Actually: UTC = local_time - timezone_offset_hours
  // For São Paulo (UTC-3): local 14:00 → UTC = 14 - (-3) = 17:00
  
  // Wait, the timezone string is like "UTC-3:00", which means UTC minus 3 hours
  // So São Paulo local time 14:00 = UTC 17:00
  // UTC = local + (-timezone_offset) where timezone_offset is -3 for São Paulo
  
  // Actually, simpler: if timezone is -3, local time is 3 hours BEHIND UTC
  // So UTC = local_time + 3 (for negative timezones)
  // Or: UTC = local_time - timezone_offset (since timezone_offset is negative)
  
  const utcHours = hours - timezoneOffset;
  
  console.log('Debug:', {
    localTime: `${hours}:${minutes}`,
    timezone: birthData.timezone,
    timezoneOffset,
    utcTime: `${Math.floor(utcHours)}:${minutes}`,
    latitude: birthData.latitude,
    longitude: birthData.longitude,
  });
  
  // Create UTC date
  const birthDate = new Date(Date.UTC(year, month - 1, day, Math.floor(utcHours), minutes));
  const jd = dateToJD(birthDate);
  
  // Calculate planets
  const planets: PlanetPosition[] = [];
  for (const planet of PLANETS) {
    try {
      const position = await calculatePlanetPosition(birthDate, planet.id);
      planets.push(position);
    } catch (error) {
      console.warn(`Could not calculate position for ${planet.id}:`, error);
    }
  }
  
  if (planets.length === 0) {
    throw new Error('Failed to calculate any planet positions');
  }
  
  // Calculate houses
  const housesPlacidus = calculatePlacidusHouses(jd, birthData.latitude, birthData.longitude);
  const ascendant = housesPlacidus[0].longitude;
  const housesWhole = calculateWholeSignsHouses(ascendant);
  
  // Assign houses to planets
  for (const planet of planets) {
    planet.house = getHouseForPlanet(planet.longitude, housesPlacidus);
  }
  
  // Calculate aspects
  const aspects = calculateAspects(planets);
  
  return {
    birthData,
    planets,
    housesPlacidus,
    housesWhole,
    aspects,
    ascendant,
    mc: housesPlacidus[9].longitude,
  };
}

function calculateAspects(planets: PlanetPosition[]): Aspect[] {
  const aspects: Aspect[] = [];
  const majorAspects = [
    { angle: 0, name: 'conjunction', orb: 8 },
    { angle: 60, name: 'sextile', orb: 6 },
    { angle: 90, name: 'square', orb: 8 },
    { angle: 120, name: 'trine', orb: 8 },
    { angle: 180, name: 'opposition', orb: 8 },
  ];
  
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      
      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;
      
      for (const aspect of majorAspects) {
        const orb = Math.abs(diff - aspect.angle);
        if (orb <= aspect.orb) {
          const isApplying = (p1.speed > p2.speed && p1.longitude < p2.longitude) ||
                           (p1.speed < p2.speed && p1.longitude > p2.longitude);
          
          aspects.push({
            planet1: p1.name,
            planet2: p2.name,
            type: aspect.name as Aspect['type'],
            angle: diff,
            orb,
            applying: isApplying,
          });
          break;
        }
      }
    }
  }
  
  return aspects.sort((a, b) => a.orb - b.orb);
}

/**
 * Find the exact time when the Sun returns to a specific longitude
 * Uses iterative binary search to find the exact moment
 */
function findSolarReturnTime(
  approximateDate: Date,
  targetLongitude: number,
  latitude: number,
  longitude: number,
  timezoneOffset: number
): Date {
  // The Sun moves about 1 degree per day, so we search within ±3 days
  let searchStart = new Date(approximateDate);
  searchStart.setDate(searchStart.getDate() - 2);
  
  let searchEnd = new Date(approximateDate);
  searchEnd.setDate(searchEnd.getDate() + 2);
  
  // Binary search for the exact time
  let iterations = 0;
  const maxIterations = 50; // ~1 minute precision
  
  while (iterations < maxIterations) {
    const midTime = new Date((searchStart.getTime() + searchEnd.getTime()) / 2);
    
    // Get Sun position at midTime
    const sunVector = Astronomy.GeoVector(Astronomy.Body.Sun, midTime, true);
    const sunEcliptic = Astronomy.Ecliptic(sunVector);
    let currentLongitude = sunEcliptic.elon;
    
    // Normalize to 0-360
    currentLongitude = ((currentLongitude % 360) + 360) % 360;
    
    // Calculate angular difference
    let diff = currentLongitude - targetLongitude;
    
    // Normalize difference to -180 to 180
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    
    // Check if we're close enough (within 0.01 degrees ≈ 1.5 minutes)
    if (Math.abs(diff) < 0.01) {
      return midTime;
    }
    
    // Adjust search range
    if (diff > 0) {
      // Sun is ahead of target, need to go earlier
      searchEnd = midTime;
    } else {
      // Sun is behind target, need to go later
      searchStart = midTime;
    }
    
    iterations++;
  }
  
  // Return the best approximation if we didn't converge
  return new Date((searchStart.getTime() + searchEnd.getTime()) / 2);
}

/**
 * Calculate the Solar Return chart for a specific year
 * The Solar Return is the moment when the Sun returns to the same zodiacal position
 * as it was at birth. This can vary by up to 2 days from the birthday.
 */
export async function calculateSolarReturn(birthChart: NatalChart, year: number): Promise<NatalChart> {
  if (!astronomyLoaded) {
    throw new Error('Astronomy Engine must be initialized before calculation');
  }
  
  // Get the natal Sun position
  const natalSun = birthChart.planets.find(p => p.name === 'Sol');
  if (!natalSun) {
    throw new Error('Natal Sun position not found');
  }
  
  const targetSunLongitude = natalSun.longitude;
  
  // Get timezone offset
  let timezoneOffset = parseTimezoneOffset(birthChart.birthData.timezone || '');
  if (timezoneOffset === 0) {
    timezoneOffset = estimateTimezoneFromLongitude(birthChart.birthData.longitude);
  }
  
  // Approximate date of solar return (around the birthday)
  const birthDate = new Date(birthChart.birthData.date);
  const approximateReturn = new Date(year, birthDate.getMonth(), birthDate.getDate(), 12, 0, 0);
  
  // Find the exact time when Sun returns to the natal position
  const solarReturnDate = findSolarReturnTime(
    approximateReturn,
    targetSunLongitude,
    birthChart.birthData.latitude,
    birthChart.birthData.longitude,
    timezoneOffset
  );
  
  // Create birth data for solar return
  // Use the same location as natal chart (traditional approach)
  const returnData: BirthData = {
    name: birthChart.birthData.name,
    date: solarReturnDate.toISOString().split('T')[0],
    time: `${solarReturnDate.getUTCHours().toString().padStart(2, '0')}:${solarReturnDate.getUTCMinutes().toString().padStart(2, '0')}`,
    location: birthChart.birthData.location,
    latitude: birthChart.birthData.latitude,
    longitude: birthChart.birthData.longitude,
    timezone: birthChart.birthData.timezone,
  };
  
  console.log('Solar Return Debug:', {
    year,
    approximateDate: approximateReturn.toISOString(),
    exactDate: solarReturnDate.toISOString(),
    targetSunLongitude,
    timezoneOffset,
  });
  
  return calculateNatalChart(returnData);
}

export function getPlanetSymbol(planetName: string): string {
  const planet = PLANETS.find(p => p.name === planetName);
  return planet?.symbol || '●';
}

export function getSignSymbol(sign: ZodiacSign): string {
  const zodiacSign = ZODIAC_SIGNS.find(z => z.name === sign);
  return zodiacSign?.symbol || '';
}

// Debug function to log calculation details
export function debugCalculation(birthData: BirthData): {
  jd: number;
  lst: number;
  obliquity: number;
  ascendant: number;
  mc: number;
  latitude: number;
  longitude: number;
} {
  const [year, month, day] = birthData.date.split('-').map(Number);
  const [hours, minutes] = birthData.time.split(':').map(Number);
  const birthDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const jd = dateToJD(birthDate);
  
  const lst = getLST(jd, birthData.longitude);
  const obliquity = getObliquity(jd);
  const ascendant = getAscendant(lst, birthData.latitude, obliquity);
  const mc = getMC(lst, obliquity);
  
  return {
    jd,
    lst,
    obliquity,
    ascendant,
    mc,
    latitude: birthData.latitude,
    longitude: birthData.longitude,
  };
}