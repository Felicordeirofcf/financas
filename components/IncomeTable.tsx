"use client";

import { Coins, Plus, Trash2 } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { pontualTotal, recurringIncome } from "@/lib/finance";
import type { FinanceState, IncomeType } from "@/lib/types";
import type { FinanceDispatch } from "@/hooks/useFinanceStore";
import { Button, Card } from "./ui/Card";
import { MoneyInput } from "./ui/MoneyInput";
import { TextInput } from "./ui/TextInput";

export function IncomeTable({ state, dispatch }: { state: FinanceState; dispatch: FinanceDispatch }) {
  return (
    <Card
      icon={Coins}
      title="Receitas"
      subtitle={
        <>
          Recorrente <strong className="tabular text-ink-2">{formatBRL(recurringIncome(state))}/mês</strong> · Pontual{" "}
          <strong className="tabular text-ink-2">{formatBRL(pontualTotal(state))}</strong> (escolha o mês de entrada)
        </>
      }
      bodyClassName="p-0 pt-4"
      actions={
        <>
          <Button onClick={() => dispatch({ type: "addIncome", incomeType: "recorrente" })}>
            <Plus className="size-3.5" aria-hidden /> Recorrente
          </Button>
          <Button onClick={() => dispatch({ type: "addIncome", incomeType: "pontual" })}>
            <Plus className="size-3.5" aria-hidden /> Pontual
          </Button>
        </>
      }
    >
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-[13px]">
          <thead>
            <tr className="border-y border-line bg-surface-2/60 text-left text-[11px] uppercase tracking-wider text-ink-3">
              <th className="px-5 py-2 font-medium">Fonte</th>
              <th className="px-2 py-2 font-medium">Tipo</th>
              <th className="px-2 py-2 font-medium">Entrada</th>
              <th className="px-2 py-2 text-right font-medium">Valor</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {state.incomes.map((inc) => (
              <tr key={inc.id} className="group border-b border-line/60 hover:bg-surface-2/40">
                <td className="py-1 pl-3 pr-2">
                  <TextInput ariaLabel="Nome da receita" value={inc.name} onCommit={(name) => dispatch({ type: "updateIncome", id: inc.id, patch: { name } })} />
                </td>
                <td className="px-2 py-1">
                  <select
                    aria-label={`Tipo de ${inc.name}`}
                    value={inc.type}
                    onChange={(e) => dispatch({ type: "updateIncome", id: inc.id, patch: { type: e.target.value as IncomeType } })}
                    className="rounded-md border border-transparent bg-transparent px-1 py-1 text-xs text-ink-2 outline-none hover:border-line focus:border-accent [&>option]:bg-surface"
                  >
                    <option value="recorrente">Recorrente</option>
                    <option value="pontual">Pontual</option>
                  </select>
                </td>
                <td className="px-2 py-1">
                  {inc.type === "pontual" ? (
                    <select
                      aria-label={`Mês de entrada de ${inc.name}`}
                      value={inc.month}
                      onChange={(e) => dispatch({ type: "updateIncome", id: inc.id, patch: { month: Number(e.target.value) } })}
                      className="rounded-md border border-line bg-surface-2 px-1.5 py-1 text-xs text-ink outline-none focus:border-accent [&>option]:bg-surface"
                    >
                      {state.months.map((m, i) => (
                        <option key={m} value={i}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="px-1 text-xs text-ink-3">Todo mês</span>
                  )}
                </td>
                <td className="w-36 px-1 py-1">
                  <MoneyInput ariaLabel={`Valor de ${inc.name}`} value={inc.amount} highlight onCommit={(amount) => dispatch({ type: "updateIncome", id: inc.id, patch: { amount } })} />
                </td>
                <td className="px-3 py-1">
                  <button
                    onClick={() => {
                      if (confirm(`Remover "${inc.name}"?`)) dispatch({ type: "removeIncome", id: inc.id });
                    }}
                    aria-label={`Remover ${inc.name}`}
                    title={`Remover ${inc.name}`}
                    className="rounded-md p-1 text-ink-3 opacity-60 transition hover:text-bad-ink group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
