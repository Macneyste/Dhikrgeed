// Manual city list for prayer times. No location permission is ever used.

export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const CITIES: readonly City[] = [
  { id: 'muqdisho', name: 'Muqdisho', lat: 2.0469, lng: 45.3182 },
  { id: 'hargeysa', name: 'Hargeysa', lat: 9.56, lng: 44.065 },
  { id: 'garoowe', name: 'Garoowe', lat: 8.4054, lng: 48.4845 },
  { id: 'kismaayo', name: 'Kismaayo', lat: -0.3582, lng: 42.5454 },
  { id: 'baydhabo', name: 'Baydhabo', lat: 3.1191, lng: 43.65 },
  { id: 'boosaaso', name: 'Boosaaso', lat: 11.2842, lng: 49.1816 },
  { id: 'beledweyne', name: 'Beledweyne', lat: 4.7358, lng: 45.2036 },
  { id: 'nairobi', name: 'Nairobi', lat: -1.2921, lng: 36.8219 },
];

export const CUSTOM_CITY_ID = 'custom';

export interface CustomCity {
  name: string;
  lat: number;
  lng: number;
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -66 && lat <= 66 && lng >= -180 && lng <= 180;
}

/** Parses the stored custom city JSON; returns null when missing or invalid. */
export function parseCustomCity(json: string | null | undefined): CustomCity | null {
  if (!json) return null;
  try {
    const raw = JSON.parse(json) as Partial<CustomCity> | null;
    if (!raw || typeof raw.name !== 'string') return null;
    const lat = Number(raw.lat);
    const lng = Number(raw.lng);
    if (!isValidCoordinate(lat, lng)) return null;
    const name = raw.name.trim().slice(0, 40) || 'Magaalo kale';
    return { name, lat, lng };
  } catch {
    return null;
  }
}

/** The city to use: a listed city, the custom one, or Muqdisho as fallback. */
export function resolveCity(cityId: string, customJson: string | null): City {
  if (cityId === CUSTOM_CITY_ID) {
    const custom = parseCustomCity(customJson);
    if (custom) return { id: CUSTOM_CITY_ID, ...custom };
  }
  return CITIES.find((c) => c.id === cityId) ?? CITIES[0]!;
}
