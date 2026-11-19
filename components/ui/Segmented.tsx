"use client";

interface Option<T> {
  value: T;
  label: string;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "md",
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex flex-wrap rounded-xl border border-line bg-surface-2 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`rounded-lg font-medium transition focus-visible:outline-2 focus-visible:outline-accent ${
              size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
            } ${active ? "bg-ink text-page shadow-sm" : "text-ink-2 hover:text-ink"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
