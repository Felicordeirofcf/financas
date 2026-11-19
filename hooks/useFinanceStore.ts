"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { STORAGE_KEY } from "@/lib/constants";
import { uid } from "@/lib/format";
import { createInitialState, isFinanceState, normalizeState } from "@/lib/initial-state";
import type { DebtParams, Expense, ExpenseGroup, FinanceState, Income, WhatIf } from "@/lib/types";

type Action =
  | { type: "replace"; state: FinanceState }
  | { type: "reset" }
  | { type: "setExtra"; enabled: boolean }
  | { type: "updateExpense"; id: string; patch: Partial<Omit<Expense, "id" | "values">> }
  | { type: "setExpenseValue"; id: string; month: number; value: number }
  | { type: "addExpense"; group: ExpenseGroup }
  | { type: "removeExpense"; id: string }
  | { type: "updateIncome"; id: string; patch: Partial<Omit<Income, "id">> }
  | { type: "addIncome"; incomeType: Income["type"] }
  | { type: "removeIncome"; id: string }
  | { type: "setWhatIf"; patch: Partial<WhatIf> }
  | { type: "setDebt"; id: string; patch: Partial<DebtParams>; fallback: DebtParams }
  | { type: "setOptimizer"; patch: Partial<FinanceState["optimizer"]> };

/** Termos que indicam valores de terceiros (tag automática). */
const THIRD_PARTY_HINT = /\b(sr\.?|sra\.?|terceiro|terceiros|m[ãa]e|pai|irm[ãa]o?|amig[oa])\b/i;

function reducer(s: FinanceState, a: Action): FinanceState {
  switch (a.type) {
    case "replace":
      return a.state;
    case "reset":
      return createInitialState();
    case "setExtra":
      return { ...s, extraEnabled: a.enabled };
    case "updateExpense":
      return {
        ...s,
        expenses: s.expenses.map((e) => {
          if (e.id !== a.id) return e;
          const next = { ...e, ...a.patch };
          // Auto-tag: mover para o grupo Terceiros (ou renomear com indício) marca como terceiro
          if (a.patch.group === "terceiros" && a.patch.isThirdParty === undefined) next.isThirdParty = true;
          if (a.patch.name && a.patch.isThirdParty === undefined && THIRD_PARTY_HINT.test(a.patch.name)) next.isThirdParty = true;
          return next;
        }),
      };
    case "setExpenseValue":
      return {
        ...s,
        expenses: s.expenses.map((e) =>
          e.id === a.id ? { ...e, values: e.values.map((v, i) => (i === a.month ? a.value : v)) } : e,
        ),
      };
    case "addExpense":
      return {
        ...s,
        expenses: [
          ...s.expenses,
          { id: `exp-${uid()}`, name: "Nova despesa", group: a.group, isThirdParty: a.group === "terceiros", values: s.months.map(() => 0) },
        ],
      };
    case "removeExpense": {
      const { [a.id]: _removed, ...debts } = s.debts;
      return { ...s, debts, expenses: s.expenses.filter((e) => e.id !== a.id) };
    }
    case "updateIncome":
      return { ...s, incomes: s.incomes.map((i) => (i.id === a.id ? { ...i, ...a.patch } : i)) };
    case "addIncome":
      return {
        ...s,
        incomes: [
          ...s.incomes,
          { id: `inc-${uid()}`, name: a.incomeType === "pontual" ? "Nova entrada pontual" : "Nova receita", type: a.incomeType, amount: 0, month: s.months.length - 1 },
        ],
      };
    case "removeIncome":
      return { ...s, incomes: s.incomes.filter((i) => i.id !== a.id) };
    case "setWhatIf":
      return { ...s, whatIf: { ...s.whatIf, ...a.patch } };
    case "setDebt":
      return { ...s, debts: { ...s.debts, [a.id]: { ...(s.debts[a.id] ?? a.fallback), ...a.patch } } };
    case "setOptimizer":
      return { ...s, optimizer: { ...s.optimizer, ...a.patch } };
  }
}

export function useFinanceStore() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [hydrated, setHydrated] = useState(false);

  // Carrega do localStorage após montar (evita divergência de hidratação SSR)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isFinanceState(parsed)) dispatch({ type: "replace", state: normalizeState(parsed) });
      }
    } catch {
      /* estado corrompido: mantém o seed */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financas-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importJSON = useCallback(async (file: File) => {
    const parsed = JSON.parse(await file.text());
    if (!isFinanceState(parsed)) throw new Error("Arquivo não reconhecido como dados do painel.");
    dispatch({ type: "replace", state: normalizeState(parsed) });
  }, []);

  return { state, dispatch, hydrated, exportJSON, importJSON };
}

export type FinanceDispatch = ReturnType<typeof useFinanceStore>["dispatch"];
