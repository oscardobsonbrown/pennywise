import { describe, expect, test } from "bun:test";

import type { TaxReturn } from "./schema";
import {
  calculateIncomeTax,
  calculateLITO,
  calculateMedicareLevy,
  getEffectiveRate,
  getNetIncome,
  getTotalTax,
} from "./tax-calculations";

const baseTaxReturn: TaxReturn = {
  year: 2024,
  name: "Test User",
  location: {
    postcode: "2000",
    suburb: "Sydney",
    state: "NSW",
  },
  income: {
    items: [
      { label: "Salary or wages", amount: 100000 },
      { label: "Interest income", amount: 1000 },
    ],
    total: 101000,
  },
  deductions: {
    items: [
      { label: "Work-related car expenses", amount: -3000 },
      { label: "Professional memberships", amount: -500 },
    ],
    total: -3500,
  },
  taxableIncome: 97500,
  tax: {
    grossTax: 18050,
    medicareLevy: 1950,
    medicareLevySurcharge: 0,
    helpRepayment: 0,
    totalTaxBeforeOffsets: 20000,
    offsets: [{ label: "Low income tax offset", amount: -150 }],
    totalOffsets: -150,
    taxPayable: 19850,
  },
  paygWithholding: {
    items: [{ label: "PAYG tax withheld", amount: -20000 }],
    total: -20000,
  },
  result: {
    refundOrOwing: 150,
    isRefund: true,
  },
};

describe("getTotalTax", () => {
  test("returns tax payable", () => {
    expect(getTotalTax(baseTaxReturn)).toBe(19850);
  });

  test("handles zero tax", () => {
    const zeroTax: TaxReturn = {
      ...baseTaxReturn,
      tax: {
        ...baseTaxReturn.tax,
        taxPayable: 0,
      },
    };
    expect(getTotalTax(zeroTax)).toBe(0);
  });
});

describe("getNetIncome", () => {
  test("subtracts total tax from total income", () => {
    expect(getNetIncome(baseTaxReturn)).toBe(81150); // 101000 - 19850
  });

  test("handles zero tax", () => {
    const zeroTax: TaxReturn = {
      ...baseTaxReturn,
      tax: {
        ...baseTaxReturn.tax,
        taxPayable: 0,
      },
    };
    expect(getNetIncome(zeroTax)).toBe(101000);
  });
});

describe("getEffectiveRate", () => {
  test("uses effective rate when available", () => {
    const withRates: TaxReturn = {
      ...baseTaxReturn,
      rates: {
        federal: { marginal: 32.5, effective: 19.65 },
      },
    };
    expect(getEffectiveRate(withRates)).toBeCloseTo(0.1965, 4);
  });

  test("calculates from tax/income when no rates provided", () => {
    // 19850 / 101000 = 0.1965
    expect(getEffectiveRate(baseTaxReturn)).toBeCloseTo(0.1965, 2);
  });
});

describe("calculateIncomeTax", () => {
  test("calculates tax for 2024 brackets", () => {
    // $97,500 taxable income in 2024
    // $4,288 + 30% of ($97,500 - $45,000) = $4,288 + $15,750 = $20,038
    expect(calculateIncomeTax(97500, 2024)).toBeCloseTo(20038, 0);
  });

  test("calculates tax for pre-2024 brackets", () => {
    // $97,500 taxable income in 2023
    // $5,092 + 32.5% of ($97,500 - $45,000) = $5,092 + $17,062.50 = $22,154.50
    expect(calculateIncomeTax(97500, 2023)).toBeCloseTo(22154.5, 0);
  });

  test("handles income below tax-free threshold", () => {
    expect(calculateIncomeTax(18000, 2024)).toBe(0);
  });

  test("handles income at first bracket", () => {
    // $30,000 in 2024: 16% of ($30,000 - $18,200) = 16% of $11,800 = $1,888
    expect(calculateIncomeTax(30000, 2024)).toBeCloseTo(1888, 0);
  });
});

describe("calculateMedicareLevy", () => {
  test("calculates 2% levy for taxable income above threshold", () => {
    expect(calculateMedicareLevy(100000)).toBe(2000);
  });

  test("returns zero for income below exemption threshold", () => {
    expect(calculateMedicareLevy(20000)).toBe(0);
  });

  test("calculates reduced levy for income in reduction range", () => {
    // Income of $27,000 is between $24,276 and $30,345
    const levy = calculateMedicareLevy(27000);
    expect(levy).toBeGreaterThan(0);
    expect(levy).toBeLessThan(540); // Less than full 2%
  });
});

describe("calculateLITO", () => {
  test("returns full $700 for income up to $37,500", () => {
    expect(calculateLITO(37500)).toBe(700);
  });

  test("reduces offset for income between $37,500 and $45,000", () => {
    // At $40,000: $700 - ($40,000 - $37,500) * 0.05 = $700 - $125 = $575
    expect(calculateLITO(40000)).toBe(575);
  });

  test("reduces offset further for income between $45,000 and $66,667", () => {
    // At $50,000: $325 - ($50,000 - $45,000) * 0.015 = $325 - $75 = $250
    expect(calculateLITO(50000)).toBe(250);
  });

  test("returns zero for income above $66,667", () => {
    expect(calculateLITO(70000)).toBe(0);
  });
});
