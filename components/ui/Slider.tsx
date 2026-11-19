"use client";

import type { ReactNode } from "react";

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
  hint,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
  hint?: ReactNode;
}) {
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <label className="block">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-ink-2">{label}</span>
        <span className="tabular rounded-md bg-surface-2 px-2 py-0.5 text-xs font-semibold text-ink">{display}</span>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ["--fill" as string]: `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="mt-1.5 text-[11px] text-ink-3">{hint}</p>}
    </label>
  );
}
