"use client";

import { useState } from "react";
import { AllocationOptimizer } from "@/components/AllocationOptimizer";
import { CompositionChart } from "@/components/CompositionChart";
import { ExpenseTable } from "@/components/ExpenseTable";
import { Header } from "@/components/Header";
import { IncomeTable } from "@/components/IncomeTable";
import { InsightsPanel } from "@/components/InsightsPanel";
import { KpiCards } from "@/components/KpiCards";
import { MonthlyChart } from "@/components/MonthlyChart";
import { ThirdPartyPanel } from "@/components/ThirdPartyPanel";
import { WhatIfSimulator } from "@/components/WhatIfSimulator";
import { useFinanceStore } from "@/hooks/useFinanceStore";
import type { Period } from "@/lib/types";

export default function DashboardPage() {
  const { state, dispatch, exportJSON, importJSON } = useFinanceStore();
  const [period, setPeriod] = useState<Period>(state.months.length - 1);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  };

  return (
    <>
      <Header
        months={state.months}
        period={period}
        onPeriod={setPeriod}
        onExport={() => {
          exportJSON();
          notify("Dados exportados em JSON.");
        }}
        onImport={async (f) => {
          try {
            await importJSON(f);
            notify("Dados importados com sucesso.");
          } catch (e) {
            notify(e instanceof Error ? e.message : "Falha ao importar.");
          }
        }}
        onReset={() => {
          if (confirm("Restaurar os dados padrão? As alterações locais serão perdidas.")) {
            dispatch({ type: "reset" });
            setPeriod(state.months.length - 1);
            notify("Dados padrão restaurados.");
          }
        }}
      />

      <main className="mx-auto max-w-[1400px] space-y-4 px-4 py-5 sm:px-6 lg:space-y-5">
        <KpiCards state={state} period={period} onToggleExtra={(enabled) => dispatch({ type: "setExtra", enabled })} />

        <div className="grid gap-4 lg:grid-cols-5 lg:gap-5">
          <div className="lg:col-span-3">
            <MonthlyChart state={state} period={period} onSelect={setPeriod} />
          </div>
          <div className="lg:col-span-2">
            <CompositionChart state={state} period={period} />
          </div>
        </div>

        <AllocationOptimizer state={state} dispatch={dispatch} />

        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
          <WhatIfSimulator state={state} dispatch={dispatch} />
          <InsightsPanel state={state} period={period} />
          <ThirdPartyPanel state={state} period={period} dispatch={dispatch} />
        </div>

        <ExpenseTable state={state} period={period} dispatch={dispatch} />
        <IncomeTable state={state} dispatch={dispatch} />

        <footer className="pb-6 pt-2 text-center text-[11px] text-ink-3">
          Valores salvos localmente no navegador · Projeções são estimativas e não substituem orientação financeira profissional.
        </footer>
      </main>

      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm shadow-2xl">
          {toast}
        </div>
      )}
    </>
  );
}
