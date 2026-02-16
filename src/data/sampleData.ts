import type { TaxReturn } from "../lib/schema";

// Australian sample tax returns spanning 4 years
// Using 2020-2023 financial years (July 1 - June 30)

export const sampleReturns: Record<number, TaxReturn> = {
  2021: {
    year: 2021,
    name: "Jane Smith",
    location: {
      postcode: "2000",
      suburb: "Sydney",
      state: "NSW",
    },
    hasTFN: true,
    residencyStatus: "resident",
    income: {
      items: [
        { label: "Salary or wages", amount: 78000 },
        { label: "Interest income", amount: 320 },
        { label: "Dividend income", amount: 1200 },
        { label: "Franked dividends", amount: 514 },
      ],
      total: 80034,
    },
    deductions: {
      items: [
        { label: "Work-related car expenses", amount: -2800 },
        { label: "Work-related clothing", amount: -450 },
        { label: "Professional memberships", amount: -650 },
      ],
      total: -3900,
    },
    taxableIncome: 76134,
    tax: {
      grossTax: 15228,
      medicareLevy: 1523,
      medicareLevySurcharge: 0,
      helpRepayment: 0,
      totalTaxBeforeOffsets: 16751,
      offsets: [
        { label: "Low income tax offset", amount: -700 },
        { label: "Franking credits", amount: -514 },
      ],
      totalOffsets: -1214,
      taxPayable: 15537,
    },
    paygWithholding: {
      items: [{ label: "PAYG tax withheld", amount: -16800 }],
      total: -16800,
    },
    result: {
      refundOrOwing: 1263,
      isRefund: true,
    },
    rates: {
      federal: { marginal: 32.5, effective: 20.4 },
      medicare: { rate: 2, amount: 1523 },
    },
    privateHealthInsurance: {
      hasCover: true,
    },
  },

  2022: {
    year: 2022,
    name: "Jane Smith",
    location: {
      postcode: "2000",
      suburb: "Sydney",
      state: "NSW",
    },
    hasTFN: true,
    residencyStatus: "resident",
    income: {
      items: [
        { label: "Salary or wages", amount: 85000 },
        { label: "Interest income", amount: 480 },
        { label: "Dividend income", amount: 1800 },
        { label: "Franked dividends", amount: 771 },
        { label: "Capital gains", amount: 2400 },
      ],
      total: 90451,
    },
    deductions: {
      items: [
        { label: "Work-related car expenses", amount: -3200 },
        { label: "Work-related clothing", amount: -500 },
        { label: "Professional memberships", amount: -700 },
        { label: "Home office expenses", amount: -850 },
      ],
      total: -5250,
    },
    taxableIncome: 85201,
    tax: {
      grossTax: 18210,
      medicareLevy: 1704,
      medicareLevySurcharge: 0,
      helpRepayment: 0,
      totalTaxBeforeOffsets: 19914,
      offsets: [
        { label: "Low income tax offset", amount: -100 },
        { label: "Franking credits", amount: -771 },
      ],
      totalOffsets: -871,
      taxPayable: 19043,
    },
    paygWithholding: {
      items: [{ label: "PAYG tax withheld", amount: -19500 }],
      total: -19500,
    },
    result: {
      refundOrOwing: 457,
      isRefund: true,
    },
    rates: {
      federal: { marginal: 32.5, effective: 22.4 },
      medicare: { rate: 2, amount: 1704 },
    },
    privateHealthInsurance: {
      hasCover: true,
    },
  },

  2023: {
    year: 2023,
    name: "Jane Smith",
    location: {
      postcode: "2000",
      suburb: "Sydney",
      state: "NSW",
    },
    hasTFN: true,
    residencyStatus: "resident",
    income: {
      items: [
        { label: "Salary or wages", amount: 92000 },
        { label: "Interest income", amount: 890 },
        { label: "Dividend income", amount: 2400 },
        { label: "Franked dividends", amount: 1029 },
        { label: "Capital gains", amount: 1500 },
      ],
      total: 97819,
    },
    deductions: {
      items: [
        { label: "Work-related car expenses", amount: -3500 },
        { label: "Work-related clothing", amount: -550 },
        { label: "Professional memberships", amount: -750 },
        { label: "Home office expenses", amount: -1100 },
      ],
      total: -5900,
    },
    taxableIncome: 91919,
    tax: {
      grossTax: 20126,
      medicareLevy: 1838,
      medicareLevySurcharge: 0,
      helpRepayment: 0,
      totalTaxBeforeOffsets: 21964,
      offsets: [{ label: "Franking credits", amount: -1029 }],
      totalOffsets: -1029,
      taxPayable: 20935,
    },
    paygWithholding: {
      items: [{ label: "PAYG tax withheld", amount: -21000 }],
      total: -21000,
    },
    result: {
      refundOrOwing: 65,
      isRefund: true,
    },
    rates: {
      federal: { marginal: 32.5, effective: 22.8 },
      medicare: { rate: 2, amount: 1838 },
    },
    privateHealthInsurance: {
      hasCover: true,
    },
  },

  2024: {
    year: 2024,
    name: "Jane Smith",
    location: {
      postcode: "2000",
      suburb: "Sydney",
      state: "NSW",
    },
    hasTFN: true,
    residencyStatus: "resident",
    income: {
      items: [
        { label: "Salary or wages", amount: 95000 },
        { label: "Interest income", amount: 1200 },
        { label: "Dividend income", amount: 3200 },
        { label: "Franked dividends", amount: 1371 },
        { label: "Capital gains", amount: 1800 },
      ],
      total: 102571,
    },
    deductions: {
      items: [
        { label: "Work-related car expenses", amount: -3800 },
        { label: "Work-related clothing", amount: -600 },
        { label: "Professional memberships", amount: -800 },
        { label: "Home office expenses", amount: -1300 },
      ],
      total: -6500,
    },
    taxableIncome: 96071,
    tax: {
      grossTax: 20713,
      medicareLevy: 1921,
      medicareLevySurcharge: 0,
      helpRepayment: 0,
      totalTaxBeforeOffsets: 22634,
      offsets: [{ label: "Franking credits", amount: -1371 }],
      totalOffsets: -1371,
      taxPayable: 21263,
    },
    paygWithholding: {
      items: [{ label: "PAYG tax withheld", amount: -21800 }],
      total: -21800,
    },
    result: {
      refundOrOwing: 537,
      isRefund: true,
    },
    rates: {
      federal: { marginal: 32.5, effective: 22.1 },
      medicare: { rate: 2, amount: 1921 },
    },
    privateHealthInsurance: {
      hasCover: true,
    },
  },
};
