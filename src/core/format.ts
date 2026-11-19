// Somali date/time formatting helpers. Dates are shown in the phone's local time.

export const SOMALI_WEEKDAYS_SHORT = ['Axd', 'Isn', 'Tal', 'Arb', 'Kha', 'Jim', 'Sab'] as const; // index = Date.getDay()

export const SOMALI_MONTHS = [
  'Janaayo',
  'Febraayo',
  'Maarso',
  'Abriil',
  'May',
  'Juun',
  'Luulyo',
  'Ogost',
  'Sebtembar',
  'Oktoobar',
  'Nofembar',
  'Desembar',
] as const;

const pad = (n: number) => String(n).padStart(2, '0');

/** "3:12" style 12-hour time without am/pm, as used in the designs. */
export function formatTime(date: Date): string {
  const h = date.getHours() % 12 === 0 ? 12 : date.getHours() % 12;
  return `${h}:${pad(date.getMinutes())}`;
}

/** "1 saac 20 daqiiqo", "45 daqiiqo", "2 saac". */
export function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} daqiiqo`;
  if (minutes === 0) return `${hours} saac`;
  return `${hours} saac ${minutes} daqiiqo`;
}

/** Local calendar day key, e.g. "2026-11-19". */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

/** "MAANTA", "SHALAY" or "19 Nofembar 2026" for older days. */
export function dayGroupLabel(date: Date, now: Date): string {
  const key = dayKey(date);
  if (key === dayKey(now)) return 'MAANTA';
  if (key === dayKey(addDays(now, -1))) return 'SHALAY';
  return `${date.getDate()} ${SOMALI_MONTHS[date.getMonth()]} ${date.getFullYear()}`.toUpperCase();
}

/** The 7 local days of the week containing `now`, Saturday first. */
export function weekDays(now: Date): Date[] {
  const today = startOfDay(now);
  const sinceSaturday = (today.getDay() + 1) % 7; // Sat=0 … Fri=6
  const saturday = addDays(today, -sinceSaturday);
  return Array.from({ length: 7 }, (_, i) => addDays(saturday, i));
}
