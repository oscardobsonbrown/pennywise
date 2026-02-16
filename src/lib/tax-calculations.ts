import type { TaxReturn } from "./schema";

// Australian tax brackets for 2023-24 financial year
// Rates apply from 1 July 2024 with the Stage 3 tax cuts
const AUSTRALIAN_TAX_BRACKETS_2024 = [
  { threshold: 0, rate: 0, base: 0 },
  { threshold: 18200, rate: 0.16, base: 0 },
  { threshold: 45000, rate: 0.3, base: 4288 },
  { threshold: 135000, rate: 0.37, base: 31288 },
  { threshold: 190000, rate: 0.45, base: 51638 },
];

// Pre-2024 tax brackets
const AUSTRALIAN_TAX_BRACKETS_PRE_2024 = [
  { threshold: 0, rate: 0, base: 0 },
  { threshold: 18200, rate: 0.19, base: 0 },
  { threshold: 45000, rate: 0.325, base: 5092 },
  { threshold: 120000, rate: 0.37, base: 29467 },
  { threshold: 180000, rate: 0.45, base: 51667 },
];

// HELP/HECS repayment thresholds for 2023-24
const HELP_REPAYMENT_RATES = [
  { threshold: 0, rate: 0 },
  { threshold: 51550, rate: 0.01 },
  { threshold: 59596, rate: 0.02 },
  { threshold: 63089, rate: 0.025 },
  { threshold: 66877, rate: 0.03 },
  { threshold: 70890, rate: 0.035 },
  { threshold: 75140, rate: 0.04 },
  { threshold: 79649, rate: 0.045 },
  { threshold: 84429, rate: 0.05 },
  { threshold: 89494, rate: 0.055 },
  { threshold: 94865, rate: 0.06 },
  { threshold: 100559, rate: 0.065 },
  { threshold: 106596, rate: 0.07 },
  { threshold: 112985, rate: 0.075 },
  { threshold: 119764, rate: 0.08 },
  { threshold: 126950, rate: 0.085 },
  { threshold: 134568, rate: 0.09 },
  { threshold: 142642, rate: 0.095 },
  { threshold: 151203, rate: 0.1 },
];

// Medicare Levy Surcharge income thresholds
const MLS_THRESHOLDS = {
  single: 93000,
  family: 186000,
  familyPerChild: 1500,
};

export interface TaxCalculationInput {
  taxableIncome: number;
  year: number;
  hasPrivateHealthInsurance: boolean;
  helpDebtBalance?: number;
  isFamily?: boolean;
  numDependentChildren?: number;
}

export interface TaxCalculationResult {
  grossTax: number;
  medicareLevy: number;
  medicareLevySurcharge: number;
  helpRepayment: number;
  totalTaxBeforeOffsets: number;
  taxPayable: number;
  marginalRate: number;
  effectiveRate: number;
}

// Calculate Australian income tax based on brackets
export function calculateIncomeTax(taxableIncome: number, year: number): number {
  const brackets = year >= 2024 ? AUSTRALIAN_TAX_BRACKETS_2024 : AUSTRALIAN_TAX_BRACKETS_PRE_2024;

  // Find the applicable bracket
  let bracket = brackets[0]!;
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (taxableIncome >= brackets[i]!.threshold) {
      bracket = brackets[i]!;
      break;
    }
  }

  const excess = taxableIncome - bracket.threshold;
  return bracket.base + excess * bracket.rate;
}

// Calculate Medicare Levy (2% of taxable income, subject to thresholds)
export function calculateMedicareLevy(taxableIncome: number): number {
  // Medicare levy is 2% of taxable income
  // Full exemption if income <= $24,276 (singles) or $40,939 (families)
  // Reduction applies between $24,276-$30,345 (singles)
  if (taxableIncome <= 24276) {
    return 0;
  }
  if (taxableIncome <= 30345) {
    // Reduced levy
    const reduction = (30345 - taxableIncome) / 24276;
    return taxableIncome * 0.02 * (1 - reduction);
  }
  return taxableIncome * 0.02;
}

// Calculate Medicare Levy Surcharge
export function calculateMedicareLevySurcharge(
  taxableIncome: number,
  hasPrivateHealthInsurance: boolean,
  isFamily = false,
  numDependentChildren = 0,
): number {
  if (hasPrivateHealthInsurance) {
    return 0;
  }

  const familyThreshold =
    MLS_THRESHOLDS.family + numDependentChildren * MLS_THRESHOLDS.familyPerChild;
  const threshold = isFamily ? familyThreshold : MLS_THRESHOLDS.single;

  if (taxableIncome <= threshold) {
    return 0;
  }

  // Surcharge rates: 1%, 1.25%, or 1.5% depending on income tier
  if (taxableIncome <= threshold + 1000) {
    return taxableIncome * 0.01;
  } else if (taxableIncome <= threshold + 2000) {
    return taxableIncome * 0.0125;
  }
  return taxableIncome * 0.015;
}

