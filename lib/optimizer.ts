/**
 * Otimizador de Alocação do capital extra.
 * Compara estratégias de uso do capital (Avalanche, Bola de Neve, foco em
 * empréstimos, foco em cartões) contra "manter em caixa", projetando o
 * fluxo mês a mês a partir do mês de referência com amortização real
 * (juros sobre saldo devedor, parcela fixa).
 *
 * Regra de amortização parcial: reduz a parcela proporcionalmente ao saldo
 * abatido (mantém o prazo) — prioriza alívio imediato de fluxo de caixa.
 */
import { cashBefore, expenseFor, isPersonalDebt, pontualIn, pontualTotal, recurringIncome, refMonth, runway } from "./finance";
import type { DebtParams, Expense, FinanceState } from "./types";

export type StrategyId = "caixa" | "avalanche" | "bola-de-neve" | "emprestimos" | "cartoes";

export const STRATEGIES: { id: StrategyId; name: string; description: string }[] = [
  { id: "caixa", name: "Manter em caixa", description: "Não amortiza nada; o capital fica como reserva." },
  { id: "avalanche", name: "Avalanche", description: "Paga primeiro a dívida com MAIOR juros — minimiza o custo total." },
  { id: "bola-de-neve", name: "Bola de Neve", description: "Quita primeiro o MENOR saldo — libera parcelas inteiras mais rápido." },
  { id: "emprestimos", name: "Foco Empréstimos", description: "Direciona tudo para os empréstimos (Nu + Itaú)." },
  { id: "cartoes", name: "Foco Cartões", description: "Liquida faturas/parcelamentos de cartão para liberar limite e fluxo." },
];

export const HORIZON = 24;

export interface Debt {
  id: string;
  name: string;
  group: Expense["group"];
  installment: number;
  balance: number;
  rate: number; // decimal a.m.
}

export const defaultDebtParams = (e: Expense, installment: number): DebtParams =>
  e.group === "emprestimos"
    ? { balance: installment * 10, ratePct: 3.5 }
    : { balance: installment * 4, ratePct: 8 };

export function getDebts(s: FinanceState): Debt[] {
  const R = refMonth(s);
  return s.expenses
    .filter((e) => isPersonalDebt(e) && (e.values[R] ?? 0) > 0)
    .map((e) => {
      const installment = e.values[R];
      const p = s.debts[e.id] ?? defaultDebtParams(e, installment);
      return { id: e.id, name: e.name, group: e.group, installment, balance: Math.max(0, p.balance), rate: Math.max(0, p.ratePct) / 100 };
    });
}

/** Prazo estimado (meses) de uma dívida com parcela fixa. */
export function termMonths(d: Pick<Debt, "balance" | "installment" | "rate">) {
  if (d.balance <= 0) return 0;
  if (d.installment <= d.balance * d.rate) return Infinity;
  if (d.rate === 0) return d.balance / d.installment;
  return -Math.log(1 - (d.rate * d.balance) / d.installment) / Math.log(1 + d.rate);
}

function order(id: StrategyId, debts: Debt[]): Debt[] {
  const byRate = (a: Debt, b: Debt) => b.rate - a.rate || a.balance - b.balance;
  switch (id) {
    case "avalanche":
      return [...debts].sort(byRate);
    case "bola-de-neve":
      return [...debts].sort((a, b) => a.balance - b.balance || b.rate - a.rate);
    case "emprestimos":
      return debts.filter((d) => d.group === "emprestimos").sort(byRate);
    case "cartoes":
      return debts.filter((d) => d.group === "cartoes").sort(byRate);
    default:
      return [];
  }
}

export interface StrategyResult {
  id: StrategyId;
  name: string;
  description: string;
  applied: number;
  payments: { name: string; amount: number; paidOff: boolean }[];
  paidOff: string[];
  freedMonthly: number;
  janFreeCash: number;
  runway: number;
  runwayGain: number;
  interestPaid: number;
  interestSaved: number;
  cash12: number;
  projection: number[];
}

export interface OptimizerResult {
  month: string;
  available: number;
  capital: number;
  overdraft: boolean;
  debts: Debt[];
  results: StrategyResult[];
  bestId: StrategyId;
}

