import { APP_TIMEZONE, combineDateAndTime, getDateStringInTimezone } from "@/lib/reservation";

export function shiftDate(date: string, days: number): string {
  const anchor = combineDateAndTime(date, "12:00");
  return getDateStringInTimezone(new Date(anchor.getTime() + days * 86_400_000));
}

export function formatDateLabel(date: string): string {
  const value = combineDateAndTime(date, "12:00");
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: APP_TIMEZONE,
  }).format(value);
}
