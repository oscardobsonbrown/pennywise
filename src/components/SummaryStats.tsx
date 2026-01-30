import { useMemo } from "react";
import type { TaxReturn } from "../lib/schema";
import { formatCompact } from "../lib/format";
import { Sparkline } from "./Sparkline";

interface Props {
  returns: Record<number, TaxReturn>;
}

function getTotalTax(data: TaxReturn): number {
  return data.federal.tax + data.states.reduce((sum, s) => sum + s.tax, 0);
}

function getNetIncome(data: TaxReturn): number {
  return data.income.total - getTotalTax(data);
}

function getDailyTake(data: TaxReturn): number {
  return Math.round(getNetIncome(data) / 365);
}

export function SummaryStats({ returns }: Props) {
  const years = useMemo(
    () => Object.keys(returns).map(Number).sort((a, b) => a - b),
    [returns]
  );

  const stats = useMemo(() => {
    if (years.length === 0) return null;

    const allReturns = years.map((year) => returns[year]);

    // Sum across all years
    const totalIncome = allReturns.reduce((sum, r) => sum + r.income.total, 0);
    const totalTaxes = allReturns.reduce((sum, r) => sum + getTotalTax(r), 0);
    const netIncome = totalIncome - totalTaxes;

    // Average daily take: compute per-year daily take, then average
    const dailyTakes = allReturns.map((r) => getDailyTake(r));
    const avgDailyTake = Math.round(
      dailyTakes.reduce((sum, d) => sum + d, 0) / dailyTakes.length
    );

    // Per-year values for sparklines
    const incomePerYear = allReturns.map((r) => r.income.total);
    const taxesPerYear = allReturns.map((r) => getTotalTax(r));
    const netPerYear = allReturns.map((r) => getNetIncome(r));

    return [
      { label: "Total Income", value: totalIncome, sparkline: incomePerYear },
      { label: "Taxes Paid", value: totalTaxes, sparkline: taxesPerYear },
      { label: "Net Income", value: netIncome, sparkline: netPerYear },
      { label: "Daily Take", value: avgDailyTake, sparkline: dailyTakes },
    ];
  }, [returns, years]);

  if (!stats) {
    return null;
  }

  const yearRange =
    years.length > 1
      ? `${years[0]}–${years[years.length - 1]}`
      : years[0]?.toString() ?? "";

  return (
    <div className="p-6 pb-0 font-mono flex-shrink-0">
      <div className="border border-[var(--color-border)] grid grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`p-4 ${i > 0 ? "border-l border-[var(--color-border)]" : ""}`}
          >
            <Sparkline
              values={stat.sparkline}
              width={80}
              height={24}
              className="text-[var(--color-muted)] mb-2"
            />
            <div className="text-2xl font-bold tabular-nums">
              {formatCompact(stat.value)}
            </div>
            <div className="text-xs text-[var(--color-muted)] mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
      <div className="text-right text-xs text-[var(--color-muted)] mt-1">
        {yearRange}
      </div>
    </div>
  );
}
