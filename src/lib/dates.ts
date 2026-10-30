const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function today() {
  return toDateString(new Date());
}

/** Parses YYYY-MM-DD as a local date. Returns null if it's not a real calendar date. */
export function parseDate(text: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  return toDateString(date) === text.trim() ? date : null;
}

/** Whole days from today until the given YYYY-MM-DD date; negative once it has passed. */
export function daysUntil(dateString: string) {
  const date = parseDate(dateString);
  if (!date) return null;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((date.getTime() - startOfToday.getTime()) / DAY_MS);
}

/** Adds whole months, keeping the day where the month allows it (Jan 31 + 1 month → Feb 28). */
export function addMonths(dateString: string, months: number) {
  const date = parseDate(dateString);
  if (!date) return null;
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return toDateString(target);
}