/** Capital que dá para usar sem deixar o caixa abaixo da reserva mínima. */
export function availableCapital(s: FinanceState) {
  const R = refMonth(s);
  const cash = cashBefore(s, R) + (s.extraEnabled ? pontualIn(s, R) : 0);
  return Math.max(0, cash - s.optimizer.minReserve);
}

export function maxCapital(s: FinanceState) {
  return Math.max(pontualTotal(s), availableCapital(s));
}

function simulate(s: FinanceState, debts: Debt[], id: StrategyId, capital: number) {
  const R = refMonth(s);
  const state = debts.map((d) => ({ ...d }));
  let remaining = id === "caixa" ? 0 : capital;
  const payments: StrategyResult["payments"] = [];

  for (const target of order(id, debts)) {
    if (remaining <= 0) break;
    const d = state.find((x) => x.id === target.id)!;
    const pay = Math.min(remaining, d.balance);
    if (pay <= 0) continue;
    const paidOff = pay >= d.balance - 0.005;
    d.installment = paidOff ? 0 : d.installment * ((d.balance - pay) / d.balance);
    d.balance -= pay;
    remaining -= pay;
    payments.push({ name: d.name, amount: pay, paidOff });
  }
  const applied = (id === "caixa" ? 0 : capital) - remaining;

  const installmentsBefore = debts.reduce((a, d) => a + d.installment, 0);
  const installmentsAfter = state.reduce((a, d) => a + d.installment, 0);
  const nonDebtExpense = expenseFor(s, R) - installmentsBefore;
  const income = recurringIncome(s);

  let cash = cashBefore(s, R) + (s.extraEnabled ? pontualIn(s, R) : 0) - applied;
  const projection: number[] = [];
  let interestPaid = 0;
  let run = cash <= 0 ? 0 : Infinity;

  for (let t = 0; t < HORIZON; t++) {
    let debtPay = 0;
    for (const d of state) {
      if (d.balance <= 0.005) continue;
      const interest = d.balance * d.rate;
      const pay = Math.min(d.installment, d.balance + interest);
      d.balance = d.balance + interest - pay;
      interestPaid += interest;
      debtPay += pay;
    }
    const prev = cash;
    cash += income - nonDebtExpense - debtPay;
    projection.push(cash);
    if (run === Infinity && cash < 0) run = t + (prev > 0 ? prev / (prev - cash) : 0);
  }
  if (run === Infinity) {
    // Caixa não zera no horizonte: estima pela tendência final
    const tail = projection[HORIZON - 1] - projection[HORIZON - 2];
    run = tail >= 0 ? Infinity : HORIZON + runway(projection[HORIZON - 1], tail);
  }

  return {
    applied,
    payments,
    paidOff: payments.filter((p) => p.paidOff).map((p) => p.name),
    freedMonthly: installmentsBefore - installmentsAfter,
    janFreeCash: projection[0],
    runway: run,
    interestPaid,
    cash12: projection[11],
    projection,
  };
}

export function optimize(s: FinanceState): OptimizerResult {
  const debts = getDebts(s);
  const available = availableCapital(s);
  const capital = Math.min(maxCapital(s), Math.max(0, s.optimizer.capital ?? Math.min(available, pontualTotal(s))));

  const raw = STRATEGIES.map((st) => ({ ...st, ...simulate(s, debts, st.id, capital) }));
  const base = raw[0];
  const results: StrategyResult[] = raw.map((r) => ({
    ...r,
    runwayGain: r.runway === Infinity || base.runway === Infinity ? (r.runway === base.runway ? 0 : Infinity) : r.runway - base.runway,
    interestSaved: base.interestPaid - r.interestPaid,
  }));

  const score = (r: StrategyResult) => [r.runway === Infinity ? 1e9 : r.runway, r.cash12];
  const best = [...results]
    .filter((r) => r.applied > 0 || r.id === "caixa")
    .sort((a, b) => {
      const [ra, ca] = score(a);
      const [rb, cb] = score(b);
      // Diferença de fôlego só decide quando é de pelo menos 1 mês; senão vence o caixa em 12 meses
      return Math.abs(rb - ra) >= 1 ? rb - ra : cb - ca;
    })[0];

  return {
    month: s.months[refMonth(s)],
    available,
    capital,
    overdraft: capital > available + 0.01,
    debts,
    results,
    bestId: best?.id ?? "caixa",
  };
}
