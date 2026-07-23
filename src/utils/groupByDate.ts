import { format, isToday, isYesterday, parseISO, startOfDay } from 'date-fns';

export interface DateGroup<T> {
  title: string;
  key: string;
  data: T[];
}

export function formatDateSectionTitle(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export function groupItemsByDate<T extends { createdAt: string }>(items: T[]): DateGroup<T>[] {
  const map = new Map<string, { title: string; items: T[] }>();

  for (const item of items) {
    const day = startOfDay(parseISO(item.createdAt));
    const key = day.toISOString();
    const title = formatDateSectionTitle(day);
    const existing = map.get(key);

    if (existing) {
      existing.items.push(item);
    } else {
      map.set(key, { title, items: [item] });
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([key, { title, items }]) => ({
      title,
      key,
      data: items,
    }));
}
