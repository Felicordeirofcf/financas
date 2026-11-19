"use client";

import { Plus, Search, Table2, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { GROUP_ORDER, GROUPS } from "@/lib/constants";
import { formatBRL } from "@/lib/format";
import type { ExpenseGroup, FinanceState, Period } from "@/lib/types";
import type { FinanceDispatch } from "@/hooks/useFinanceStore";
import { Button, Card } from "./ui/Card";
import { MoneyInput } from "./ui/MoneyInput";
import { TextInput } from "./ui/TextInput";

type Filter = ExpenseGroup | "todos";

export function ExpenseTable({ state, period, dispatch }: { state: FinanceState; period: Period; dispatch: FinanceDispatch }) {
  const [filter, setFilter] = useState<Filter>("todos");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      state.expenses.filter(
        (e) => (filter === "todos" || e.group === filter) && e.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [state.expenses, filter, query],
  );
  const colTotals = state.months.map((_, m) => rows.reduce((a, e) => a + (e.values[m] ?? 0), 0));
  const counts = (g: Filter) => (g === "todos" ? state.expenses.length : state.expenses.filter((e) => e.group === g).length);

  return (
    <Card
      id="despesas"
      icon={Table2}
      title="Despesas"
      subtitle="Clique em qualquer valor para editar · Enter confirma, Esc cancela · ícone de pessoas marca o item como de terceiros"
      bodyClassName="p-0 pt-4"
      actions={
        <Button variant="primary" onClick={() => dispatch({ type: "addExpense", group: filter === "todos" ? "moradia" : filter })}>
          <Plus className="size-3.5" aria-hidden /> Nova despesa
        </Button>
      }
    >
      <div className="flex flex-col gap-3 px-5 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar por grupo">
          {(["todos", ...GROUP_ORDER] as Filter[]).map((g) => {
            const active = filter === g;
            return (
              <button
                key={g}
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(g)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                  active ? "border-ink/60 bg-ink text-page" : "border-line text-ink-2 hover:text-ink"
                }`}
              >
                {g !== "todos" && <span className="size-2 rounded-sm" style={{ background: GROUPS[g].color }} />}
                {g === "todos" ? "Todos" : GROUPS[g].short}
                <span className={active ? "text-page/60" : "text-ink-3"}>{counts(g)}</span>
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs text-ink-3 focus-within:border-accent">
          <Search className="size-3.5" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar categoria…"
            className="w-40 bg-transparent text-ink outline-none placeholder:text-ink-3"
          />
        </label>
      </div>

      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-[13px]">
          <thead>
            <tr className="border-y border-line bg-surface-2/60 text-left text-[11px] uppercase tracking-wider text-ink-3">
              <th className="px-5 py-2 font-medium">Categoria</th>
              <th className="px-2 py-2 font-medium">Grupo</th>
              <th className="px-2 py-2 text-center font-medium" title="Terceiros">3º</th>
              {state.months.map((m, i) => (
                <th key={m} className={`px-2 py-2 text-right font-medium ${period === i ? "text-ink" : ""}`}>
                  {m}
                </th>
              ))}
              <th className="px-3 py-2 text-right font-medium">Total</th>
              <th className="w-10 px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const total = e.values.reduce((a, b) => a + b, 0);
              return (
                <tr key={e.id} className="group border-b border-line/60 hover:bg-surface-2/40">
                  <td className="py-1 pl-3 pr-2">
                    <div className="flex items-center gap-1">
                      <span className="h-5 w-[3px] shrink-0 rounded-full" style={{ background: GROUPS[e.group].color }} />
                      <TextInput ariaLabel="Nome da categoria" value={e.name} onCommit={(name) => dispatch({ type: "updateExpense", id: e.id, patch: { name } })} />
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <select
                      aria-label={`Grupo de ${e.name}`}
                      value={e.group}
                      onChange={(ev) => dispatch({ type: "updateExpense", id: e.id, patch: { group: ev.target.value as ExpenseGroup } })}
                      className="w-full rounded-md border border-transparent bg-transparent px-1 py-1 text-xs text-ink-2 outline-none hover:border-line focus:border-accent [&>option]:bg-surface"
                    >
                      {GROUP_ORDER.map((g) => (
                        <option key={g} value={g}>
                          {GROUPS[g].short}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1 text-center">
                    <button
                      onClick={() => dispatch({ type: "updateExpense", id: e.id, patch: { isThirdParty: !e.isThirdParty } })}
                      aria-pressed={e.isThirdParty}
                      title={e.isThirdParty ? "Item de terceiros (transita pela conta)" : "Marcar como terceiros"}
                      className={`rounded-md p-1 transition ${e.isThirdParty ? "bg-warn/15 text-warn" : "text-ink-3/40 hover:text-ink-2"}`}
                    >
                      <Users className="size-3.5" aria-hidden />
                    </button>
                  </td>
                  {state.months.map((m, i) => (
                    <td key={m} className={`w-28 px-1 py-1 ${period === i ? "bg-accent/[0.06]" : ""}`}>
                      <MoneyInput
                        ariaLabel={`${e.name} em ${m}`}
                        value={e.values[i] ?? 0}
                        highlight={period === i}
                        onCommit={(value) => dispatch({ type: "setExpenseValue", id: e.id, month: i, value })}
                      />
                    </td>
                  ))}
                  <td className="tabular px-3 py-1 text-right font-medium text-ink">{formatBRL(total)}</td>
                  <td className="px-3 py-1">
                    <button
                      onClick={() => {
                        if (confirm(`Remover "${e.name}"?`)) dispatch({ type: "removeExpense", id: e.id });
                      }}
                      title={`Remover ${e.name}`}
                      aria-label={`Remover ${e.name}`}
                      className="rounded-md p-1 text-ink-3 opacity-60 transition hover:text-bad-ink group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={state.months.length + 5} className="px-5 py-8 text-center text-ink-3">
                  Nenhuma despesa encontrada.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-line bg-surface-2/60 text-[13px] font-semibold">
              <td className="px-5 py-2.5" colSpan={3}>
                Total {filter !== "todos" && <span className="font-normal text-ink-3">· {GROUPS[filter].label}</span>}
              </td>
              {colTotals.map((t, i) => (
                <td key={i} className={`tabular px-3 py-2.5 text-right ${period === i ? "text-ink" : "text-ink-2"}`}>
                  {formatBRL(t)}
                </td>
              ))}
              <td className="tabular px-3 py-2.5 text-right">{formatBRL(colTotals.reduce((a, b) => a + b, 0))}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
