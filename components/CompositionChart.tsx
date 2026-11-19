"use client";

import { PieChart as PieIcon } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GROUPS, SERIES } from "@/lib/constants";
import { expenseValue, groupTotals, periodExpense, periodLabel } from "@/lib/finance";
import { formatBRL, formatCompact, formatPct } from "@/lib/format";
import type { FinanceState, Period } from "@/lib/types";
import { Card } from "./ui/Card";
import { ChartTooltipBox } from "./ui/ChartTooltip";
import { Segmented } from "./ui/Segmented";

const TOP_N = 8;

export function CompositionChart({ state, period }: { state: FinanceState; period: Period }) {
  const [view, setView] = useState<"grupos" | "categorias">("grupos");
  const total = periodExpense(state, period);
  const groups = groupTotals(state, period).filter((g) => g.value > 0);

  const items = state.expenses
    .map((e) => ({ name: e.name, value: expenseValue(e, period, state), color: GROUPS[e.group].color, group: e.group }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);
  const top = items.slice(0, TOP_N);
  const rest = items.slice(TOP_N).reduce((a, x) => a + x.value, 0);
  const bars = rest > 0 ? [...top, { name: `Outros (${items.length - TOP_N})`, value: rest, color: SERIES.neutral, group: null }] : top;

  return (
    <Card
      icon={PieIcon}
      title="Composição de gastos"
      subtitle={periodLabel(state, period)}
      actions={
        <Segmented
          size="sm"
          ariaLabel="Visão da composição"
          value={view}
          onChange={setView}
          options={[
            { value: "grupos", label: "Grupos" },
            { value: "categorias", label: "Categorias" },
          ]}
        />
      }
    >
      {total === 0 ? (
        <p className="grid h-72 place-items-center text-sm text-ink-3">Sem despesas lançadas neste período.</p>
      ) : view === "grupos" ? (
        <div className="grid h-auto grid-cols-1 items-center gap-4 sm:grid-cols-[180px_1fr] sm:h-72">
          <div className="relative mx-auto h-44 w-44">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={groups}
                  dataKey="value"
                  nameKey="group"
                  innerRadius={58}
                  outerRadius={84}
                  paddingAngle={2}
                  stroke="#1a1a19"
                  strokeWidth={2}
                  startAngle={90}
                  endAngle={-270}
                >
                  {groups.map((g) => (
                    <Cell key={g.group} fill={GROUPS[g.group].color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const g = payload[0].payload as (typeof groups)[number];
                    return (
                      <ChartTooltipBox
                        title={GROUPS[g.group].label}
                        rows={[{ name: "Total", value: g.value, color: GROUPS[g.group].color }]}
                        footer={`${formatPct((g.value / total) * 100)} das despesas`}
                      />
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-ink-3">Total</p>
                <p className="tabular text-sm font-semibold">{formatCompact(total)}</p>
              </div>
            </div>
          </div>
          <ul className="space-y-2.5">
            {groups.map((g) => (
              <li key={g.group}>
                <div className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="flex items-center gap-2 text-ink-2">
                    <span className="size-2.5 rounded-sm" style={{ background: GROUPS[g.group].color }} />
                    {GROUPS[g.group].label}
                  </span>
                  <span className="tabular text-ink">{formatBRL(g.value)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full" style={{ width: `${(g.value / total) * 100}%`, background: GROUPS[g.group].color }} />
                  </div>
                  <span className="tabular w-11 text-right text-[11px] text-ink-3">{formatPct((g.value / total) * 100)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="h-72">
          <ul className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-2">
            {Object.values(GROUPS).map((g) => (
              <li key={g.label} className="flex items-center gap-1.5">
                <span className="size-2 rounded-sm" style={{ background: g.color }} />
                {g.short}
              </li>
            ))}
          </ul>
          <ResponsiveContainer height="90%">
            <BarChart data={bars} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }} barCategoryGap={4}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={128}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#c3c2b7", fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(240,239,236,0.04)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const b = payload[0].payload as (typeof bars)[number];
                  return (
                    <ChartTooltipBox
                      title={b.name}
                      rows={[{ name: b.group ? GROUPS[b.group].short : "Demais", value: b.value, color: b.color }]}
                      footer={`${formatPct((b.value / total) * 100)} das despesas`}
                    />
                  );
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
                {bars.map((b) => (
                  <Cell key={b.name} fill={b.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
