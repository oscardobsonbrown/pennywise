import type { TaxReturn } from "./schema";

export interface AggregatedSummary {
  years: number[];
  yearCount: number;
  incomeItems: Array<{ label: string; amount: number }>;
  totalIncome: number;
  avgTaxableIncome: number;
  deductions: Array<{ label: string; amount: number }>;
  totalDeductions: number;
  totalGrossTax: number;
  totalMedicareLevy: number;
  totalMedicareLevySurcharge: number;
  totalHelpRepayment: number;
  totalOffsets: number;
  totalTaxPayable: number;
  totalPaygWithheld: number;
  totalRefund: number;
  totalOwing: number;
  netPosition: number;
  rates: {
    federal: { marginal: number; effective: number };
    medicare: { rate: number; amount: number } | null;
  } | null;
  grossMonthly: number;
  netMonthly: number;
  avgHourlyRate: number;
  locations: Array<{ state: string; years: number[] }>;
}

export function aggregateSummary(returns: Record<number, TaxReturn>): AggregatedSummary | null {
  const years = Object.keys(returns)
    .map(Number)
    .sort((a, b) => a - b);
  const allReturns = years
    .map((year) => returns[year])
    .filter((r): r is TaxReturn => r !== undefined);

  if (allReturns.length === 0) return null;

  // Aggregate income items
  const incomeItemsMap = new Map<string, number>();
  for (const r of allReturns) {
    for (const item of r.income.items) {
      incomeItemsMap.set(item.label, (incomeItemsMap.get(item.label) || 0) + item.amount);
    }
  }
  const incomeItems = Array.from(incomeItemsMap.entries()).map(([label, amount]) => ({
    label,
    amount,
  }));

  // Aggregate deductions
  const deductionsMap = new Map<string, number>();
  for (const r of allReturns) {
    for (const item of r.deductions.items) {
      deductionsMap.set(item.label, (deductionsMap.get(item.label) || 0) + item.amount);
    }
  }
  const deductions = Array.from(deductionsMap.entries()).map(([label, amount]) => ({
    label,
    amount,
  }));

  // Totals
  const totalIncome = allReturns.reduce((sum, r) => sum + r.income.total, 0);
  const totalDeductions = allReturns.reduce((sum, r) => sum + r.deductions.total, 0);
  const totalGrossTax = allReturns.reduce((sum, r) => sum + r.tax.grossTax, 0);
  const totalMedicareLevy = allReturns.reduce((sum, r) => sum + r.tax.medicareLevy, 0);
  const totalMedicareLevySurcharge = allReturns.reduce(
    (sum, r) => sum + (r.tax.medicareLevySurcharge || 0),
    0,
  );
  const totalHelpRepayment = allReturns.reduce((sum, r) => sum + (r.tax.helpRepayment || 0), 0);
  const totalOffsets = allReturns.reduce((sum, r) => sum + r.tax.totalOffsets, 0);
  const totalTaxPayable = allReturns.reduce((sum, r) => sum + r.tax.taxPayable, 0);
  const totalPaygWithheld = allReturns.reduce((sum, r) => sum + r.paygWithholding.total, 0);

  // Net position
  const totalRefund = allReturns.reduce(
    (sum, r) => sum + (r.result.isRefund ? r.result.refundOrOwing : 0),
    0,
  );
  const totalOwing = allReturns.reduce(
    (sum, r) => sum + (!r.result.isRefund ? r.result.refundOrOwing : 0),
    0,
  );
  const netPosition = totalRefund + totalOwing;

  // Averages
  const avgTaxableIncome =
    allReturns.reduce((sum, r) => sum + r.taxableIncome, 0) / allReturns.length;

  // Collect locations by state
  const locationMap = new Map<string, number[]>();
  for (const r of allReturns) {
    const existing = locationMap.get(r.location.state) || [];
    existing.push(r.year);
    locationMap.set(r.location.state, existing);
  }
  const locations = Array.from(locationMap.entries())
    .map(([state, stateYears]) => ({ state, years: stateYears.sort((a, b) => a - b) }))
    .sort((a, b) => a.state.localeCompare(b.state));

  // Average rates
  const returnsWithRates = allReturns.filter((r) => r.rates);
  let rates: AggregatedSummary["rates"] = null;
  if (returnsWithRates.length > 0) {
    const avgFederalMarginal =
      returnsWithRates.reduce((sum, r) => sum + (r.rates?.federal.marginal || 0), 0) /
      returnsWithRates.length;
    const avgFederalEffective =
      returnsWithRates.reduce((sum, r) => sum + (r.rates?.federal.effective || 0), 0) /
      returnsWithRates.length;

    const returnsWithMedicare = allReturns.filter((r) => r.rates?.medicare);
    const medicareRates =
      returnsWithMedicare.length > 0
        ? {
            rate:
              returnsWithMedicare.reduce((sum, r) => sum + (r.rates?.medicare?.rate || 0), 0) /
              returnsWithMedicare.length,
            amount:
              returnsWithMedicare.reduce((sum, r) => sum + (r.rates?.medicare?.amount || 0), 0) /
              returnsWithMedicare.length,
          }
        : null;

    rates = {
      federal: { marginal: avgFederalMarginal, effective: avgFederalEffective },
      medicare: medicareRates,
    };
  }

  // Monthly and hourly
  const grossMonthly = Math.round(totalIncome / 12 / allReturns.length);
  const netMonthly = Math.round((totalIncome - totalTaxPayable) / 12 / allReturns.length);
  const avgHourlyRate = (totalIncome - totalTaxPayable) / allReturns.length / 2080;

  return {
    years,
    yearCount: allReturns.length,
    incomeItems,
    totalIncome,
    avgTaxableIncome,
    deductions,
    totalDeductions,
    totalGrossTax,
    totalMedicareLevy,
    totalMedicareLevySurcharge,
    totalHelpRepayment,
    totalOffsets,
    totalTaxPayable,
    totalPaygWithheld,
    totalRefund,
    totalOwing,
    netPosition,
    rates,
    grossMonthly,
    netMonthly,
    avgHourlyRate,
    locations,
  };
}
