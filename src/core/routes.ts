// Allowlist for routes that come from outside the app (notifications, deep links).

import { isValidId } from './validation.ts';

const NOTIFICATION_ROUTES: Record<string, string> = {
  'after-prayer': '/session/after-prayer',
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
