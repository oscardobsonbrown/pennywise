import { describe, expect, test } from "bun:test";

import type { TaxReturn } from "./schema";
import { aggregateSummary } from "./summary";

const makeReturn = (
  year: number,
  income: number,
  grossTax: number,
  medicareLevy: number,
): TaxReturn => ({
  year,
  name: "Test User",
  location: {
    postcode: "2000",
    suburb: "Sydney",
    state: "NSW",
  },
  income: {
    items: [{ label: "Salary or wages", amount: income }],
    total: income,
  },
  deductions: {
    items: [{ label: "Work-related expenses", amount: -2000 }],
    total: -2000,
  },
  taxableIncome: income - 2000,
  tax: {
    grossTax,
    medicareLevy,
    medicareLevySurcharge: 0,
    helpRepayment: 0,
    totalTaxBeforeOffsets: grossTax + medicareLevy,
    offsets: [{ label: "Low income tax offset", amount: -100 }],
    totalOffsets: -100,
    taxPayable: grossTax + medicareLevy - 100,
  },
  paygWithholding: {
    items: [{ label: "PAYG tax withheld", amount: -(grossTax + medicareLevy) }],
    total: -(grossTax + medicareLevy),
  },
  result: {
    refundOrOwing: 100,
    isRefund: true,
  },
  rates: {
    federal: { marginal: 32.5, effective: 20 },
    medicare: { rate: 2, amount: medicareLevy },
  },
});

