const PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** Gera rótulos "Fev/27", "Mar/27"… a partir de um rótulo inicial "Jan/27". */
export function monthSequence(start: string, count: number): string[] {
  const [mm, yy] = start.split("/");
  let m = PT.findIndex((x) => x.toLowerCase() === mm?.slice(0, 3).toLowerCase());
  let y = Number(yy);
  if (m < 0 || !Number.isFinite(y)) return Array.from({ length: count }, (_, i) => `M+${i}`);
  return Array.from({ length: count }, () => {
    const label = `${PT[m]}/${String(y).padStart(2, "0")}`;
    m++;
    if (m === 12) {
      m = 0;
      y = (y + 1) % 100;
    }
    return label;
  });
}
