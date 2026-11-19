const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brl0 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatBRL = (v: number) => brl.format(Number.isFinite(v) ? v : 0);
export const formatBRL0 = (v: number) => brl0.format(Number.isFinite(v) ? v : 0);
export const formatNumber = (v: number) => num.format(Number.isFinite(v) ? v : 0);

/** Eixos: R$ 12,5 mil */
export const formatCompact = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1000) return `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
};

export const formatPct = (v: number, digits = 1) =>
  `${(Number.isFinite(v) ? v : 0).toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: 0 })}%`;

/** Aceita "1.234,56", "1234,56", "1234.56", "R$ 1.234". */
export function parseBRL(input: string): number {
  let s = input.replace(/[R$\s]/g, "").trim();
  if (!s) return 0;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

export const formatMonths = (m: number) => {
  if (!Number.isFinite(m)) return "Indefinido";
  if (m <= 0) return "0 mês";
  const r = m.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  return `${r} ${m < 2 && m >= 1 ? "mês" : m < 1 ? "mês" : "meses"}`;
};

export const uid = () => Math.random().toString(36).slice(2, 10);
