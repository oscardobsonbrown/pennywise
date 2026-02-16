import React from "react";

import { formatCurrency, formatPercent } from "../lib/format";
import type { TaxReturn } from "../lib/schema";
import { getTotalTax } from "../lib/tax-calculations";

interface Props {
  data: TaxReturn;
}

function CategoryHeader({ children }: { children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={2} className="pt-6 pb-2">
        <span className="text-xs text-(--color-text-muted)">{children}</span>
      </td>
    </tr>
  );
}

function DataRow({
  label,
  amount,
  isMuted,
  showSign,
}: {
  label: string;
  amount: number;
  isMuted?: boolean;
  showSign?: boolean;
}) {
  return (
    <tr className={isMuted ? "text-(--color-text-muted)" : ""}>
      <td className="py-1.5 text-sm">{label}</td>
      <td className="py-1.5 text-right text-sm slashed-zero tabular-nums">
        {showSign && amount >= 0 ? "+" : ""}
        {formatCurrency(amount)}
      </td>
    </tr>
  );
}

function TotalRow({
  label,
  amount,
  showSign,
}: {
  label: string;
  amount: number;
  showSign?: boolean;
}) {
  return (
    <>
      <tr>
        <td colSpan={2} className="h-2" />
      </tr>
      <tr className="border-t border-(--color-border) font-semibold">
        <td className="py-2 pt-4 text-sm">{label}</td>
        <td className="py-2 pt-4 text-right text-sm slashed-zero tabular-nums">
          {showSign && amount >= 0 ? "+" : ""}
          {formatCurrency(amount)}
        </td>
      </tr>
    </>
  );
}

function RatesSection({ rates }: { rates: TaxReturn["rates"] }) {
  if (!rates) return null;
  return (
    <>
      <tr>
        <td className="pt-6 pb-2 text-xs text-(--color-text-muted)">Tax Rates</td>
        <td className="pt-6 pb-2 text-right text-xs text-(--color-text-muted)">
          <span className="inline-block w-16">Marginal</span>
          <span className="inline-block w-16">Effective</span>
        </td>
      </tr>
      <tr>
        <td className="py-1.5 text-sm">Income Tax</td>
        <td className="py-1.5 text-right text-sm slashed-zero tabular-nums">
          <span className="inline-block w-16">{formatPercent(rates.federal.marginal)}</span>
          <span className="inline-block w-16">{formatPercent(rates.federal.effective)}</span>
        </td>
      </tr>
      {rates.medicare && (
        <tr>
          <td className="py-1.5 text-sm">Medicare Levy</td>
          <td className="py-1.5 text-right text-sm slashed-zero tabular-nums">
            <span className="inline-block w-16">{formatPercent(rates.medicare.rate)}</span>
            <span className="inline-block w-16">-</span>
          </td>
        </tr>
      )}
    </>
  );
}

export function ReceiptView({ data }: Props) {
  const totalTax = getTotalTax(data);
  const netIncome = data.income.total - totalTax;
  const grossMonthly = Math.round(data.income.total / 12);
  const netMonthly = Math.round(netIncome / 12);

  return (
    <div className="px-4 py-4 md:px-0 md:py-8 md:pb-12">
      <div className="dark:shadow-contrast mx-auto max-w-2xl rounded-lg bg-white shadow-md ring-[0.5px] ring-black/5 dark:bg-neutral-900">
        {/* Content Table */}
        <div className="px-6 pb-6">
          <table className="w-full">
            <tbody className="no-zebra">
              {/* Location Info */}
              <CategoryHeader>Taxpayer Location</CategoryHeader>
              <DataRow label="Suburb" amount={0} />
              <tr>
                <td className="py-1.5 text-sm text-(--color-text-muted)">
                  {data.location.suburb}, {data.location.state} {data.location.postcode}
                </td>
                <td />
              </tr>

              <CategoryHeader>Monthly Breakdown</CategoryHeader>
              <DataRow label="Gross monthly" amount={grossMonthly} />
              <DataRow label="Net monthly" amount={netMonthly} />

              <CategoryHeader>Assessable Income</CategoryHeader>
              {data.income.items.map((item, i) => (
                <DataRow key={i} label={item.label} amount={item.amount} />
              ))}
              <TotalRow label="Total income" amount={data.income.total} />

              <CategoryHeader>Deductions</CategoryHeader>
              {data.deductions.items.length > 0 ? (
                data.deductions.items.map((item, i) => (
                  <DataRow key={i} label={item.label} amount={item.amount} isMuted />
                ))
              ) : (
                <DataRow label="No deductions claimed" amount={0} isMuted />
              )}
              <TotalRow label="Total deductions" amount={data.deductions.total} />

              <DataRow label="Taxable income" amount={data.taxableIncome} />

              <CategoryHeader>Income Tax Calculation</CategoryHeader>
              <DataRow label="Gross tax" amount={data.tax.grossTax} />
              <DataRow label="Medicare Levy" amount={data.tax.medicareLevy} />
              {(data.tax.medicareLevySurcharge ?? 0) > 0 && (
                <DataRow
                  label="Medicare Levy Surcharge"
                  amount={data.tax.medicareLevySurcharge ?? 0}
                />
              )}
              {(data.tax.helpRepayment ?? 0) > 0 && (
                <DataRow label="HELP/HECS repayment" amount={data.tax.helpRepayment ?? 0} />
              )}
              <TotalRow label="Total tax before offsets" amount={data.tax.totalTaxBeforeOffsets} />

              <CategoryHeader>Tax Offsets</CategoryHeader>
              {data.tax.offsets.length > 0 ? (
                data.tax.offsets.map((item, i) => (
                  <DataRow key={i} label={item.label} amount={item.amount} isMuted />
                ))
              ) : (
                <DataRow label="No offsets applied" amount={0} isMuted />
              )}
              <TotalRow label="Total offsets" amount={data.tax.totalOffsets} />

              <DataRow label="Tax payable" amount={data.tax.taxPayable} />

              <CategoryHeader>PAYG Withholding</CategoryHeader>
              {data.paygWithholding.items.map((item, i) => (
                <DataRow key={i} label={item.label} amount={item.amount} isMuted />
              ))}
              <TotalRow label="Total tax paid" amount={data.paygWithholding.total} />

              <CategoryHeader>Result</CategoryHeader>
              <TotalRow
                label={data.result.isRefund ? "Refund" : "Amount owing"}
                amount={data.result.refundOrOwing}
                showSign
              />

              <RatesSection rates={data.rates} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
