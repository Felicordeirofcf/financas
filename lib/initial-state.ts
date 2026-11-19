import { SEED_DEBTS, SEED_EXPENSES, SEED_INCOMES, SEED_MONTHS } from "./seed-data";
import type { FinanceState } from "./types";

export function createInitialState(): FinanceState {
  const expenses = SEED_EXPENSES.map((e, i) => ({
    id: `exp-${i + 1}`,
    name: e.name,
    group: e.group,
    isThirdParty: e.thirdParty ?? false,
    values: [...e.values],
  }));
  const debts: FinanceState["debts"] = {};
  for (const e of expenses) if (SEED_DEBTS[e.name]) debts[e.id] = { ...SEED_DEBTS[e.name] };

  return {
    version: 1,
    months: SEED_MONTHS.map((m) => m.label),
    incomes: SEED_INCOMES.map((inc, i) => ({
      id: `inc-${i + 1}`,
      name: inc.name,
      type: inc.type,
      amount: inc.amount,
      month: inc.month ?? 0,
    })),
    expenses,
    debts,
    extraEnabled: true,
    whatIf: { incomeUp: 0, cardCutPct: 0, fixedCutPct: 0, thirdPartyReimbursed: false },
    optimizer: { capital: null, minReserve: 1000 },
  };
}

/** Validação defensiva para importação de JSON / localStorage. */
export function isFinanceState(x: unknown): x is FinanceState {
  if (!x || typeof x !== "object") return false;
  const s = x as FinanceState;
  return (
    Array.isArray(s.months) &&
    s.months.every((m) => typeof m === "string") &&
    Array.isArray(s.incomes) &&
    Array.isArray(s.expenses) &&
    s.expenses.every((e) => typeof e.name === "string" && Array.isArray(e.values) && e.values.length === s.months.length) &&
    s.incomes.every((i) => typeof i.name === "string" && typeof i.amount === "number")
  );
}

/** Completa campos ausentes de versões antigas/arquivos importados. */
export function normalizeState(s: FinanceState): FinanceState {
  const base = createInitialState();
  return {
    ...base,
    ...s,
    version: 1,
    // Corrige o rótulo antigo "Jan/26" (vindo depois de Dez/26) para "Jan/27"
    months: s.months.map((m, i) => (m === "Jan/26" && s.months[i - 1] === "Dez/26" ? "Jan/27" : m)),
    debts: s.debts ?? {},
    whatIf: { ...base.whatIf, ...(s.whatIf ?? {}) },
    optimizer: { ...base.optimizer, ...(s.optimizer ?? {}) },
    expenses: s.expenses.map((e) => ({ ...e, isThirdParty: !!e.isThirdParty, values: e.values.map((v) => Number(v) || 0) })),
  };
}
