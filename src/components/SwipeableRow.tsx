"use client";

import { useEffect, useRef, useState } from "react";

type SwipeableRowProps = {
  children: React.ReactNode;
  onDismiss: () => void;
  disabled?: boolean;
  resetKey?: number;
};

const DISMISS_THRESHOLD = 96;
const DRAG_THRESHOLD = 6;

export function SwipeableRow({
  children,
  onDismiss,
  disabled = false,
  resetKey = 0,
}: SwipeableRowProps) {
  const [offset, setOffset] = useState(0);
  const [dismissing, setDismissing] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const dragging = useRef(false);
  const moved = useRef(false);

  useEffect(() => {
    setOffset(0);
    setDismissing(false);
  }, [resetKey]);

  function getMaxOffset() {
    return rowRef.current?.offsetWidth ?? 320;
  }

  function handlePointerDown(clientX: number) {
    if (disabled || dismissing) return;
    dragging.current = true;
    moved.current = false;
    startX.current = clientX;
  }

  function handlePointerMove(clientX: number) {
    if (!dragging.current || disabled || dismissing) return;
    const delta = startX.current - clientX;
    if (Math.abs(delta) > DRAG_THRESHOLD) {
      moved.current = true;
    }
    const next = Math.max(0, Math.min(getMaxOffset(), delta));
    setOffset(next);
  }

  function finishDismiss() {
    setDismissing(true);
    setOffset(getMaxOffset());
    window.setTimeout(() => {
      onDismiss();
    }, 180);
  }

  function handlePointerEnd() {
    if (!dragging.current) return;
    dragging.current = false;

    if (offset >= DISMISS_THRESHOLD) {
      finishDismiss();
      return;
    }

    setOffset(0);
  }

  function blockClickIfDragged(event: React.MouseEvent) {
    if (moved.current) {
      event.preventDefault();
      event.stopPropagation();
      moved.current = false;
    }
  }

  const progress = Math.min(1, offset / DISMISS_THRESHOLD);

  return (
    <div
      ref={rowRef}
      className={`swipe-row ${disabled ? "swipe-row-disabled" : ""} ${
        dismissing ? "swipe-row-dismissing" : ""
      }`}
    >
      <div
        className="swipe-row-hint"
        style={{ opacity: progress }}
        aria-hidden="true"
      >
        삭제
      </div>
      <div
        className="swipe-row-content"
        style={{
          transform: `translateX(-${offset}px)`,
          opacity: 1 - progress * 0.35,
        }}
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
