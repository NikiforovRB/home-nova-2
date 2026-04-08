"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ModalCloseButton } from "@/components/modal-close-button";

function getMonthDays(base: Date) {
  const year = base.getFullYear();
  const month = base.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = (first.getDay() + 6) % 7;
  const days: Array<Date | null> = [];
  for (let i = 0; i < startDay; i += 1) days.push(null);
  for (let d = 1; d <= last.getDate(); d += 1) days.push(new Date(year, month, d));
  return days;
}

function sameDate(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function CalendarPanel() {
  const [selected, setSelected] = useState<Date | null>(null);
  const base = new Date();
  const next = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  const today = new Date();

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {[base, next].map((month) => (
          <div key={`${month.getFullYear()}-${month.getMonth()}`}>
            <div className="mb-3 text-sm font-medium">
              {month.toLocaleString("ru-RU", { month: "long", year: "numeric" })}
            </div>
            <div className="mb-2 grid grid-cols-7 text-center text-xs text-[#757575]">
              {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {getMonthDays(month).map((day, idx) =>
                day ? (
                  <button
                    key={`${month.getMonth()}-${day.getDate()}`}
                    type="button"
                    onClick={() => setSelected(day)}
                    className="h-9 rounded-[8px] text-sm hover:bg-[#f2f1f0]"
                    style={{
                      border: sameDate(day, today) ? "1px solid #c7c6c5" : "1px solid transparent",
                      backgroundColor:
                        selected && sameDate(day, selected) ? "var(--field-bg)" : "transparent",
                    }}
                  >
                    {day.getDate()}
                  </button>
                ) : (
                  <span key={`empty-${idx}`} className="h-9" />
                ),
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {["Точные даты", "+- 1 день", "+- 2 дня", "+- 3 дня", "+- 7 дней", "+- 14 дней"].map(
          (label) => (
            <button
              key={label}
              type="button"
              className="rounded-[8px] border border-transparent bg-[#f2f1f0] px-3 py-2 text-sm hover:border-[#c7c6c5]"
            >
              {label}
            </button>
          ),
        )}
      </div>
    </>
  );
}

export function DateRangeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const root = dialogRef.current;
    if (!root) return;

    const focusables = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);

    requestAnimationFrame(() => {
      const list = focusables();
      list[0]?.focus();
    });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !root) return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[8px] border border-[#e8e8e8] bg-white p-6 shadow-sm sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold">
            Даты
          </h2>
          <ModalCloseButton onClose={onClose} />
        </div>
        <CalendarPanel />
        <button type="button" className="btn-accent mt-4 w-full" onClick={onClose}>
          Готово
        </button>
      </div>
    </div>
  );
}
