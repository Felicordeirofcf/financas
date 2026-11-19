"use client";

import { Download, LogOut, RotateCcw, Upload, Wallet } from "lucide-react";
import { useRef } from "react";
import { Button } from "./ui/Card";
import { Segmented } from "./ui/Segmented";
import type { Period } from "@/lib/types";

export function Header({
  months,
  period,
  onPeriod,
  onExport,
  onImport,
  onReset,
}: {
  months: string[];
  period: Period;
  onPeriod: (p: Period) => void;
  onExport: () => void;
  onImport: (f: File) => void;
  onReset: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const options = [
    ...months.map((m, i) => ({ value: String(i), label: m })),
    { value: "all", label: "Consolidado" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent">
            <Wallet className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-base font-semibold tracking-tight">Inteligência de Fluxo de Caixa</h1>
            <p className="text-xs text-ink-3">Gestão financeira pessoal · dados salvos neste navegador</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            ariaLabel="Período"
            options={options}
            value={String(period)}
            onChange={(v) => onPeriod(v === "all" ? "all" : Number(v))}
          />
          <div className="flex gap-2">
            <Button onClick={onExport} title="Exportar JSON">
              <Download className="size-3.5" aria-hidden /> <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button onClick={() => fileRef.current?.click()} title="Importar JSON">
              <Upload className="size-3.5" aria-hidden /> <span className="hidden sm:inline">Importar</span>
            </Button>
            <Button variant="danger" onClick={onReset} title="Restaurar dados padrão">
              <RotateCcw className="size-3.5" aria-hidden /> <span className="hidden sm:inline">Resetar</span>
            </Button>
            <Button
              title="Sair"
              onClick={async () => {
                await fetch("/api/logout", { method: "POST" });
                window.location.replace("/login");
              }}
            >
              <LogOut className="size-3.5" aria-hidden /> <span className="hidden sm:inline">Sair</span>
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImport(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
