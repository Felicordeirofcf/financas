"use client";

import { AlertOctagon, AlertTriangle, CheckCircle2, Info, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { STATUS } from "@/lib/constants";
import { buildInsights, type Severity } from "@/lib/insights";
import type { FinanceState, Period } from "@/lib/types";
import { Badge, Card } from "./ui/Card";

const SEV: Record<Severity, { icon: LucideIcon; color: string; label: string }> = {
  critical: { icon: AlertOctagon, color: STATUS.critical, label: "Crítico" },
  warning: { icon: AlertTriangle, color: STATUS.warning, label: "Atenção" },
  info: { icon: Info, color: "#86b6ef", label: "Insight" },
  good: { icon: CheckCircle2, color: STATUS.good, label: "Positivo" },
};

export function InsightsPanel({ state, period }: { state: FinanceState; period: Period }) {
  const { insights, score } = buildInsights(state, period);
  const tone = score >= 70 ? STATUS.good : score >= 40 ? STATUS.warning : STATUS.critical;
  const label = score >= 70 ? "Saudável" : score >= 40 ? "Atenção" : "Crítica";
  const C = 2 * Math.PI * 30;

  return (
    <Card icon={Sparkles} title="Alertas preditivos & diagnóstico" subtitle="Reage em tempo real aos valores da tabela" badge={<Badge tone="accent">IA de regras</Badge>}>
      <div className="mb-4 flex items-center gap-4 rounded-xl border border-line bg-surface-2/40 p-3">
        <div className="relative size-[76px] shrink-0">
          <svg viewBox="0 0 76 76" className="size-full -rotate-90" aria-hidden>
            <circle cx="38" cy="38" r="30" fill="none" stroke="#2e2e2b" strokeWidth="7" />
            <circle cx="38" cy="38" r="30" fill="none" stroke={tone} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(score / 100) * C} ${C}`} />
          </svg>
          <span className="tabular absolute inset-0 grid place-items-center text-lg font-semibold">{score}</span>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-ink-3">Saúde financeira</p>
          <p className="text-base font-semibold" style={{ color: tone }}>
            {label}
          </p>
          <p className="text-[11px] leading-snug text-ink-3">Cobertura da receita base, peso das dívidas, fôlego e tendência.</p>
        </div>
      </div>

      <ul className="space-y-2">
        {insights.map((i) => {
          const sv = SEV[i.severity];
          const Icon = sv.icon;
          return (
            <li key={i.id} className="flex gap-3 rounded-xl border border-line/70 bg-surface-2/30 p-3">
              <Icon className="mt-0.5 size-4 shrink-0" style={{ color: sv.color }} aria-label={sv.label} />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-ink">{i.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-3">{i.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
