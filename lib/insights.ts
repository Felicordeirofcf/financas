import { DEBT_LIMIT_PCT, GROUPS } from "./constants";
import {
  expenseFor,
  expenseValue,
  groupTotals,
  incomeFor,
  isPersonalDebt,
  periodExpense,
  periodLabel,
  pontualIn,
  recurringIncome,
  refMonth,
  simulateWhatIf,
} from "./finance";
import { formatBRL, formatMonths, formatPct } from "./format";
import { monthSequence } from "./months";
import type { FinanceState, Period } from "./types";

export type Severity = "critical" | "warning" | "good" | "info";
export interface Insight {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
}

export function buildInsights(s: FinanceState, period: Period) {
  const out: Insight[] = [];
  const R = refMonth(s);
  const ref = s.months[R];
  const base = recurringIncome(s);
  const expR = expenseFor(s, R);
  const fixedLoans = expenseFor(s, R, (e) => !e.isThirdParty && (e.group === "moradia" || e.group === "emprestimos"));
  const debtR = expenseFor(s, R, isPersonalDebt);
  const sim = simulateWhatIf({ ...s, whatIf: { incomeUp: 0, cardCutPct: 0, fixedCutPct: 0, thirdPartyReimbursed: false } });

  // 1. Fixas + empréstimos vs. receita base
  if (fixedLoans > base) {
    out.push({
      id: "fixas",
      severity: "critical",
      title: "Fixas + empréstimos superam a receita base",
      detail: `Em ${ref}, moradia/contas fixas e empréstimos somam ${formatBRL(fixedLoans)} — ${formatBRL(fixedLoans - base)} acima da receita recorrente (${formatBRL(base)}), antes mesmo dos cartões.`,
    });
  } else {
    out.push({
      id: "fixas",
      severity: "good",
      title: "Fixas + empréstimos cabem na receita base",
      detail: `${formatBRL(fixedLoans)} de ${formatBRL(base)} (${formatPct(base > 0 ? (fixedLoans / base) * 100 : 0)}) em ${ref}.`,
    });
  }

  // 2. Déficit estrutural
  if (expR > base) {
    out.push({
      id: "deficit",
      severity: "critical",
      title: `Déficit recorrente de ${formatBRL(expR - base)}/mês`,
      detail: `As despesas de ${ref} (${formatBRL(expR)}) equivalem a ${formatPct(base > 0 ? (expR / base) * 100 : 0, 0)} da receita base. Sem a entrada pontual, o mês não fecha.`,
    });
  }

  // 3. Fôlego preditivo
  if (sim.baseRunway !== Infinity) {
    const months = monthSequence(ref, 36);
    const zeroAt = months[Math.min(35, Math.floor(sim.baseRunway))];
    out.push({
      id: "runway",
      severity: sim.baseRunway < 3 ? "critical" : sim.baseRunway < 6 ? "warning" : "info",
      title: sim.startCash <= 0 ? "Caixa já negativo" : `Fôlego de ${formatMonths(sim.baseRunway)}`,
      detail:
        sim.startCash <= 0
          ? `O caixa acumulado ao chegar em ${ref} é ${formatBRL(sim.startCash)}: o déficit será coberto por limite/crédito.`
          : `No ritmo de ${ref}, o caixa de ${formatBRL(sim.startCash)} zera por volta de ${zeroAt}.`,
    });
  } else {
    out.push({ id: "runway", severity: "good", title: "Fluxo recorrente sustentável", detail: `A receita base cobre as despesas de ${ref}.` });
  }

  // 4. Dependência da entrada pontual
  s.months.forEach((m, i) => {
    const extra = pontualIn(s, i);
    if (extra <= 0 || !s.extraEnabled) return;
    const without = incomeFor(s, i, false) - expenseFor(s, i);
    const withE = without + extra;
    if (without < 0) {
      out.push({
        id: `extra-${i}`,
        severity: withE < 0 ? "critical" : "warning",
        title: `${m} depende da entrada extra`,
        detail: `Sem os ${formatBRL(extra)}, ${m} fecharia em ${formatBRL(without)}; com ela, ${formatBRL(withE)}. ${withE >= 0 ? `Sobram ${formatPct((withE / extra) * 100, 0)} do extra.` : "Nem o extra cobre o mês."}`,
      });
    }
  });

  // 5. Comprometimento com dívidas
  const commit = base > 0 ? (debtR / base) * 100 : 0;
  if (commit > DEBT_LIMIT_PCT) {
    out.push({
      id: "commit",
      severity: commit > 60 ? "critical" : "warning",
      title: `Dívidas consomem ${formatPct(commit, 0)} da receita base`,
      detail: `Cartões + empréstimos pessoais somam ${formatBRL(debtR)} em ${ref}; a referência saudável é até ${DEBT_LIMIT_PCT}% (${formatBRL(base * (DEBT_LIMIT_PCT / 100))}).`,
    });
  }

  // 6. Maior ralo do período
  const items = s.expenses.map((e) => ({ e, v: expenseValue(e, period, s) })).sort((a, b) => b.v - a.v);
  const total = periodExpense(s, period);
  const topGroup = groupTotals(s, period).sort((a, b) => b.value - a.value)[0];
  if (items[0]?.v > 0) {
    out.push({
      id: "ralo",
      severity: "info",
      title: `Maior ralo: ${items[0].e.name}`,
      detail: `${formatBRL(items[0].v)} (${formatPct((items[0].v / total) * 100)}) em ${periodLabel(s, period)}. Grupo mais pesado: ${GROUPS[topGroup.group].label} com ${formatPct((topGroup.value / total) * 100)}.`,
    });
  }

  // 7. Variação entre os dois últimos meses
  if (R > 0) {
    const P = R - 1;
    const ended = s.expenses.filter((e) => e.values[P] > 0 && e.values[R] === 0);
    const started = s.expenses.filter((e) => e.values[P] === 0 && e.values[R] > 0);
    const rising = s.expenses.filter((e) => e.values[P] > 0 && e.values[R] > e.values[P]);
    if (ended.length) {
      const relief = ended.reduce((a, e) => a + e.values[P], 0);
      out.push({
        id: "ended",
        severity: "good",
        title: `Alívio de ${formatBRL(relief)} em ${ref}`,
        detail: `Encerram: ${ended.map((e) => e.name).join(", ")}. Evite reabrir esses compromissos.`,
      });
    }
    if (started.length || rising.length) {
      const inc = [...started.map((e) => ({ n: e.name, d: e.values[R] })), ...rising.map((e) => ({ n: e.name, d: e.values[R] - e.values[P] }))];
      out.push({
        id: "rising",
        severity: "warning",
        title: `Novos/maiores gastos em ${ref}: +${formatBRL(inc.reduce((a, x) => a + x.d, 0))}`,
        detail: inc.map((x) => `${x.n} (+${formatBRL(x.d)})`).join(", ") + ".",
      });
    }
  }

  // 8. Terceiros
  const third = expenseFor(s, R, (e) => e.isThirdParty);
  if (third > 0) {
    out.push({
      id: "third",
      severity: "info",
      title: `${formatBRL(third)}/mês são de terceiros`,
      detail: "Combine reembolso automático (Pix na data da fatura) para que esses valores não pressionem seu caixa.",
    });
  }
  const empty = s.expenses.filter((e) => e.values.every((v) => v === 0));
  if (empty.length) {
    out.push({ id: "empty", severity: "info", title: "Itens sem lançamentos", detail: `${empty.map((e) => e.name).join(", ")} não têm valor em nenhum mês.` });
  }

  // Score de saúde 0–100
  const coverage = expR > 0 ? Math.min(1, base / expR) : 1;
  const debtScore = 1 - Math.min(1, commit / 60);
  const runScore = sim.baseRunway === Infinity ? 1 : Math.min(1, sim.baseRunway / 6);
  const trend = R > 0 && expR <= expenseFor(s, R - 1) ? 1 : 0.5;
  const score = Math.round(coverage * 45 + debtScore * 25 + runScore * 20 + trend * 10);

  const rank: Record<Severity, number> = { critical: 0, warning: 1, info: 2, good: 3 };
  out.sort((a, b) => rank[a.severity] - rank[b.severity]);
  return { insights: out, score };
}
