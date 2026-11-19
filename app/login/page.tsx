"use client";

import { Eye, EyeOff, Lock, LogIn, Wallet } from "lucide-react";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      if (!res.ok) {
        setError((await res.json().catch(() => null))?.error ?? "Falha no login.");
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
    } catch {
      setError("Sem conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-accent/15 text-accent">
            <Wallet className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-base font-semibold tracking-tight">Inteligência de Fluxo de Caixa</h1>
            <p className="text-xs text-ink-3">Acesso restrito</p>
          </div>
        </div>

        <label className="block text-xs text-ink-2">
          Usuário
          <input
            autoFocus
            autoComplete="username"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          />
        </label>
        <label className="mt-4 block text-xs text-ink-2">
          Senha
          <div className="mt-1.5 flex items-center rounded-lg border border-line bg-surface-2 focus-within:border-accent">
            <Lock className="ml-3 size-3.5 text-ink-3" aria-hidden />
            <input
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent px-2 py-2 text-sm text-ink outline-none"
            />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Ocultar senha" : "Mostrar senha"} className="px-3 text-ink-3 hover:text-ink">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </label>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-xs text-bad-ink">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !user || !password}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-page transition hover:bg-white disabled:opacity-40"
        >
          <LogIn className="size-4" aria-hidden /> {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
