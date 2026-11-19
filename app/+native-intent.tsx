import { allowedIncomingPath } from '@/core/routes';

/** Filters every deep link before Expo Router handles it. */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  return allowedIncomingPath(path);
}
