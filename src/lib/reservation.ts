export const OPEN_HOUR = 6;
export const CLOSE_HOUR = 22;
export const SLOT_MINUTES = 30;
export const CANCEL_DEADLINE_MINUTES = 30;
export const CHECKIN_WINDOW_MINUTES_BEFORE = 30;
export const CHECKIN_WINDOW_MINUTES_AFTER = 15;
export const PENALTY_DAYS = 14;
export const APP_TIMEZONE = "Asia/Seoul";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function getZonedParts(date: Date, timeZone = APP_TIMEZONE): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
  };
}

export function getDateStringInTimezone(date: Date, timeZone = APP_TIMEZONE): string {
  const { year, month, day } = getZonedParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getMinutesInTimezone(date: Date, timeZone = APP_TIMEZONE): number {
  const { hour, minute } = getZonedParts(date, timeZone);
  return hour * 60 + minute;
}

function addDaysToDateString(date: string, days: number): string {
  const anchor = combineDateAndTime(date, "12:00");
  return getDateStringInTimezone(new Date(anchor.getTime() + days * 86_400_000));
}

export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    for (const minute of [0, 30]) {
      slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }
  return slots;
}

export function combineDateAndTime(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute, 0, 0));
}

export function isSlotInBusinessHours(start: Date, end: Date): boolean {
  const startMinutes = getMinutesInTimezone(start);
  const endMinutes = getMinutesInTimezone(end);
  const openMinutes = OPEN_HOUR * 60;
  const closeMinutes = CLOSE_HOUR * 60;

  return (
    startMinutes >= openMinutes &&
    endMinutes <= closeMinutes &&
    startMinutes % SLOT_MINUTES === 0 &&
    endMinutes % SLOT_MINUTES === 0 &&
    end > start
  );
}

export function isFutureReservation(start: Date, now = new Date()): boolean {
  return start.getTime() > now.getTime();
}

export function canCancelReservation(start: Date, now = new Date()): boolean {
  const deadline = start.getTime() - CANCEL_DEADLINE_MINUTES * 60 * 1000;
  return now.getTime() < deadline;
}

export function isWithinCheckinWindow(start: Date, end: Date, now = new Date()): boolean {
  const windowStart = start.getTime() - CHECKIN_WINDOW_MINUTES_BEFORE * 60 * 1000;
  const windowEnd = end.getTime() + CHECKIN_WINDOW_MINUTES_AFTER * 60 * 1000;
  return now.getTime() >= windowStart && now.getTime() <= windowEnd;
}

export function addPenaltyDays(from = new Date()): Date {
  const until = new Date(from);
  until.setDate(until.getDate() + PENALTY_DAYS);
  return until;
}

export function isUnderPenalty(penaltyUntil: Date | null | undefined, now = new Date()): boolean {
  if (!penaltyUntil) return false;
  return penaltyUntil.getTime() > now.getTime();
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatTimeRange(start: Date, end: Date): string {
  const datePart = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(start);

  const timeFmt = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${datePart} ${timeFmt.format(start)} ~ ${timeFmt.format(end)}`;
}

export function getMinSelectableDate(now = new Date()): string {
  return getDateStringInTimezone(now);
}

export function filterPastTimeSlots(date: string, slots: string[], now = new Date()): string[] {
  const today = getMinSelectableDate(now);
  if (date > today) return slots;
  if (date < today) return [];

  const currentMinutes = getMinutesInTimezone(now);
  return slots.filter((slot) => slotToMinutesValue(slot) > currentMinutes);
}

export function isPastTimeSlot(date: string, slot: string, now = new Date()): boolean {
  const today = getMinSelectableDate(now);
  if (date > today) return false;
  if (date < today) return true;

  return slotToMinutesValue(slot) <= getMinutesInTimezone(now);
}

export function filterEndTimeSlots(startTime: string, slots: string[]): string[] {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const startTotal = startHour * 60 + startMinute;
  return slots.filter((slot) => {
    const [hour, minute] = slot.split(":").map(Number);
    return hour * 60 + minute > startTotal;
  });
}

export function getReservationStatusLabel(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "예정";
    case "CANCELLED":
      return "취소됨";
    case "COMPLETED":
      return "이용 완료";
    case "NO_SHOW":
      return "노쇼 (패널티)";
    default:
      return status;
  }
}

export function isUpcomingReservation(
  startTime: Date,
  status: string,
  now = new Date(),
): boolean {
  return status === "ACTIVE" && startTime.getTime() > now.getTime();
}

function slotToMinutesValue(slot: string): number {
  const [hour, minute] = slot.split(":").map(Number);
  return hour * 60 + minute;
}

export function getBookedSlots(
  reservations: { startTime: Date; endTime: Date }[],
  slots: string[] = generateTimeSlots(),
): string[] {
  const booked = new Set<string>();

  for (const reservation of reservations) {
    const startMin = getMinutesInTimezone(reservation.startTime);
    const endMin = getMinutesInTimezone(reservation.endTime);

    for (const slot of slots) {
      const slotMin = slotToMinutesValue(slot);
      if (slotMin >= startMin && slotMin < endMin) {
        booked.add(slot);
      }
    }
  }

  return [...booked].sort();
}

export function doesRangeOverlapBooked(
  startTime: string,
  endTime: string,
  reservations: { startTime: Date; endTime: Date }[],
): boolean {
  const rangeStart = slotToMinutesValue(startTime);
  const rangeEnd = slotToMinutesValue(endTime);

  return reservations.some((reservation) => {
    const bookedStart = getMinutesInTimezone(reservation.startTime);
    const bookedEnd = getMinutesInTimezone(reservation.endTime);
    return bookedStart < rangeEnd && bookedEnd > rangeStart;
  });
}

export function getAutoEndBeforeBooked(
  startTime: string,
  slots: string[] = generateTimeSlots(),
  bookedSlots: string[] = [],
  closeTime = `${String(CLOSE_HOUR).padStart(2, "0")}:00`,
): string | null {
  const bookedSet = new Set(bookedSlots);
  const startMin = slotToMinutesValue(startTime);

  for (const slot of slots) {
    const slotMin = slotToMinutesValue(slot);
    if (slotMin > startMin && bookedSet.has(slot)) {
      return slot;
    }
  }

  const nextSlot = slots.find((slot) => slotToMinutesValue(slot) > startMin);
  return nextSlot ?? closeTime;
}

export function getDayBounds(date: string): { dayStart: Date; dayEnd: Date } {
  return {
    dayStart: combineDateAndTime(date, "00:00"),
    dayEnd: combineDateAndTime(addDaysToDateString(date, 1), "00:00"),
  };
}
