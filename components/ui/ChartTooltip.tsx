import { formatBRL } from "@/lib/format";

export interface TooltipRow {
  name: string;
  value: number;
  color: string;
  kind?: "line" | "bar";
}

/** Tooltip compartilhado dos gráficos: valor em destaque, chave em traço da cor da série. */
export function ChartTooltipBox({ title, rows, footer }: { title: string; rows: TooltipRow[]; footer?: string }) {
  return (
    <div className="min-w-44 rounded-xl border border-line bg-[#141413]/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur">
      <p className="mb-1.5 font-medium text-ink-2">{title}</p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-ink-3">
              <span
                className={r.kind === "line" ? "h-0.5 w-3 rounded" : "size-2.5 rounded-sm"}
                style={{ background: r.color }}
              />
              {r.name}
            </span>
            <strong className="tabular font-semibold text-ink">{formatBRL(r.value)}</strong>
          </li>
        ))}
      </ul>
      {footer && <p className="mt-2 border-t border-line pt-1.5 text-[11px] text-ink-3">{footer}</p>}
    </div>
  );
}
