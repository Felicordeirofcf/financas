"use client";

import { ArrowRight, FlaskConical, RotateCcw } from "lucide-react";
import { SERIES } from "@/lib/constants";
import { simulateWhatIf } from "@/lib/finance";
import { formatBRL, formatMonths, formatPct } from "@/lib/format";
import type { FinanceState } from "@/lib/types";
import type { FinanceDispatch } from "@/hooks/useFinanceStore";
import { Badge, Button, Card } from "./ui/Card";
import { Slider } from "./ui/Slider";
import { Toggle } from "./ui/Toggle";

const fmtRun = (m: number) => (m === Infinity ? "Sustentável" : formatMonths(m));

function Compare({ label, before, after, better, format = formatBRL }: {
  label: string;
  before: number;
  after: number;
  better: "up" | "down";
  format?: (v: number) => string;
}) {
  const improved = better === "up" ? after > before : after < before;
  const same = Math.abs(after - before) < 0.005 || (before === Infinity && after === Infinity);
  return (
    <div className="rounded-xl border border-line bg-surface-2/40 p-3">
      <p className="text-[11px] text-ink-3">{label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <span className="tabular text-xs text-ink-3 line-through decoration-ink-3/40">{format(before)}</span>
        <ArrowRight className="size-3 text-ink-3" aria-hidden />
        <span className={`tabular text-[15px] font-semibold ${same ? "text-ink" : improved ? "text-good-ink" : "text-bad-ink"}`}>{format(after)}</span>
      </div>
    </div>
  );
}

export function WhatIfSimulator({ state, dispatch }: { state: FinanceState; dispatch: FinanceDispatch }) {
  const w = state.whatIf;
  const r = simulateWhatIf(state);
  const set = (patch: Partial<typeof w>) => dispatch({ type: "setWhatIf", patch });
  const levers = [
    { name: "Receita extra", value: r.savings.incomeUp, color: SERIES.blue },
    { name: "Corte cartões", value: r.savings.cardCut, color: SERIES.orange },
    { name: "Corte fixas", value: r.savings.fixedCut, color: SERIES.aqua },
    { name: "Reembolso terceiros", value: r.savings.thirdCut, color: SERIES.yellow },
  ].filter((l) => l.value > 0);
  const leverTotal = levers.reduce((a, l) => a + l.value, 0);

  return (
    <Card
      icon={FlaskConical}
      title="Simulador “E se…”"
      subtitle={`Cenários sobre o mês recorrente de referência (${r.month}), sem a entrada pontual`}
      badge={<Badge tone="accent">What-If</Badge>}
      actions={
        <Button onClick={() => set({ incomeUp: 0, cardCutPct: 0, fixedCutPct: 0, thirdPartyReimbursed: false })} title="Zerar cenário">
          <RotateCcw className="size-3.5" aria-hidden /> Zerar
        </Button>
      }
    >
      <div className="space-y-5">
        <Slider
          label="E se minha receita recorrente subir…"
          value={w.incomeUp}
          min={0}
          max={15000}
          step={100}
          display={`+${formatBRL(w.incomeUp)}`}
          onChange={(incomeUp) => set({ incomeUp })}
        />
        <Slider
          label="E se eu cortar nos cartões…"
          value={w.cardCutPct}
          min={0}
          max={100}
          step={5}
          display={`−${w.cardCutPct}%`}
          onChange={(cardCutPct) => set({ cardCutPct })}
          hint={`Economia de ${formatBRL(r.savings.cardCut)}/mês`}
        />
        <Slider
          label="E se eu enxugar moradia & fixas…"
          value={w.fixedCutPct}
          min={0}
          max={50}
          step={5}
          display={`−${w.fixedCutPct}%`}
          onChange={(fixedCutPct) => set({ fixedCutPct })}
          hint={`Economia de ${formatBRL(r.savings.fixedCut)}/mês (renegociar plano, contas, mercado)`}
        />
        <label className="flex items-center justify-between gap-3 text-[13px] text-ink-2">
          E se os terceiros reembolsarem o que transita pela conta?
          <Toggle checked={w.thirdPartyReimbursed} onChange={(thirdPartyReimbursed) => set({ thirdPartyReimbursed })} label="Terceiros reembolsam" />
        </label>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => set({ cardCutPct: 30, fixedCutPct: 10 })}>Cenário austero</Button>
          <Button
            variant="primary"
            onClick={() => {
              const gap = Math.max(0, r.simExpense - (r.baseIncome));
              set({ incomeUp: Math.ceil(gap / 100) * 100 });
            }}
          >
            Quanto preciso ganhar p/ equilibrar?
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Compare label={`Saldo mensal ${r.month}`} before={r.baseNet} after={r.simNet} better="up" />
          <Compare label="Despesa mensal" before={r.baseExpense} after={r.simExpense} better="down" />
          <Compare label="Comprometimento" before={r.baseCommitment} after={r.simCommitment} better="down" format={(v) => formatPct(v)} />
          <Compare label="Fôlego de caixa" before={r.baseRunway} after={r.simRunway} better="up" format={fmtRun} />
        </div>

        <div className={`rounded-xl border p-3 text-xs leading-relaxed ${r.breakEvenGap > 0 ? "border-bad/40 bg-bad/10 text-bad-ink" : "border-good/40 bg-good/10 text-good-ink"}`}>
          {r.breakEvenGap > 0 ? (
            <>
              Ainda faltam <strong className="tabular">{formatBRL(r.breakEvenGap)}/mês</strong> para o mês recorrente fechar no zero.
            </>
          ) : (
            <>
              Cenário equilibrado: sobra de <strong className="tabular">{formatBRL(r.simNet)}/mês</strong> para reserva ou amortização.
            </>
          )}
        </div>

        {levers.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] text-ink-3">Contribuição de cada alavanca ({formatBRL(leverTotal)}/mês)</p>
            <div className="flex h-2.5 gap-[2px] overflow-hidden rounded-full">
              {levers.map((l) => (
                <div
                  key={l.name}
                  title={`${l.name}: ${formatBRL(l.value)}`}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${(l.value / leverTotal) * 100}%`, background: l.color }}
                />
              ))}
            </div>
            <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-2">
              {levers.map((l) => (
                <li key={l.name} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-sm" style={{ background: l.color }} />
                  {l.name} <span className="tabular text-ink-3">{formatBRL(l.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
