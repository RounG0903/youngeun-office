import { useMemo } from "react";
import {
  CLOSE_HOUR,
  filterPastTimeSlots,
  generateTimeSlots,
} from "@/lib/reservation";

type TimeRangePickerProps = {
  date: string;
  startTime: string;
  endTime: string;
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
  onStartChange,
  onEndChange,
}: TimeRangePickerProps) {
  const allSlots = useMemo(() => generateTimeSlots(), []);
  const timelineSlots = useMemo(() => [...allSlots, CLOSE_TIME], [allSlots]);

  const availableStartSlots = useMemo(
    () => new Set(filterPastTimeSlots(date, allSlots)),
    [allSlots, date],
  );

  const startMinutes = startTime ? slotToMinutes(startTime) : null;
  const endMinutes = endTime ? slotToMinutes(endTime) : null;

  function isSlotDisabled(slot: string): boolean {
    const minutes = slotToMinutes(slot);
    const isClose = slot === CLOSE_TIME;

    if (!startTime) {
      return isClose || !availableStartSlots.has(slot);
    }

    const startMin = slotToMinutes(startTime);

    if (!endTime) {
      if (minutes > startMin) return false;
      return !availableStartSlots.has(slot);
    }

    if (availableStartSlots.has(slot)) return false;
    if (minutes > startMin) return false;
    return true;
  }

  function handleSlotClick(slot: string) {
    if (isSlotDisabled(slot)) return;

    const minutes = slotToMinutes(slot);
    const canBeStart = availableStartSlots.has(slot);

    if (!startTime) {
      if (canBeStart) onStartChange(slot);
      return;
    }

    const startMin = slotToMinutes(startTime);

    if (!endTime) {
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
    return {
      isStart: slot === startTime,
      isEnd: slot === endTime,
      inRange:
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
          const { isStart, isEnd, inRange } = getSlotState(slot);

          return (
            <button
              key={slot}
              type="button"
              className={[
                "time-range-btn",
                isStart ? "time-range-btn-start" : "",
                isEnd ? "time-range-btn-end" : "",
                inRange ? "time-range-btn-in-range" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleSlotClick(slot)}
              disabled={disabled}
              aria-pressed={isStart || isEnd}
            >
              {slot}
            </button>
          );
        })}
      </div>

      <p className="time-range-hint">
        하나의 타임라인에서 시작 시간을 클릭한 뒤 종료 시간을 클릭하세요 · 06:00~22:00
      </p>
    </div>
  );
}