// Calculate HELP/HECS repayment
export function calculateHelpRepayment(taxableIncome: number, helpDebtBalance?: number): number {
  if (!helpDebtBalance || helpDebtBalance <= 0) {
    return 0;
  }

  // Find applicable rate
  let rate = 0;
  for (let i = HELP_REPAYMENT_RATES.length - 1; i >= 0; i--) {
    if (taxableIncome >= HELP_REPAYMENT_RATES[i]!.threshold) {
      rate = HELP_REPAYMENT_RATES[i]!.rate;
      break;
    }
  }

  return Math.min(taxableIncome * rate, helpDebtBalance);
}

// Get marginal tax rate
export function getMarginalRate(taxableIncome: number, year: number): number {
  const brackets = year >= 2024 ? AUSTRALIAN_TAX_BRACKETS_2024 : AUSTRALIAN_TAX_BRACKETS_PRE_2024;

  for (let i = brackets.length - 1; i >= 0; i--) {
    if (taxableIncome >= brackets[i]!.threshold) {
      return brackets[i]!.rate;
    }
  }
  return 0;
}

// Main tax calculation function
export function calculateAustralianTax(input: TaxCalculationInput): TaxCalculationResult {
  const grossTax = calculateIncomeTax(input.taxableIncome, input.year);
  const medicareLevy = calculateMedicareLevy(input.taxableIncome);
  const medicareLevySurcharge = calculateMedicareLevySurcharge(
    input.taxableIncome,
    input.hasPrivateHealthInsurance,
    input.isFamily,
    input.numDependentChildren,
  );
  const helpRepayment = calculateHelpRepayment(input.taxableIncome, input.helpDebtBalance);

  const totalTaxBeforeOffsets = grossTax + medicareLevy + medicareLevySurcharge + helpRepayment;
  const marginalRate = getMarginalRate(input.taxableIncome, input.year);
  const effectiveRate = totalTaxBeforeOffsets / input.taxableIncome;

  return {
    grossTax,
    medicareLevy,
    medicareLevySurcharge,
    helpRepayment,
    totalTaxBeforeOffsets,
    taxPayable: totalTaxBeforeOffsets,
    marginalRate,
    effectiveRate,
  };
}

// Helper functions for existing components
export function getTotalTax(data: TaxReturn): number {
  return data.tax.taxPayable;
}

export function getNetIncome(data: TaxReturn): number {
  return data.income.total - data.tax.taxPayable;
}

export function getEffectiveRate(data: TaxReturn): number {
  if (data.rates?.federal?.effective) {
    return data.rates.federal.effective / 100;
  }
  return data.tax.taxPayable / data.income.total;
}

// Get the tax bracket breakdown for display
export function getTaxBracketBreakdown(
  taxableIncome: number,
  year: number,
): Array<{
  bracket: string;
  amountInBracket: number;
  taxOnBracket: number;
  rate: number;
}> {
  const brackets = year >= 2024 ? AUSTRALIAN_TAX_BRACKETS_2024 : AUSTRALIAN_TAX_BRACKETS_PRE_2024;
  const breakdown = [];

  for (let i = 0; i < brackets.length - 1; i++) {
    const current = brackets[i]!;
    const next = brackets[i + 1]!;
    const bracketMax = next.threshold - 1;

    if (taxableIncome <= current.threshold) {
      break;
    }

    const amountInBracket = Math.min(taxableIncome, bracketMax) - current.threshold;
    if (amountInBracket > 0) {
      breakdown.push({
        bracket: `$${current.threshold.toLocaleString()} - $${bracketMax.toLocaleString()}`,
        amountInBracket,
        taxOnBracket: amountInBracket * current.rate,
        rate: current.rate,
      });
    }
  }

  // Handle top bracket
  const topBracket = brackets[brackets.length - 1]!;
  if (taxableIncome > topBracket.threshold) {
    const amountInBracket = taxableIncome - topBracket.threshold;
    breakdown.push({
      bracket: `Over $${topBracket.threshold.toLocaleString()}`,
      amountInBracket,
      taxOnBracket: amountInBracket * topBracket.rate,
      rate: topBracket.rate,
    });
  }

  return breakdown;
}

// Calculate Low Income Tax Offset (LITO)
export function calculateLITO(taxableIncome: number): number {
  // For 2023-24 onwards
  if (taxableIncome <= 37500) {
    return 700;
  } else if (taxableIncome <= 45000) {
    return 700 - (taxableIncome - 37500) * 0.05;
  } else if (taxableIncome <= 66667) {
    return 325 - (taxableIncome - 45000) * 0.015;
  }
  return 0;
}

// Calculate Low and Middle Income Tax Offset (LMITO) - no longer applies from 2022-23
export function calculateLMITO(taxableIncome: number, year: number): number {
  if (year >= 2023) {
    return 0; // LMITO ended after 2021-22
  }

  if (taxableIncome <= 37000) {
    return 675;
  } else if (taxableIncome <= 48000) {
    return 675 + (taxableIncome - 37000) * 0.075;
  } else if (taxableIncome <= 90000) {
    return 1500;
  } else if (taxableIncome <= 126000) {
    return 1500 - (taxableIncome - 90000) * 0.03;
  }
  return 0;
}
