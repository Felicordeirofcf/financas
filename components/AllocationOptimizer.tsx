"use client";

import { AlertTriangle, Crown, Target } from "lucide-react";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GROUPS, SERIES } from "@/lib/constants";
import { formatBRL, formatCompact, formatMonths } from "@/lib/format";
import { monthSequence } from "@/lib/months";
import { defaultDebtParams, HORIZON, maxCapital, optimize, termMonths, type StrategyId } from "@/lib/optimizer";
import type { FinanceState } from "@/lib/types";
import type { FinanceDispatch } from "@/hooks/useFinanceStore";
import { Badge, Button, Card } from "./ui/Card";
import { ChartTooltipBox } from "./ui/ChartTooltip";
import { MoneyInput } from "./ui/MoneyInput";
import { Slider } from "./ui/Slider";

const COLORS: Record<StrategyId, string> = {
  caixa: SERIES.neutral,
  avalanche: SERIES.blue,
  "bola-de-neve": SERIES.orange,
  emprestimos: SERIES.aqua,
  cartoes: SERIES.yellow,
};

const fmtRunway = (m: number) => (m === Infinity ? "Sustentável" : m > HORIZON ? `${HORIZON}+ meses` : formatMonths(m));
const fmtGain = (g: number) =>
  g === Infinity ? "torna o fluxo sustentável" : Math.abs(g) < 0.05 ? "sem ganho de fôlego" : `${g > 0 ? "+" : ""}${g.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mês(es)`;

