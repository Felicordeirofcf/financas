import { GROUP_ORDER } from "./constants";
import type { Expense, ExpenseGroup, FinanceState, Period } from "./types";

const sum = (xs: number[]) => xs.reduce((a, b) => a + (Number(b) || 0), 0);

export const refMonth = (s: FinanceState) => s.months.length - 1;
export const monthIndexes = (s: FinanceState, p: Period) =>
  p === "all" ? s.months.map((_, i) => i) : [p];
export const periodLabel = (s: FinanceState, p: Period) =>
  p === "all" ? `Consolidado ${s.months[0]}–${s.months[s.months.length - 1]}` : s.months[p];

/* ---------- Receitas ---------- */
export const recurringIncome = (s: FinanceState) =>
  sum(s.incomes.filter((i) => i.type === "recorrente").map((i) => i.amount));
export const pontualTotal = (s: FinanceState) =>
  sum(s.incomes.filter((i) => i.type === "pontual").map((i) => i.amount));
export const pontualIn = (s: FinanceState, m: number) =>
  sum(s.incomes.filter((i) => i.type === "pontual" && i.month === m).map((i) => i.amount));
export const incomeFor = (s: FinanceState, m: number, withExtra = s.extraEnabled) =>
  recurringIncome(s) + (withExtra ? pontualIn(s, m) : 0);
export const periodIncome = (s: FinanceState, p: Period, withExtra = s.extraEnabled) =>
  sum(monthIndexes(s, p).map((m) => incomeFor(s, m, withExtra)));

/* ---------- Despesas ---------- */
export const expenseValue = (e: Expense, p: Period, s: FinanceState) =>
  sum(monthIndexes(s, p).map((m) => e.values[m] ?? 0));
export const expenseFor = (s: FinanceState, m: number, filter?: (e: Expense) => boolean) =>
  sum(s.expenses.filter(filter ?? (() => true)).map((e) => e.values[m] ?? 0));
export const periodExpense = (s: FinanceState, p: Period, filter?: (e: Expense) => boolean) =>
  sum(monthIndexes(s, p).map((m) => expenseFor(s, m, filter)));

export const groupTotals = (s: FinanceState, p: Period) =>
  GROUP_ORDER.map((g) => ({ group: g, value: periodExpense(s, p, (e) => e.group === g) }));
export const groupValue = (s: FinanceState, p: Period, g: ExpenseGroup) =>
  periodExpense(s, p, (e) => e.group === g);

/** Dívidas pessoais = cartões + empréstimos que não são de terceiros. */
export const isPersonalDebt = (e: Expense) =>
  (e.group === "cartoes" || e.group === "emprestimos") && !e.isThirdParty;

export const thirdPartyTotal = (s: FinanceState, p: Period) => periodExpense(s, p, (e) => e.isThirdParty);

/* ---------- Fluxo de caixa ---------- */
export interface MonthPoint {
  label: string;
  index: number;
  receita: number;
  receitaBase: number;
  despesa: number;
  saldo: number;
  acumulado: number;
}

export function monthlySeries(s: FinanceState, withExtra = s.extraEnabled): MonthPoint[] {
  let acc = 0;
  return s.months.map((label, i) => {
    const receita = incomeFor(s, i, withExtra);
    const despesa = expenseFor(s, i);
    acc += receita - despesa;
    return { label, index: i, receita, receitaBase: recurringIncome(s), despesa, saldo: receita - despesa, acumulado: acc };
  });
}

/** Caixa acumulado antes do mês `m` (sobras dos meses anteriores). */
export const cashBefore = (s: FinanceState, m: number, withExtra = s.extraEnabled) => {
  let c = 0;
  for (let k = 0; k < m; k++) c += incomeFor(s, k, withExtra) - expenseFor(s, k);
  return c;
};

/** Meses até o caixa zerar dado um caixa inicial e um resultado mensal. */
export const runway = (cash: number, monthlyNet: number) => {
  if (monthlyNet >= 0) return cash >= 0 ? Infinity : 0;
  if (cash <= 0) return 0;
  return cash / -monthlyNet;
};

/* ---------- Simulador E Se ---------- */
export function simulateWhatIf(s: FinanceState) {
  const R = refMonth(s);
  const { incomeUp, cardCutPct, fixedCutPct, thirdPartyReimbursed } = s.whatIf;
  const cards = expenseFor(s, R, (e) => e.group === "cartoes" && !e.isThirdParty);
  const fixed = expenseFor(s, R, (e) => e.group === "moradia" && !e.isThirdParty);
  const third = expenseFor(s, R, (e) => e.isThirdParty);
  const loans = expenseFor(s, R, (e) => e.group === "emprestimos" && !e.isThirdParty);

  const baseIncome = recurringIncome(s);
  const baseExpense = expenseFor(s, R);
  const cardCut = cards * (cardCutPct / 100);
  const fixedCut = fixed * (fixedCutPct / 100);
  const thirdCut = thirdPartyReimbursed ? third : 0;
  const simIncome = baseIncome + incomeUp;
  const simExpense = baseExpense - cardCut - fixedCut - thirdCut;

  const startCash = cashBefore(s, R) + (s.extraEnabled ? pontualIn(s, R) : 0);
  const baseNet = baseIncome - baseExpense;
  const simNet = simIncome - simExpense;

  const simDebt = cards - cardCut + loans;
  return {
    month: s.months[R],
    baseIncome,
    simIncome,
    baseExpense,
    simExpense,
    baseNet,
    simNet,
    startCash,
    baseRunway: runway(startCash, baseNet),
    simRunway: runway(startCash, simNet),
    breakEvenGap: Math.max(0, simExpense - simIncome),
    baseCommitment: baseIncome > 0 ? ((cards + loans) / baseIncome) * 100 : 0,
    simCommitment: simIncome > 0 ? (simDebt / simIncome) * 100 : 0,
    savings: { cardCut, fixedCut, thirdCut, incomeUp },
  };
}
