"use client";

import { useEffect, useState } from "react";

export function TextInput({ value, onCommit, ariaLabel, className = "" }: { value: string; onCommit: (v: string) => void; ariaLabel: string; className?: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <input
      aria-label={ariaLabel}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const v = draft.trim() || value;
        setDraft(v);
        if (v !== value) onCommit(v);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(value);
          e.currentTarget.blur();
        }
      }}
      className={`w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-[13px] text-ink outline-none transition hover:border-line focus:border-accent focus:bg-page ${className}`}
    />
  );
}
