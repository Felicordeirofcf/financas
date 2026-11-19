"use client";

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition focus-visible:outline-2 focus-visible:outline-accent ${
        checked ? "border-accent bg-accent" : "border-line bg-surface-2"
      }`}
    >
      <span className={`size-3.5 rounded-full bg-ink shadow transition ${checked ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
    </button>
  );
}
