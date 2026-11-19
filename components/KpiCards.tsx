"use client";

import { ArrowDownRight, ArrowUpRight, CreditCard, PiggyBank, Receipt, TrendingDown, TrendingUp, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { DEBT_LIMIT_PCT } from "@/lib/constants";
import {
  cashBefore,
  isPersonalDebt,
  monthIndexes,
  periodExpense,
  periodIncome,
  pontualIn,
  pontualTotal,
  recurringIncome,
  thirdPartyTotal,
} from "@/lib/finance";
import { formatBRL, formatPct } from "@/lib/format";
import type { FinanceState, Period } from "@/lib/types";
import { Toggle } from "./ui/Toggle";

function Kpi({ label, icon: Icon, value, valueClass = "", children, extra }: {
  label: string;
  icon: LucideIcon;
  value: string;
  valueClass?: string;
  children?: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs font-medium text-ink-3">
          <Icon className="size-3.5" aria-hidden /> {label}
        </span>
        {extra}
      </div>
      <p className={`tabular mt-2 text-[26px] font-semibold leading-tight tracking-tight ${valueClass}`}>{value}</p>
      <div className="mt-2 text-[11px] leading-relaxed text-ink-3">{children}</div>
    </div>
  );
}

export function KpiCards({ state, period, onToggleExtra }: { state: FinanceState; period: Period; onToggleExtra: (v: boolean) => void }) {
  const idx = monthIndexes(state, period);
  const income = periodIncome(state, period);
  const expense = periodExpense(state, period);
  const net = income - expense;
  const debt = periodExpense(state, period, isPersonalDebt);
  const loans = periodExpense(state, period, (e) => e.group === "emprestimos" && !e.isThirdParty);
  const commitment = income > 0 ? (debt / income) * 100 : debt > 0 ? Infinity : 0;
  const third = thirdPartyTotal(state, period);
  const extraHere = idx.reduce((a, m) => a + pontualIn(state, m), 0);
  const extraMonths = state.incomes.filter((i) => i.type === "pontual" && i.amount > 0).map((i) => state.months[i.month]);

  const prev = typeof period === "number" && period > 0 ? periodExpense(state, period - 1) : null;
  const delta = prev && prev > 0 ? ((expense - prev) / prev) * 100 : null;
  const lastIdx = idx[idx.length - 1];
  const accumulated = cashBefore(state, lastIdx + 1);

  const commitTone = commitment <= DEBT_LIMIT_PCT ? "text-good-ink" : commitment <= 50 ? "text-warn" : "text-bad-ink";
  const commitLabel = commitment <= DEBT_LIMIT_PCT ? "Saudável" : commitment <= 50 ? "Atenção" : "Crítico";

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Kpi
        label="Receita total"
        icon={PiggyBank}
        value={formatBRL(income)}
        extra={
          <span className="flex items-center gap-1.5 text-[11px] text-ink-3">
            Extra {formatBRL(pontualTotal(state)).replace(",00", "")}
            <Toggle checked={state.extraEnabled} onChange={onToggleExtra} label="Incluir entrada extra" />
          </span>
        }
      >
        Base recorrente {formatBRL(recurringIncome(state) * idx.length)}
        {state.extraEnabled
          ? extraHere > 0
            ? <> + extra {formatBRL(extraHere)}</>
            : extraMonths.length > 0 && <> · extra alocado em {extraMonths.join(", ")}</>
          : <> · entrada extra desativada</>}
      </Kpi>

      <Kpi label="Despesa total" icon={Receipt} value={formatBRL(expense)}>
        {delta !== null ? (
          <span className={`inline-flex items-center gap-1 ${delta > 0 ? "text-bad-ink" : "text-good-ink"}`}>
            {delta > 0 ? <ArrowUpRight className="size-3" aria-hidden /> : <ArrowDownRight className="size-3" aria-hidden />}
            {formatPct(Math.abs(delta))} vs. {state.months[(period as number) - 1]}
          </span>
        ) : period === "all" ? (
          <>Média mensal {formatBRL(expense / idx.length)}</>
        ) : (
          <>Primeiro mês da série</>
        )}
      </Kpi>

      <Kpi
        label="Saldo líquido"
        icon={net >= 0 ? TrendingUp : TrendingDown}
        value={formatBRL(net)}
        valueClass={net >= 0 ? "text-good-ink" : "text-bad-ink"}
        extra={
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${net >= 0 ? "bg-good/15 text-good-ink" : "bg-bad/15 text-bad-ink"}`}>
            {net >= 0 ? "▲ Superávit" : "▼ Déficit"}
          </span>
        }
      >
        Caixa acumulado até {state.months[lastIdx]}:{" "}
        <span className={`tabular font-medium ${accumulated >= 0 ? "text-ink-2" : "text-bad-ink"}`}>{formatBRL(accumulated)}</span>
      </Kpi>

      <Kpi
        label="Comprometimento c/ dívidas"
        icon={CreditCard}
        value={Number.isFinite(commitment) ? formatPct(commitment) : "—"}
        valueClass={commitTone}
        extra={<span className={`text-[10px] font-semibold ${commitTone}`}>● {commitLabel}</span>}
      >
        <div className="relative mb-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(100, Number.isFinite(commitment) ? commitment : 100)}%`,
              background: commitment <= DEBT_LIMIT_PCT ? "var(--color-good)" : commitment <= 50 ? "var(--color-warn)" : "var(--color-bad)",
            }}
          />
          <div className="absolute inset-y-0 w-px bg-ink-2" style={{ left: `${DEBT_LIMIT_PCT}%` }} />
        </div>
        Empréstimos {formatBRL(loans)} · Cartões {formatBRL(debt - loans)} · limite ref. {DEBT_LIMIT_PCT}%
      </Kpi>

      <Kpi label="Custo real pessoal" icon={UserRound} value={formatBRL(expense - third)}>
        {third > 0 ? <>{formatBRL(third)} só transitam pela conta (terceiros)</> : <>Nenhum valor de terceiros no período</>}
      </Kpi>
    </div>
  );
}
