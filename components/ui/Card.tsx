import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  id?: string;
}

export function Card({ title, subtitle, icon: Icon, badge, actions, className = "", bodyClassName = "", children, id }: CardProps) {
  return (
    <section id={id} className={`rounded-2xl border border-line bg-surface ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {Icon && (
                <span className="grid size-7 place-items-center rounded-lg bg-surface-2 text-ink-2">
                  <Icon className="size-4" aria-hidden />
                </span>
              )}
              <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
              {badge}
            </div>
            {subtitle && <p className="mt-1 text-xs leading-relaxed text-ink-3">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "accent" }) {
  const tones = {
    neutral: "bg-surface-2 text-ink-2 border-line",
    good: "bg-good/10 text-good-ink border-good/30",
    warn: "bg-warn/10 text-warn border-warn/30",
    bad: "bg-bad/10 text-bad-ink border-bad/30",
    accent: "bg-accent/10 text-[#86b6ef] border-accent/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "ghost",
  title,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "ghost" | "primary" | "danger";
  title?: string;
  type?: "button" | "submit";
  className?: string;
}) {
  const v = {
    ghost: "border-line bg-surface-2 text-ink-2 hover:text-ink hover:border-ink-3/50",
    primary: "border-accent/60 bg-accent/15 text-ink hover:bg-accent/25",
    danger: "border-line bg-surface-2 text-ink-2 hover:text-bad-ink hover:border-bad/50",
  };
  return (
    <button
      type={type}
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-accent ${v[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
