"use client";

import { useRef, useState } from "react";

type SwipeableRowProps = {
  children: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
};

const ACTION_WIDTH = 88;
const OPEN_THRESHOLD = 44;
const DRAG_THRESHOLD = 6;

export function SwipeableRow({
  children,
  actionLabel,
  onAction,
  disabled = false,
}: SwipeableRowProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const dragging = useRef(false);
  const moved = useRef(false);

  function clampOffset(value: number) {
    return Math.max(0, Math.min(ACTION_WIDTH, value));
  }

  function handlePointerDown(clientX: number) {
    if (disabled) return;
    dragging.current = true;
    moved.current = false;
    startX.current = clientX;
    startOffset.current = offset;
  }

  function handlePointerMove(clientX: number) {
    if (!dragging.current || disabled) return;
    const delta = startX.current - clientX;
    if (Math.abs(delta) > DRAG_THRESHOLD) {
      moved.current = true;
    }
    setOffset(clampOffset(startOffset.current + delta));
  }

  function handlePointerEnd() {
    if (!dragging.current) return;
    dragging.current = false;
    setOffset(offset >= OPEN_THRESHOLD ? ACTION_WIDTH : 0);
  }

  function close() {
    setOffset(0);
  }

  function handleAction() {
    onAction();
    close();
  }

  function blockClickIfDragged(event: React.MouseEvent) {
    if (moved.current) {
      event.preventDefault();
      event.stopPropagation();
      moved.current = false;
    }
  }

  return (
    <div className={`swipe-row ${disabled ? "swipe-row-disabled" : ""}`}>
      <button
        type="button"
        className="swipe-row-action"
        onClick={handleAction}
        disabled={disabled}
        aria-label={actionLabel}
      >
        {actionLabel}
      </button>
      <div
        className="swipe-row-content"
        style={{ transform: `translateX(-${offset}px)` }}
        onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
        onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
        onTouchEnd={handlePointerEnd}
        onMouseDown={(e) => handlePointerDown(e.clientX)}
        onMouseMove={(e) => {
          if (dragging.current) handlePointerMove(e.clientX);
        }}
        onMouseUp={handlePointerEnd}
        onMouseLeave={() => {
          if (dragging.current) handlePointerEnd();
        }}
        onClickCapture={blockClickIfDragged}
      >
        {children}
      </div>
    </div>
  );
}
