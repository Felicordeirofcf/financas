import type { ExpenseGroup } from "./types";

/**
 * Paleta categórica (modo escuro) em ordem fixa — validada para
 * daltonismo nas posições adjacentes. Nunca reordenar por ranking.
 */
export const SERIES = {
  blue: "#3987e5",
  orange: "#d95926",
  aqua: "#199e70",
  yellow: "#c98500",
  magenta: "#d55181",
  neutral: "#8f8e86",
} as const;

export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

export const GROUPS: Record<ExpenseGroup, { label: string; short: string; color: string }> = {
  cartoes: { label: "Cartões de Crédito", short: "Cartões", color: SERIES.blue },
  emprestimos: { label: "Empréstimos", short: "Empréstimos", color: SERIES.orange },
  moradia: { label: "Moradia & Contas Fixas", short: "Moradia/Fixas", color: SERIES.aqua },
  terceiros: { label: "Terceiros", short: "Terceiros", color: SERIES.yellow },
};

export const GROUP_ORDER: ExpenseGroup[] = ["cartoes", "emprestimos", "moradia", "terceiros"];

export const STORAGE_KEY = "financas.state.v1";

/** Limite de referência para comprometimento com dívidas (% da receita). */
export const DEBT_LIMIT_PCT = 30;
