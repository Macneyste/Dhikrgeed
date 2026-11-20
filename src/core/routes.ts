// Allowlist for routes that come from outside the app (notifications, deep links).

import { isValidId } from './validation.ts';

const NOTIFICATION_ROUTES: Record<string, string> = {
  'after-prayer': '/session/after-prayer',
  home: '/',
};

/** Maps notification data to an in-app path, or null when it is not allowed. */
export function routeFromNotificationData(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const route = (data as { route?: unknown }).route;
  if (typeof route !== 'string' || !Object.prototype.hasOwnProperty.call(NOTIFICATION_ROUTES, route)) return null;
  return NOTIFICATION_ROUTES[route]!;
}

/** Validates an id that arrives as a route parameter. */
export function safeRouteId(value: unknown): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return isValidId(v) ? v : null;
}

const STATIC_PATHS = new Set(['/', '/welcome', '/library', '/prayers', '/history', '/settings', '/custom-dhikr']);
const ID_PATHS = /^\/(collection|session)\/([^/?#]+)$/;

/**
 * Validates a path arriving from outside the app (deep link or intent).
 * Returns the path when it is on the allowlist, otherwise "/".
 */
export function allowedIncomingPath(raw: string): string {
  let path = raw;
  try {
    // Accept "dhikrgeed://session/tasbih" as well as "/session/tasbih".
    const schemeMatch = /^[a-z][a-z0-9+.-]*:\/\/(.*)$/i.exec(raw);
    if (schemeMatch) path = `/${schemeMatch[1]}`;
    path = decodeURIComponent(path.split(/[?#]/)[0] ?? '/');
  } catch {
    return '/';
  }
  path = path.replace(/\/{2,}/g, '/');
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  if (STATIC_PATHS.has(path)) return path;
  const m = ID_PATHS.exec(path);
  if (m && isValidId(m[2])) return `/${m[1]}/${m[2]}`;
  return '/';
}
