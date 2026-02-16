import { type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { formatCurrency, formatPercent } from "../lib/format";
import type { TaxReturn } from "../lib/schema";
import { getTotalTax } from "../lib/tax-calculations";
import { ChangeCell } from "./ChangeCell";
import { type ColumnMeta, Table } from "./Table";

interface Props {
  returns: Record<number, TaxReturn>;
}

interface SummaryRow {
  id: string;
  category: string;
  label: string;
  isHeader?: boolean;
  values: Record<number, number | undefined>;
  invertPolarity?: boolean;
  showChange?: boolean;
}

function collectRows(returns: Record<number, TaxReturn>): SummaryRow[] {
  const rows: SummaryRow[] = [];
  const allReturns = Object.values(returns);
  const years = Object.keys(returns).map(Number);

  const addRow = (
    category: string,
    label: string,
    getValue: (data: TaxReturn) => number | undefined,
    options?: { invertPolarity?: boolean; showChange?: boolean },
  ) => {
    const values: Record<number, number | undefined> = {};
    for (const year of years) {
      const data = returns[year];
      if (data) values[year] = getValue(data);
    }
    rows.push({
      id: `${category}-${label}-${rows.length}`,
      category,
      label,
      values,
      invertPolarity: options?.invertPolarity,
      showChange: options?.showChange,
    });
  };

  const addHeader = (category: string) => {
    rows.push({
      id: `header-${category}`,
      category,
      label: category,
      isHeader: true,
      values: {},
    });
  };

  // Monthly Breakdown
  addHeader("Monthly Breakdown");
  addRow("Monthly Breakdown", "Gross monthly", (data) => Math.round(data.income.total / 12), {
    showChange: true,
  });
  addRow(
    "Monthly Breakdown",
    "Net monthly (after tax)",
    (data) => Math.round((data.income.total - getTotalTax(data)) / 12),
    { showChange: true },
  );
  addRow(
    "Monthly Breakdown",
    "Daily take-home",
    (data) => Math.round((data.income.total - getTotalTax(data)) / 12 / 30),
    { showChange: true },
  );

  // Income items
  addHeader("Income");
  const incomeLabels = new Set<string>();
  for (const r of allReturns) {
    for (const item of r.income.items) {
      incomeLabels.add(item.label);
    }
  }
  for (const label of incomeLabels) {
    addRow("Income", label, (data) => data.income.items.find((i) => i.label === label)?.amount);
  }
  addRow("Income", "Total income", (data) => data.income.total, { showChange: true });

  // Deductions
  addHeader("Deductions");
  const deductionLabels = new Set<string>();
  for (const r of allReturns) {
    for (const item of r.deductions.items) {
      deductionLabels.add(item.label);
    }
  }
  for (const label of deductionLabels) {
    addRow(
      "Deductions",
      label,
      (data) => data.deductions.items.find((i) => i.label === label)?.amount,
    );
  }
  addRow("Deductions", "Total deductions", (data) => data.deductions.total);
  addRow("Deductions", "Taxable income", (data) => data.taxableIncome, { showChange: true });

  // Tax Calculation
  addHeader("Tax Calculation");
  addRow("Tax Calculation", "Gross tax", (data) => data.tax.grossTax, {
    invertPolarity: true,
    showChange: true,
  });
  addRow("Tax Calculation", "Medicare Levy", (data) => data.tax.medicareLevy, {
    invertPolarity: true,
  });
  addRow(
    "Tax Calculation",
    "Medicare Levy Surcharge",
    (data) => data.tax.medicareLevySurcharge || undefined,
    { invertPolarity: true },
  );
  addRow("Tax Calculation", "HELP/HECS repayment", (data) => data.tax.helpRepayment || undefined, {
    invertPolarity: true,
  });
  addRow("Tax Calculation", "Total tax before offsets", (data) => data.tax.totalTaxBeforeOffsets, {
    invertPolarity: true,
    showChange: true,
  });

  // Tax Offsets
  addHeader("Tax Offsets");
  const offsetLabels = new Set<string>();
  for (const r of allReturns) {
    for (const item of r.tax.offsets) {
      offsetLabels.add(item.label);
    }
  }
  for (const label of offsetLabels) {
    addRow("Tax Offsets", label, (data) => data.tax.offsets.find((i) => i.label === label)?.amount);
  }
  addRow("Tax Offsets", "Total offsets", (data) => data.tax.totalOffsets);
  addRow("Tax Calculation", "Tax payable", (data) => data.tax.taxPayable, {
    invertPolarity: true,
    showChange: true,
  });

  // PAYG Withholding
  addHeader("PAYG Withholding");
  const paygLabels = new Set<string>();
  for (const r of allReturns) {
    for (const item of r.paygWithholding.items) {
      paygLabels.add(item.label);
    }
  }
  for (const label of paygLabels) {
    addRow(
      "PAYG Withholding",
      label,
      (data) => data.paygWithholding.items.find((i) => i.label === label)?.amount,
    );
  }
  addRow("PAYG Withholding", "Total tax paid", (data) => data.paygWithholding.total);

  // Result
  addHeader("Result");
  addRow("Result", "Refund/Owing", (data) => data.result.refundOrOwing, { showChange: true });

  // Rates
  addHeader("Rates");
  addRow("Rates", "Marginal rate", (data) => data.rates?.federal.marginal, {
    invertPolarity: true,
  });
  addRow("Rates", "Effective rate", (data) => data.rates?.federal.effective, {
    invertPolarity: true,
  });
  addRow("Rates", "Medicare Levy rate", (data) => data.rates?.medicare?.rate, {
    invertPolarity: true,
  });

  return rows;
}

function formatValue(value: number | undefined, isRate: boolean): string {
  if (value === undefined) return "—";
  if (isRate) return formatPercent(value);
  return formatCurrency(value);
}

export function SummaryTable({ returns }: Props) {
  const years = Object.keys(returns)
    .map(Number)
    .sort((a, b) => a - b);

  const rows = useMemo(() => collectRows(returns), [returns]);

  const columns = useMemo<ColumnDef<SummaryRow>[]>(() => {
    const cols: ColumnDef<SummaryRow>[] = [
      {
        accessorKey: "label",
        header: "Line Item",
        cell: (info) => {
          const row = info.row.original;
          if (row.isHeader) {
            return (
              <div className="pt-2">
                <span className="text-xs text-(--color-text-muted)">{row.label}</span>
              </div>
            );
          }
          const isDeduction =
            row.label.startsWith("−") || row.label.startsWith("–") || row.label.startsWith("- ");
          return (
            <span
              title={String(info.getValue())}
              className={`block truncate ${isDeduction ? "text-(--color-text-muted)" : "text-(--color-text)"}`}
            >
              {String(info.getValue())}
            </span>
          );
        },
        meta: {
          sticky: true,
        } satisfies ColumnMeta,
        size: 240,
      },
    ];

    years.forEach((year, i) => {
      const prevYear = i > 0 ? years[i - 1] : undefined;

      cols.push({
        accessorFn: (row) => row.values[year],
        id: `year-${year}`,
        header: () => <span className="slashed-zero tabular-nums">{year}</span>,
        cell: (info) => {
          const row = info.row.original;
          if (row.isHeader) {
            return null;
          }

          const value = info.getValue() as number | undefined;
          const isRate = row.category === "Rates";
          const prevValue = prevYear !== undefined ? row.values[prevYear] : undefined;

          const isDeduction =
            row.label.startsWith("−") || row.label.startsWith("–") || row.label.startsWith("- ");

          const isEmpty = value === undefined;

          return (
            <div className="flex items-center justify-end gap-1.5 text-right slashed-zero tabular-nums">
              {prevYear !== undefined && row.showChange && (
                <span className="hidden sm:inline">
                  <ChangeCell
                    current={value}
                    previous={prevValue}
                    invertPolarity={row.invertPolarity}
                  />
                </span>
              )}
              <span
                className={
                  isEmpty
                    ? "text-(--color-text-tertiary)"
                    : isDeduction
                      ? "text-(--color-text-muted)"
                      : "text-(--color-text)"
                }
              >
                {formatValue(value, isRate)}
              </span>
            </div>
          );
        },
        meta: {
          align: "right",
          borderLeft: i > 0,
        } satisfies ColumnMeta,
        size: 160,
      });
    });

    return cols;
  }, [years]);

  const getRowClassName = (row: SummaryRow) => {
    if (row.isHeader && row.category !== "Monthly Breakdown") {
      return "border-t border-(--color-border)";
    }
    return "";
  };

  const isRowHoverDisabled = (row: SummaryRow) => row.isHeader === true;

  return (
    <div className="h-full w-full text-sm">
      <Table
        data={rows}
        columns={columns}
        storageKey="summary-table"
        getRowClassName={getRowClassName}
        isRowHoverDisabled={isRowHoverDisabled}
      />
    </div>
  );
}
