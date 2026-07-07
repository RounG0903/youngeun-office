import { useEffect, useMemo, useState } from "react";
import {
  CLOSE_HOUR,
  doesRangeOverlapBooked,
  filterPastTimeSlots,
  generateTimeSlots,
  getAutoEndBeforeBooked,
  isPastTimeSlot,
} from "@/lib/reservation";

type BookedReservation = {
  startTime: string;
  endTime: string;
};

type TimeRangePickerProps = {
  date: string;
  startTime: string;
  endTime: string;
  bookedSlots?: string[];
  bookedReservations?: BookedReservation[];
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
};

const CLOSE_TIME = `${String(CLOSE_HOUR).padStart(2, "0")}:00`;

function slotToMinutes(slot: string): number {
  const [hour, minute] = slot.split(":").map(Number);
  return hour * 60 + minute;
}

export function TimeRangePicker({
  date,
  startTime,
  endTime,
  bookedSlots = [],
  bookedReservations = [],
  onStartChange,
  onEndChange,
}: TimeRangePickerProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const allSlots = useMemo(() => generateTimeSlots(), []);
  const timelineSlots = useMemo(() => [...allSlots, CLOSE_TIME], [allSlots]);

  const availableStartSlots = useMemo(
    () => new Set(filterPastTimeSlots(date, allSlots, now)),
    [allSlots, date, now],
  );

  const bookedSlotSet = useMemo(() => new Set(bookedSlots), [bookedSlots]);

  const parsedReservations = useMemo(
    () =>
      bookedReservations.map((reservation) => ({
        startTime: new Date(reservation.startTime),
        endTime: new Date(reservation.endTime),
      })),
    [bookedReservations],
  );

  const startMinutes = startTime ? slotToMinutes(startTime) : null;
  const endMinutes = endTime ? slotToMinutes(endTime) : null;

  function isSlotDisabled(slot: string): boolean {
    if (isPastTimeSlot(date, slot, now)) return true;

    const minutes = slotToMinutes(slot);
    const isClose = slot === CLOSE_TIME;

    if (bookedSlotSet.has(slot)) return true;

    if (!startTime) {
      return isClose || !availableStartSlots.has(slot);
    }

    const startMin = slotToMinutes(startTime);

    if (!endTime) {
      if (minutes > startMin) {
        return doesRangeOverlapBooked(startTime, slot, parsedReservations);
      }
      return !availableStartSlots.has(slot);
    }

    if (availableStartSlots.has(slot) && !bookedSlotSet.has(slot)) return false;
    if (minutes > startMin) {
      return doesRangeOverlapBooked(startTime, slot, parsedReservations);
    }
    return true;
  }

  function handleSlotClick(slot: string) {
    if (isSlotDisabled(slot)) return;

    const minutes = slotToMinutes(slot);
    const canBeStart = availableStartSlots.has(slot) && !bookedSlotSet.has(slot);

    if (!startTime) {
      if (canBeStart) onStartChange(slot);
      return;
    }

    const startMin = slotToMinutes(startTime);

    if (!endTime) {
      if (slot === startTime) {
        const autoEnd = getAutoEndBeforeBooked(startTime, allSlots, bookedSlots, CLOSE_TIME);
        if (
          autoEnd &&
          !doesRangeOverlapBooked(startTime, autoEnd, parsedReservations)
        ) {
          onEndChange(autoEnd);
        }
        return;
      }
      if (minutes > startMin) {
        onEndChange(slot);
      } else if (canBeStart) {
        onStartChange(slot);
      }
      return;
    }

    if (canBeStart) {
      onStartChange(slot);
      onEndChange("");
    } else if (minutes > startMin) {
      onEndChange(slot);
    }
  }

  function getSlotState(slot: string) {
    const minutes = slotToMinutes(slot);
    const isPast = isPastTimeSlot(date, slot, now);
    return {
      isPast,
      isBooked: !isPast && bookedSlotSet.has(slot),
      isStart: slot === startTime,
      isEnd: slot === endTime,
      inRange:
        !isPast &&
        startMinutes !== null &&
        endMinutes !== null &&
        minutes > startMinutes &&
        minutes < endMinutes,
    };
  }

  return (
    <div className="time-range-picker">
      <div className="time-range-header">
        <span className="time-range-summary">
          <strong>시작</strong> {startTime || "미선택"}
        </span>
        <span className="time-range-divider">→</span>
        <span className="time-range-summary">
          <strong>종료</strong> {endTime || "미선택"}
        </span>
      </div>

      <div className="time-range-scroll" role="group" aria-label="예약 시간 선택">
        {timelineSlots.map((slot) => {
          const disabled = isSlotDisabled(slot);
          const { isPast, isBooked, isStart, isEnd, inRange } = getSlotState(slot);

          return (
            <button
              key={slot}
              type="button"
              className={[
                "time-range-btn",
                isPast ? "time-range-btn-past" : "",
                isBooked ? "time-range-btn-booked" : "",
                isStart ? "time-range-btn-start" : "",
                isEnd ? "time-range-btn-end" : "",
                inRange ? "time-range-btn-in-range" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleSlotClick(slot)}
              disabled={disabled}
              aria-pressed={isStart || isEnd}
              title={
                isPast
                  ? "지난 시간입니다"
                  : isBooked
                    ? "이미 예약된 시간입니다"
                    : isStart && !endTime
                      ? "다시 눌러 다음 예약 직전까지 선택"
                      : undefined
              }
            >
              {slot}
            </button>
          );
        })}
      </div>

      <p className="time-range-hint">
        시작 시간을 클릭한 뒤 종료 시간을 클릭하세요 · 같은 시작 시간을 다시 누르면 다음
        예약 직전까지 자동 선택 · 06:00~22:00 · 회색은 지난 시간 · 붉은색은 예약 불가
      </p>
    </div>
  );
}
