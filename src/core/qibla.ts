// Qibla direction: initial great-circle bearing from a point to the Kaaba,
// in degrees clockwise from true north. Pure. No GPS: the city setting is
// the only location input.

export const KAABA = { lat: 21.4225, lng: 39.8262 } as const;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Bearing 0..360 from (lat, lng) to the Kaaba, or null at the Kaaba itself or for invalid input. */
export function qiblaBearing(lat: number, lng: number): number | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90) return null;
  if (Math.abs(lat - KAABA.lat) < 1e-6 && Math.abs(lng - KAABA.lng) < 1e-6) return null;
  const φ1 = rad(lat);
  const φ2 = rad(KAABA.lat);
  const Δλ = rad(KAABA.lng - lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * How far to turn from the phone's heading to face the qibla, -180..180
 * (positive = turn right).
 */
export function turnToQibla(bearing: number, heading: number): number {
  return ((bearing - heading + 540) % 360) - 180;
}

/** Somali compass point for a bearing: Waqooyi (N), Bari (E), Koonfur (S), Galbeed (W). */
export function compassPoint(bearing: number): string {
  const names = [
    'Waqooyi',
    'Waqooyi-Bari',
    'Bari',
    'Koonfur-Bari',
    'Koonfur',
    'Koonfur-Galbeed',
    'Galbeed',
    'Waqooyi-Galbeed',
  ];
  return names[Math.round((((bearing % 360) + 360) % 360) / 45) % 8]!;
}
