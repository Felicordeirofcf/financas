export type ExpenseGroup = "cartoes" | "emprestimos" | "moradia" | "terceiros";
export type IncomeType = "recorrente" | "pontual";

export interface Income {
  id: string;
  name: string;
  type: IncomeType;
  amount: number;
  /** Índice do mês em que a receita pontual entra (somente para "pontual"). */
  month: number;
}

export interface Expense {
  id: string;
  name: string;
  group: ExpenseGroup;
  isThirdParty: boolean;
  /** Um valor por mês, alinhado com `FinanceState.months`. */
  values: number[];
}

export interface DebtParams {
  /** Saldo devedor estimado (R$). */
  balance: number;
  /** Juros mensais (% a.m.). */
  ratePct: number;
}

export interface WhatIf {
  incomeUp: number; // R$/mês adicionais na receita recorrente
  cardCutPct: number; // % de corte nos cartões
  fixedCutPct: number; // % de corte em moradia & fixas
  thirdPartyReimbursed: boolean; // terceiros reembolsam o que transita pela conta
}

export interface FinanceState {
  version: 1;
  months: string[];
  incomes: Income[];
  expenses: Expense[];
  debts: Record<string, DebtParams>;
  extraEnabled: boolean;
  whatIf: WhatIf;
  optimizer: { capital: number | null; minReserve: number };
}

/** Índice do mês, ou "all" para a visão consolidada. */
export type Period = number | "all";
