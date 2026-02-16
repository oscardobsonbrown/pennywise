import { useMemo, useState } from "react";

import { cn } from "../lib/cn";
import { formatPercent } from "../lib/format";
import type { TaxReturn } from "../lib/schema";
import { aggregateSummary } from "../lib/summary";
import {
  convertToTimeUnit,
  formatTimeUnitValue,
  TIME_UNIT_LABELS,
  type TimeUnit,
} from "../lib/time-units";
import { RateRow, Row } from "./Row";
import { DoubleSeparator, SectionHeader, Separator } from "./Section";

interface Props {
  returns: Record<number, TaxReturn>;
}

export function SummaryReceiptView({ returns }: Props) {
  const [timeUnit, setTimeUnit] = useState<TimeUnit>("daily");
  const data = useMemo(() => aggregateSummary(returns), [returns]);

  if (!data) {
    return (
      <div className="mx-auto max-w-md px-6 py-12 font-mono text-sm text-(--color-text-muted)">
        No tax returns available.
      </div>
    );
  }

  const timeUnitValue = convertToTimeUnit(data.avgHourlyRate, timeUnit);
  const yearRange =
    data.years.length > 1
      ? `${data.years[0]}–${data.years[data.years.length - 1]}`
      : String(data.years[0]);

  return (
    <div className="mx-auto max-w-md px-6 py-12 font-mono text-sm">
      <header className="mb-2">
        <h1 className="text-lg font-bold tracking-tight">TAX SUMMARY</h1>
        <p className="text-xs text-(--color-text-muted)">
          {data.yearCount} year{data.yearCount > 1 ? "s" : ""}: {yearRange}
        </p>
      </header>

      <SectionHeader>TOTAL INCOME</SectionHeader>
      <Separator />
      {data.incomeItems.map((item, i) => (
        <Row key={i} label={item.label} amount={item.amount} />
      ))}
      <Separator />
      <Row label="Total income" amount={data.totalIncome} isTotal />

      <SectionHeader>DEDUCTIONS</SectionHeader>
      <Separator />
      {data.deductions.map((item, i) => (
        <Row key={i} label={`Total ${item.label.toLowerCase()}`} amount={item.amount} isMuted />
      ))}
      <Separator />
      <Row label="Total deductions" amount={data.totalDeductions} isTotal />

      <SectionHeader>INCOME TAX</SectionHeader>
      <Separator />
      <Row label="Avg. taxable income" amount={Math.round(data.avgTaxableIncome)} />
      <Row label="Gross tax" amount={data.totalGrossTax} />
      {data.totalMedicareLevy > 0 && <Row label="Medicare levy" amount={data.totalMedicareLevy} />}
      {data.totalMedicareLevySurcharge > 0 && (
        <Row label="Medicare levy surcharge" amount={data.totalMedicareLevySurcharge} />
      )}
      {data.totalHelpRepayment > 0 && (
        <Row label="HELP/HECS repayment" amount={data.totalHelpRepayment} />
      )}
      <Separator />
      <Row label="Total offsets" amount={data.totalOffsets} showSign isMuted />
      <DoubleSeparator />
      <Row label="Tax payable" amount={data.totalTaxPayable} isTotal />

      <SectionHeader>PAYG WITHHOLDING</SectionHeader>
      <Separator />
      <Row label="Total PAYG withheld" amount={data.totalPaygWithheld} />

      <SectionHeader>NET POSITION</SectionHeader>
      <Separator />
      {data.totalRefund > 0 && <Row label="Total refund" amount={data.totalRefund} />}
      {data.totalOwing < 0 && <Row label="Total owing" amount={data.totalOwing} showSign />}
      <DoubleSeparator />
      <Row label="Total net" amount={data.netPosition} isTotal showSign />

      {data.rates && (
        <>
          <SectionHeader>AVERAGE TAX RATES</SectionHeader>
          <Separator />
          <div className="flex justify-between py-0.5 text-xs text-(--color-text-muted)">
            <span className="w-32" />
            <span className="w-20 text-right">Marginal</span>
            <span className="w-20 text-right">Effective</span>
          </div>
          <RateRow
            label="Income tax"
            marginal={formatPercent(data.rates.federal.marginal)}
            effective={formatPercent(data.rates.federal.effective)}
          />
          {data.rates.medicare && (
            <RateRow
              label="Medicare"
              marginal={formatPercent(data.rates.medicare.rate)}
              effective={formatPercent(data.rates.medicare.rate)}
            />
          )}
        </>
      )}

      <SectionHeader>AVERAGE MONTHLY</SectionHeader>
      <Separator />
      <Row label="Avg. gross monthly" amount={data.grossMonthly} />
      <Row label="Avg. net monthly (after tax)" amount={data.netMonthly} />

      <div className="flex justify-between py-1">
        <span className="flex items-center gap-1">
          Avg. {TIME_UNIT_LABELS[timeUnit].toLowerCase()} take-home
          {timeUnit === "hourly" && (
            <span
              className="cursor-help text-[10px] text-(--color-text-muted)"
              title="Based on 2,080 working hours per year (40 hrs x 52 weeks)"
            >
              ?
            </span>
          )}
        </span>
        <span className="slashed-zero tabular-nums">
          {formatTimeUnitValue(timeUnitValue, timeUnit)}
        </span>
      </div>

      <div className="mt-1 mb-4 flex gap-1">
        {(["daily", "hourly", "minute", "second"] as TimeUnit[]).map((unit) => (
          <button
            key={unit}
            onClick={() => setTimeUnit(unit)}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-xs",
              timeUnit === unit
                ? "border-(--color-text) bg-(--color-text) text-(--color-bg)"
                : "border-(--color-border) text-(--color-text-muted) hover:border-(--color-text-muted)",
            )}
          >
            {unit.charAt(0).toUpperCase()}
          </button>
        ))}
      </div>

      <footer className="mt-12 border-t border-(--color-border) pt-4 text-center text-xs text-(--color-text-muted)">
        Summary for {yearRange}
      </footer>
    </div>
  );
}
