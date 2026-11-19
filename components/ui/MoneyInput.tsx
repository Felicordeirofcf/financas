"use client";

import { useEffect, useState } from "react";
import { formatNumber, parseBRL } from "@/lib/format";

/**
 * Campo monetário com edição inline: mostra "1.234,56", aceita vírgula ou ponto,
 * confirma no blur/Enter e cancela com Esc.
 */
export function MoneyInput({
  value,
  onCommit,
  ariaLabel,
  className = "",
  highlight = false,
}: {
  value: number;
  onCommit: (v: number) => void;
  ariaLabel: string;
  className?: string;
  highlight?: boolean;
}) {
  const [draft, setDraft] = useState(formatNumber(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(formatNumber(value));
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    const v = parseBRL(draft);
    if (v !== value) onCommit(v);
    setDraft(formatNumber(v));
  };

  return (
    <input
      inputMode="decimal"
      aria-label={ariaLabel}
      value={draft}
      onFocus={(e) => {
        setEditing(true);
        e.currentTarget.select();
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(formatNumber(value));
          setEditing(false);
          e.currentTarget.blur();
        }
      }}
      className={`tabular w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-right text-[13px] outline-none transition hover:border-line focus:border-accent focus:bg-page ${
        value === 0 ? "text-ink-3" : highlight ? "text-ink font-medium" : "text-ink-2"
      } ${className}`}
    />
  );
}
