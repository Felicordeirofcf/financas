/**
 * Dados iniciais compartilhados entre o frontend (estado pré-populado)
 * e o `prisma/seed.ts` (carga do banco).
 */
import type { ExpenseGroup, IncomeType } from "./types";

export const SEED_MONTHS = [
  { label: "Out/26", year: 2026, month: 10 },
  { label: "Nov/26", year: 2026, month: 11 },
  { label: "Dez/26", year: 2026, month: 12 },
  { label: "Jan/27", year: 2027, month: 1 },
];

export const SEED_INCOMES: { name: string; type: IncomeType; amount: number; month?: number }[] = [
  { name: "Personal", type: "recorrente", amount: 960 },
  { name: "Victor", type: "recorrente", amount: 2000 },
  { name: "Projeto", type: "recorrente", amount: 300 },
  { name: "Tibia", type: "recorrente", amount: 300 },
  { name: "Entrada Extra / Pontual", type: "pontual", amount: 16000, month: 2 }, // alocada em Dez/26
];

export const SEED_EXPENSES: {
  name: string;
  group: ExpenseGroup;
  thirdParty?: boolean;
  values: [number, number, number, number];
}[] = [
  { name: "Cartão Nubank", group: "cartoes", values: [0, 0, 2800, 1800] },
  { name: "Mercado", group: "moradia", values: [0, 0, 0, 800] },
  { name: "Gás", group: "moradia", values: [0, 0, 150, 150] },
  { name: "Cartão Sr. Luiz", group: "terceiros", thirdParty: true, values: [0, 0, 630, 630] },
  { name: "Empréstimo Nu", group: "emprestimos", values: [0, 0, 2000, 2000] },
  { name: "Empréstimo Itaú", group: "emprestimos", values: [0, 2500, 2500, 2500] },
  { name: "Faculdade", group: "moradia", values: [0, 0, 300, 300] },
  { name: "Condomínio", group: "moradia", values: [0, 0, 900, 900] },
  { name: "Luz", group: "moradia", values: [0, 0, 550, 450] },
  { name: "Aluguel", group: "moradia", values: [0, 0, 1800, 1800] },
  { name: "Plano de Saúde", group: "moradia", values: [0, 0, 1100, 1100] },
  { name: "Andreia", group: "terceiros", thirdParty: true, values: [0, 0, 250, 250] },
  { name: "Internet", group: "moradia", values: [0, 0, 100, 130] },
  { name: "Cartão Santander", group: "cartoes", values: [0, 0, 2800, 2000] },
  { name: "Cartão Neon", group: "cartoes", values: [0, 0, 970, 0] },
  { name: "Renner", group: "cartoes", values: [0, 0, 450, 310] },
  { name: "Itaú (Fatura/Conta)", group: "cartoes", values: [0, 0, 676, 0] },
  { name: "BTG", group: "cartoes", values: [0, 0, 310, 0] },
  { name: "Ana", group: "terceiros", thirdParty: true, values: [0, 0, 0, 0] },
];

/**
 * Premissas de dívida (estimativas editáveis no Otimizador).
 * Empréstimos: ~10 parcelas restantes. Cartões: ~4 faturas em aberto (parcelamentos).
 */
export const SEED_DEBTS: Record<string, { balance: number; ratePct: number }> = {
  "Empréstimo Nu": { balance: 18000, ratePct: 3.9 },
  "Empréstimo Itaú": { balance: 25000, ratePct: 3.2 },
  "Cartão Nubank": { balance: 7200, ratePct: 8 },
  "Cartão Santander": { balance: 8000, ratePct: 8 },
  Renner: { balance: 1240, ratePct: 9 },
};