export function AllocationOptimizer({ state, dispatch }: { state: FinanceState; dispatch: FinanceDispatch }) {
  const r = useMemo(() => optimize(state), [state]);
  const max = maxCapital(state);
  const labels = monthSequence(r.month, HORIZON);
  const chartData = labels.map((label, t) => {
    const row: Record<string, number | string> = { label };
    for (const s of r.results) row[s.id] = s.projection[t];
    return row;
  });
  const best = r.results.find((x) => x.id === r.bestId)!;
  const rankAval = [...r.debts].sort((a, b) => b.rate - a.rate || a.balance - b.balance).map((d) => d.id);
  const rankSnow = [...r.debts].sort((a, b) => a.balance - b.balance || b.rate - a.rate).map((d) => d.id);

  return (
    <Card
      id="otimizador"
      icon={Target}
      title="Otimizador de alocação do capital extra"
      subtitle={`Avalanche × Bola de Neve × foco em empréstimos ou cartões — projeção de ${HORIZON} meses a partir de ${r.month}, repetindo as despesas de ${r.month} e amortizando cada dívida com juros sobre o saldo.`}
      badge={<Badge tone="accent">Diferencial</Badge>}
    >
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* Controles */}
        <div className="space-y-5">
          <Slider
            label="Capital a alocar"
            value={r.capital}
            min={0}
            max={Math.max(100, Math.ceil(max / 100) * 100)}
            step={100}
            display={formatBRL(r.capital)}
            onChange={(capital) => dispatch({ type: "setOptimizer", patch: { capital } })}
            hint={
              <>
                Caixa livre de verdade no início de {r.month}: <strong className="text-ink-2">{formatBRL(r.available)}</strong> (sobras + extra − reserva).
              </>
            }
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => dispatch({ type: "setOptimizer", patch: { capital: null } })}>Usar caixa livre</Button>
            <Button onClick={() => dispatch({ type: "setOptimizer", patch: { capital: max } })}>Usar {formatCompact(max)}</Button>
          </div>
          <label className="block">
            <span className="text-[13px] text-ink-2">Reserva mínima a manter</span>
            <div className="mt-1.5 rounded-lg border border-line bg-surface-2">
              <MoneyInput
                ariaLabel="Reserva mínima"
                value={state.optimizer.minReserve}
                highlight
                className="text-left"
                onCommit={(minReserve) => dispatch({ type: "setOptimizer", patch: { minReserve } })}
              />
            </div>
          </label>

          {r.overdraft && (
            <div className="flex gap-2 rounded-xl border border-bad/40 bg-bad/10 p-3 text-xs leading-relaxed text-bad-ink">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>
                Alocar {formatBRL(r.capital)} ultrapassa o caixa livre em {formatBRL(r.capital - r.available)}: parte da entrada extra já foi consumida pelas
                despesas dos meses anteriores, então o caixa fica negativo.
              </p>
            </div>
          )}

          <div className="rounded-xl border border-line bg-surface-2/60 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              <Crown className="size-3.5 text-warn" aria-hidden /> Recomendação
            </p>
            <p className="mt-1.5 text-sm font-semibold">{best.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-2">
              {best.id === "caixa"
                ? "Nenhuma amortização melhora o resultado: manter o capital em caixa protege o fluxo."
                : `Libera ${formatBRL(best.freedMonthly)}/mês em parcelas, ${best.interestSaved > 0 ? `evita ${formatBRL(best.interestSaved)} em juros` : "com custo de juros semelhante"} e deixa ${formatBRL(best.janFreeCash)} de caixa ao fim de ${r.month}.`}
            </p>
          </div>
        </div>

        {/* Estratégias */}
        <div className="min-w-0 space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {r.results.map((s) => {
              const isBest = s.id === r.bestId;
              return (
                <div
                  key={s.id}
                  className={`relative rounded-xl border p-3.5 ${isBest ? "border-accent/70 bg-accent/[0.07]" : "border-line bg-surface-2/40"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-[13px] font-semibold">
                      <span className="h-0.5 w-3.5 rounded" style={{ background: COLORS[s.id] }} />
                      {s.name}
                    </span>
                    {isBest && <Badge tone="accent">Melhor</Badge>}
                  </div>
                  <p className="mt-1 min-h-8 text-[11px] leading-snug text-ink-3">{s.description}</p>
                  <dl className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-3">Aplicado</dt>
                      <dd className="tabular text-ink-2">{formatBRL(s.applied)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-3">Parcela liberada</dt>
                      <dd className="tabular font-medium text-good-ink">{formatBRL(s.freedMonthly)}/mês</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-3">Caixa fim {r.month}</dt>
                      <dd className={`tabular font-medium ${s.janFreeCash >= 0 ? "text-ink" : "text-bad-ink"}`}>{formatBRL(s.janFreeCash)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-3">Fôlego</dt>
                      <dd className="tabular font-medium text-ink">{fmtRunway(s.runway)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-3">Caixa em 12 m</dt>
                      <dd className={`tabular ${s.cash12 >= 0 ? "text-ink-2" : "text-bad-ink"}`}>{formatBRL(s.cash12)}</dd>
                    </div>
                    {s.id !== "caixa" && (
                      <>
                        <div className="flex justify-between gap-2">
                          <dt className="text-ink-3">Juros evitados</dt>
                          <dd className="tabular text-ink-2">{formatBRL(s.interestSaved)}</dd>
                        </div>
                        <p className="pt-1 text-[11px] text-ink-3">
                          {fmtGain(s.runwayGain)}
                          {s.paidOff.length > 0 && <> · quita {s.paidOff.join(", ")}</>}
                        </p>
                      </>
                    )}
                  </dl>
                </div>
              );
            })}
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-ink-2">Projeção do caixa acumulado por estratégia</p>
              <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-2">
                {r.results.map((s) => (
                  <li key={s.id} className="flex items-center gap-1.5">
                    <span className="h-0.5 w-3.5 rounded" style={{ background: COLORS[s.id] }} />
                    {s.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#2e2e2b" />
                  <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#3a3a37" }} tick={{ fill: "#8f8e86", fontSize: 11 }} interval="preserveStartEnd" minTickGap={18} />
                  <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} tick={{ fill: "#8f8e86", fontSize: 11 }} width={78} />
                  <ReferenceLine y={0} stroke="#d03b3b" strokeDasharray="4 4" strokeOpacity={0.7} />
                  <Tooltip
                    cursor={{ stroke: "#5a5a55" }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload as Record<string, number>;
                      return (
                        <ChartTooltipBox
                          title={`Caixa ao fim de ${label}`}
                          rows={r.results.map((s) => ({ name: s.name, value: row[s.id], color: COLORS[s.id], kind: "line" }))}
                        />
                      );
                    }}
                  />
                  {r.results.map((s) => (
                    <Line
                      key={s.id}
                      type="monotone"
                      dataKey={s.id}
                      name={s.name}
                      stroke={COLORS[s.id]}
                      strokeWidth={s.id === r.bestId ? 2.5 : 2}
                      strokeDasharray={s.id === "caixa" ? "5 4" : undefined}
                      dot={false}
                      activeDot={{ r: 5, stroke: "#1a1a19", strokeWidth: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Premissas */}
      <details className="mt-5 rounded-xl border border-line bg-surface-2/30 open:bg-surface-2/40" open>
        <summary className="cursor-pointer select-none px-4 py-3 text-xs font-medium text-ink-2">
          Premissas das dívidas (edite com os dados dos seus contratos/faturas)
        </summary>
        <div className="scroll-thin overflow-x-auto pb-2">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="border-y border-line text-left text-[11px] uppercase tracking-wider text-ink-3">
                <th className="px-4 py-2 font-medium">Dívida</th>
                <th className="px-2 py-2 text-right font-medium">Parcela {r.month}</th>
                <th className="px-2 py-2 text-right font-medium">Saldo devedor</th>
                <th className="px-2 py-2 text-right font-medium">Juros % a.m.</th>
                <th className="px-2 py-2 text-right font-medium">Prazo estimado</th>
                <th className="px-2 py-2 text-center font-medium">Avalanche</th>
                <th className="px-4 py-2 text-center font-medium">Bola de Neve</th>
              </tr>
            </thead>
            <tbody>
              {r.debts.map((d) => {
                const exp = state.expenses.find((e) => e.id === d.id)!;
                const fallback = defaultDebtParams(exp, d.installment);
                const term = termMonths(d);
                return (
                  <tr key={d.id} className="border-b border-line/50">
                    <td className="px-4 py-1.5">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-sm" style={{ background: GROUPS[d.group].color }} />
                        {d.name}
                      </span>
                    </td>
                    <td className="tabular px-2 py-1.5 text-right text-ink-2">{formatBRL(d.installment)}</td>
                    <td className="w-36 px-1 py-1">
                      <MoneyInput ariaLabel={`Saldo devedor de ${d.name}`} value={d.balance} highlight onCommit={(balance) => dispatch({ type: "setDebt", id: d.id, patch: { balance }, fallback })} />
                    </td>
                    <td className="w-28 px-1 py-1">
                      <MoneyInput ariaLabel={`Juros mensais de ${d.name}`} value={d.rate * 100} highlight onCommit={(ratePct) => dispatch({ type: "setDebt", id: d.id, patch: { ratePct }, fallback })} />
                    </td>
                    <td className={`tabular px-2 py-1.5 text-right ${term === Infinity ? "text-bad-ink" : "text-ink-2"}`}>
                      {term === Infinity ? "Parcela < juros!" : `${Math.ceil(term)} meses`}
                    </td>
                    <td className="tabular px-2 py-1.5 text-center text-ink-2">{rankAval.indexOf(d.id) + 1}º</td>
                    <td className="tabular px-4 py-1.5 text-center text-ink-2">{rankSnow.indexOf(d.id) + 1}º</td>
                  </tr>
                );
              })}
              {r.debts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-ink-3">
                    Nenhum cartão ou empréstimo pessoal com parcela em {r.month}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="px-4 pt-2 text-[11px] leading-relaxed text-ink-3">
            Saldos e taxas iniciais são estimativas (empréstimos ≈ 10 parcelas; cartões ≈ 4 faturas parceladas). Amortização parcial reduz a parcela mantendo o
            prazo. Dívidas com parcela {r.month} zerada (ex.: Neon, BTG) já terminam e não entram na otimização.
          </p>
        </div>
      </details>
    </Card>
  );
}