describe("aggregateSummary", () => {
  test("returns null for empty returns", () => {
    expect(aggregateSummary({})).toBeNull();
  });

  test("aggregates single year correctly", () => {
    const returns = { 2024: makeReturn(2024, 100000, 14000, 2000) };
    const result = aggregateSummary(returns);

    expect(result).not.toBeNull();
    expect(result!.years).toEqual([2024]);
    expect(result!.yearCount).toBe(1);
    expect(result!.totalIncome).toBe(100000);
    expect(result!.totalGrossTax).toBe(14000);
    expect(result!.totalMedicareLevy).toBe(2000);
    expect(result!.totalTaxPayable).toBe(15900); // 14000 + 2000 - 100
    expect(result!.totalPaygWithheld).toBe(-16000);
    expect(result!.totalRefund).toBe(100);
  });

  test("aggregates multiple years correctly", () => {
    const returns = {
      2023: makeReturn(2023, 90000, 12000, 1800),
      2024: makeReturn(2024, 100000, 14000, 2000),
    };
    const result = aggregateSummary(returns);

    expect(result).not.toBeNull();
    expect(result!.years).toEqual([2023, 2024]);
    expect(result!.yearCount).toBe(2);
    expect(result!.totalIncome).toBe(190000);
    expect(result!.totalGrossTax).toBe(26000);
    expect(result!.totalMedicareLevy).toBe(3800);
    expect(result!.totalTaxPayable).toBe(29600); // (12000+1800-100) + (14000+2000-100)
  });

  test("calculates averages correctly", () => {
    const returns = {
      2023: makeReturn(2023, 80000, 10000, 1600),
      2024: makeReturn(2024, 100000, 14000, 2000),
    };
    const result = aggregateSummary(returns);

    expect(result).not.toBeNull();
    expect(result!.avgTaxableIncome).toBe(88000); // (78000 + 98000) / 2
  });

  test("aggregates income items by label", () => {
    const return1 = makeReturn(2023, 90000, 12000, 1800);
    return1.income.items = [
      { label: "Salary or wages", amount: 85000 },
      { label: "Interest income", amount: 5000 },
    ];

    const return2 = makeReturn(2024, 100000, 14000, 2000);
    return2.income.items = [
      { label: "Salary or wages", amount: 95000 },
      { label: "Interest income", amount: 3000 },
      { label: "Dividend income", amount: 2000 },
    ];

    const returns = { 2023: return1, 2024: return2 };
    const result = aggregateSummary(returns);

    expect(result).not.toBeNull();
    const wages = result!.incomeItems.find((i) => i.label === "Salary or wages");
    const interest = result!.incomeItems.find((i) => i.label === "Interest income");
    const dividends = result!.incomeItems.find((i) => i.label === "Dividend income");

    expect(wages?.amount).toBe(180000);
    expect(interest?.amount).toBe(8000);
    expect(dividends?.amount).toBe(2000);
  });

  test("calculates average hourly rate", () => {
    const returns = { 2024: makeReturn(2024, 104000, 14000, 2000) };
    const result = aggregateSummary(returns);

    // Net income: 104000 - 15900 = 88100
    // Hourly: 88100 / 2080 ≈ 42.36
    expect(result).not.toBeNull();
    expect(result!.avgHourlyRate).toBeCloseTo(42.36, 1);
  });

  test("sorts years ascending", () => {
    const returns = {
      2024: makeReturn(2024, 100000, 14000, 2000),
      2022: makeReturn(2022, 80000, 10000, 1600),
      2023: makeReturn(2023, 90000, 12000, 1800),
    };
    const result = aggregateSummary(returns);

    expect(result!.years).toEqual([2022, 2023, 2024]);
  });

  test("handles returns without rates", () => {
    const returnWithoutRates = makeReturn(2024, 100000, 14000, 2000);
    delete (returnWithoutRates as Partial<TaxReturn>).rates;

    const returns = { 2024: returnWithoutRates };
    const result = aggregateSummary(returns);

    expect(result).not.toBeNull();
    expect(result!.rates).toBeNull();
  });

  test("averages rates across years", () => {
    const return1 = makeReturn(2023, 90000, 12000, 1800);
    return1.rates = {
      federal: { marginal: 32.5, effective: 18 },
      medicare: { rate: 2, amount: 1800 },
    };

    const return2 = makeReturn(2024, 100000, 14000, 2000);
    return2.rates = {
      federal: { marginal: 32.5, effective: 20 },
      medicare: { rate: 2, amount: 2000 },
    };

    const returns = { 2023: return1, 2024: return2 };
    const result = aggregateSummary(returns);

    expect(result).not.toBeNull();
    expect(result!.rates!.federal.effective).toBe(19); // (18 + 20) / 2
    expect(result!.rates!.medicare!.rate).toBe(2);
  });

  test("aggregates deductions by label", () => {
    const return1 = makeReturn(2023, 90000, 12000, 1800);
    return1.deductions.items = [
      { label: "Work-related car expenses", amount: -2000 },
      { label: "Professional memberships", amount: -500 },
    ];

    const return2 = makeReturn(2024, 100000, 14000, 2000);
    return2.deductions.items = [
      { label: "Work-related car expenses", amount: -2500 },
      { label: "Home office expenses", amount: -800 },
    ];

    const returns = { 2023: return1, 2024: return2 };
    const result = aggregateSummary(returns);

    expect(result).not.toBeNull();
    const carExpenses = result!.deductions.find((i) => i.label === "Work-related car expenses");
    const memberships = result!.deductions.find((i) => i.label === "Professional memberships");
    const homeOffice = result!.deductions.find((i) => i.label === "Home office expenses");

    expect(carExpenses?.amount).toBe(-4500);
    expect(memberships?.amount).toBe(-500);
    expect(homeOffice?.amount).toBe(-800);
  });

  test("calculates net position correctly", () => {
    const return1 = makeReturn(2023, 90000, 12000, 1800);
    return1.result = { refundOrOwing: 500, isRefund: true };

    const return2 = makeReturn(2024, 100000, 14000, 2000);
    return2.result = { refundOrOwing: -200, isRefund: false };

    const returns = { 2023: return1, 2024: return2 };
    const result = aggregateSummary(returns);

    expect(result).not.toBeNull();
    expect(result!.totalRefund).toBe(500);
    expect(result!.totalOwing).toBe(-200);
    expect(result!.netPosition).toBe(300);
  });

  test("collects locations by state", () => {
    const return1 = makeReturn(2023, 90000, 12000, 1800);
    return1.location = { postcode: "2000", suburb: "Sydney", state: "NSW" };

    const return2 = makeReturn(2024, 100000, 14000, 2000);
    return2.location = { postcode: "3000", suburb: "Melbourne", state: "VIC" };

    const returns = { 2023: return1, 2024: return2 };
    const result = aggregateSummary(returns);

    expect(result).not.toBeNull();
    expect(result!.locations).toHaveLength(2);
    expect(result!.locations.find((l) => l.state === "NSW")?.years).toContain(2023);
    expect(result!.locations.find((l) => l.state === "VIC")?.years).toContain(2024);
  });
});
