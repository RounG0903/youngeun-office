export const OPEN_HOUR = 6;
export const CLOSE_HOUR = 22;
export const SLOT_MINUTES = 30;
export const CANCEL_DEADLINE_MINUTES = 30;
export const CHECKIN_WINDOW_MINUTES_BEFORE = 30;
export const CHECKIN_WINDOW_MINUTES_AFTER = 15;
export const PENALTY_DAYS = 14;

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
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function isSlotInBusinessHours(start: Date, end: Date): boolean {
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
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
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function filterPastTimeSlots(date: string, slots: string[], now = new Date()): string[] {
  const today = getMinSelectableDate(now);
  if (date > today) return slots;
  if (date < today) return [];

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return slots.filter((slot) => {
    const [hour, minute] = slot.split(":").map(Number);
    return hour * 60 + minute > currentMinutes;
  });
}

export function isPastTimeSlot(date: string, slot: string, now = new Date()): boolean {
  const today = getMinSelectableDate(now);
  if (date > today) return false;
  if (date < today) return true;

  const [hour, minute] = slot.split(":").map(Number);
  const slotMinutes = hour * 60 + minute;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return slotMinutes <= currentMinutes;
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
    const startMin =
      reservation.startTime.getHours() * 60 + reservation.startTime.getMinutes();
    const endMin = reservation.endTime.getHours() * 60 + reservation.endTime.getMinutes();

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
    const bookedStart =
      reservation.startTime.getHours() * 60 + reservation.startTime.getMinutes();
    const bookedEnd = reservation.endTime.getHours() * 60 + reservation.endTime.getMinutes();
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
  const [year, month, day] = date.split("-").map(Number);
  const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
  const dayEnd = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
  return { dayStart, dayEnd };
}
