"use client";

import { BarChart3 } from "lucide-react";
import { Bar, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SERIES } from "@/lib/constants";
import { monthlySeries } from "@/lib/finance";
import { formatBRL, formatCompact } from "@/lib/format";
import type { FinanceState, Period } from "@/lib/types";
import { Card } from "./ui/Card";
import { ChartTooltipBox } from "./ui/ChartTooltip";

const LEGEND = [
  { key: "receita", name: "Receitas", color: SERIES.blue, kind: "bar" as const },
  { key: "despesa", name: "Despesas", color: SERIES.orange, kind: "bar" as const },
  { key: "acumulado", name: "Saldo acumulado", color: SERIES.aqua, kind: "line" as const },
];

export function MonthlyChart({ state, period, onSelect }: { state: FinanceState; period: Period; onSelect: (i: number) => void }) {
  const data = monthlySeries(state);
  const dim = (i: number) => (period === "all" || period === i ? 1 : 0.4);

  return (
    <Card
      icon={BarChart3}
      title="Comparativo mensal"
      subtitle={`Receitas vs. despesas ${state.extraEnabled ? "com" : "sem"} a entrada extra · clique em um mês para filtrar`}
      actions={
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-2">
          {LEGEND.map((l) => (
            <li key={l.key} className="flex items-center gap-1.5">
              <span className={l.kind === "line" ? "h-0.5 w-3.5 rounded" : "size-2.5 rounded-sm"} style={{ background: l.color }} />
              {l.name}
            </li>
          ))}
        </ul>
      }
    >
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            barGap={2}
            barCategoryGap="22%"
            onClick={(e) => {
              const i = Number((e as { activeTooltipIndex?: number | string } | undefined)?.activeTooltipIndex);
              if (Number.isInteger(i) && i >= 0) onSelect(i);
            }}
          >
            <CartesianGrid vertical={false} stroke="#2e2e2b" strokeDasharray="0" />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#3a3a37" }} tick={{ fill: "#c3c2b7", fontSize: 12 }} />
            <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} tick={{ fill: "#8f8e86", fontSize: 11 }} width={72} />
            <ReferenceLine y={0} stroke="#5a5a55" />
            <Tooltip
              cursor={{ fill: "rgba(240,239,236,0.04)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as (typeof data)[number];
                return (
                  <ChartTooltipBox
                    title={String(label)}
                    rows={LEGEND.map((l) => ({ name: l.name, value: p[l.key as keyof typeof p] as number, color: l.color, kind: l.kind }))}
                    footer={`Saldo do mês: ${formatBRL(p.saldo)}`}
                  />
                );
              }}
            />
            <Bar dataKey="receita" name="Receitas" fill={SERIES.blue} radius={[4, 4, 0, 0]} maxBarSize={44} cursor="pointer">
              {data.map((d) => (
                <Cell key={d.label} fillOpacity={dim(d.index)} />
              ))}
            </Bar>
            <Bar dataKey="despesa" name="Despesas" fill={SERIES.orange} radius={[4, 4, 0, 0]} maxBarSize={44} cursor="pointer">
              {data.map((d) => (
                <Cell key={d.label} fillOpacity={dim(d.index)} />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="acumulado"
              name="Saldo acumulado"
              stroke={SERIES.aqua}
              strokeWidth={2}
              dot={{ r: 4, fill: SERIES.aqua, stroke: "#1a1a19", strokeWidth: 2 }}
              activeDot={{ r: 6, stroke: "#1a1a19", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
