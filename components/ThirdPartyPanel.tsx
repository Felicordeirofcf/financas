"use client";

import { Users } from "lucide-react";
import { SERIES } from "@/lib/constants";
import { expenseFor, expenseValue, periodExpense, periodLabel, thirdPartyTotal } from "@/lib/finance";
import { formatBRL, formatPct } from "@/lib/format";
import type { FinanceState, Period } from "@/lib/types";
import type { FinanceDispatch } from "@/hooks/useFinanceStore";
import { Badge, Card } from "./ui/Card";
import { Toggle } from "./ui/Toggle";

const PERSONAL = SERIES.blue;
const THIRD = SERIES.yellow;

export function ThirdPartyPanel({ state, period, dispatch }: { state: FinanceState; period: Period; dispatch: FinanceDispatch }) {
  const total = periodExpense(state, period);
  const third = thirdPartyTotal(state, period);
  const personal = total - third;
  const tagged = state.expenses.filter((e) => e.isThirdParty);
  const suggestions = state.expenses.filter((e) => !e.isThirdParty && e.group === "terceiros");
  const maxMonth = Math.max(1, ...state.months.map((_, m) => expenseFor(state, m)));

  return (
    <Card
      icon={Users}
      title="Meu gasto vs. terceiros"
      subtitle={`Custo real pessoal separado do que só transita pela conta · ${periodLabel(state, period)}`}
      badge={<Badge tone="accent">Diferencial</Badge>}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-line bg-surface-2/40 p-3">
          <p className="flex items-center gap-1.5 text-[11px] text-ink-3">
            <span className="size-2 rounded-sm" style={{ background: PERSONAL }} /> Custo real pessoal
          </p>
          <p className="tabular mt-1 text-lg font-semibold">{formatBRL(personal)}</p>
          <p className="text-[11px] text-ink-3">{total > 0 ? formatPct((personal / total) * 100) : "0%"} do total</p>
        </div>
        <div className="rounded-xl border border-line bg-surface-2/40 p-3">
          <p className="flex items-center gap-1.5 text-[11px] text-ink-3">
            <span className="size-2 rounded-sm" style={{ background: THIRD }} /> Terceiros (transita)
          </p>
          <p className="tabular mt-1 text-lg font-semibold">{formatBRL(third)}</p>
          <p className="text-[11px] text-ink-3">{total > 0 ? formatPct((third / total) * 100) : "0%"} do total</p>
        </div>
      </div>

      <div className="mt-4 space-y-2" aria-label="Pessoal vs. terceiros por mês">
        {state.months.map((m, i) => {
          const t = expenseFor(state, i, (e) => e.isThirdParty);
          const p = expenseFor(state, i) - t;
          return (
            <div key={m} className={`grid grid-cols-[52px_1fr_88px] items-center gap-2 text-[11px] ${period === i ? "text-ink" : "text-ink-3"}`}>
              <span>{m}</span>
              <div className="flex h-2.5 gap-[2px] overflow-hidden rounded-full bg-surface-2">
                {p > 0 && <div className="h-full rounded-l-full" style={{ width: `${(p / maxMonth) * 100}%`, background: PERSONAL }} title={`Pessoal ${formatBRL(p)}`} />}
                {t > 0 && <div className="h-full rounded-r-full" style={{ width: `${(t / maxMonth) * 100}%`, background: THIRD }} title={`Terceiros ${formatBRL(t)}`} />}
              </div>
              <span className="tabular text-right">{formatBRL(p)}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">Itens marcados como terceiros</p>
        <ul className="divide-y divide-line/60 rounded-xl border border-line">
          {tagged.length === 0 && <li className="px-3 py-3 text-xs text-ink-3">Nenhum item marcado. Use o ícone de pessoas na tabela.</li>}
          {tagged.map((e) => {
            const v = expenseValue(e, period, state);
            return (
              <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                <span className="min-w-0 truncate text-ink-2">{e.name}</span>
                <span className="flex items-center gap-3">
                  <span className={`tabular ${v > 0 ? "text-ink" : "text-ink-3"}`}>{v > 0 ? formatBRL(v) : "sem valor"}</span>
                  <Toggle checked label={`Desmarcar ${e.name} como terceiros`} onChange={() => dispatch({ type: "updateExpense", id: e.id, patch: { isThirdParty: false } })} />
                </span>
              </li>
            );
          })}
        </ul>
        {suggestions.length > 0 && (
          <p className="mt-2 text-[11px] text-warn">
            Sugestão: {suggestions.map((s) => s.name).join(", ")} está no grupo Terceiros mas não foi marcado.{" "}
            <button
              className="underline underline-offset-2"
              onClick={() => suggestions.forEach((s) => dispatch({ type: "updateExpense", id: s.id, patch: { isThirdParty: true } }))}
            >
              Marcar agora
            </button>
          </p>
        )}
      </div>
    </Card>
  );
}
