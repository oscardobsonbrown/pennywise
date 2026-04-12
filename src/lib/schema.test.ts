import { describe, expect, test } from "bun:test";

import { BankStatementExtractionSchema, PayslipExtractionSchema } from "./schema";

describe("document extraction schemas", () => {
  test("payslip extraction does not require app-generated metadata", () => {
    const result = PayslipExtractionSchema.safeParse({
      period: {
        startDate: "2026-04-06",
        endDate: "2026-04-19",
        payDate: "2026-04-23",
      },
      employer: {
        name: "WeMoney Pty Ltd",
      },
      employee: {
        name: "Mia Ellis",
      },
      earnings: [{ description: "Ordinary hours", hours: 76, amount: 3538.46 }],
      grossEarnings: 3538.46,
      deductions: [{ description: "PAYG", amount: 778 }],
      totalDeductions: 778,
      netPay: 2760.46,
    });

    expect(result.success).toBe(true);
  });

  test("bank statement extraction does not require app-generated metadata or transaction IDs", () => {
    const result = BankStatementExtractionSchema.safeParse({
      bank: {
        name: "ubank",
        accountName: "Mia Ellis",
        accountNumber: "7809",
      },
      period: {
        startDate: "2026-04-01",
        endDate: "2026-04-30",
      },
      openingBalance: 482.75,
      closingBalance: 231.92,
      transactions: [
        {
          date: "2026-04-23",
          description: "Direct Credit CBA - WeMoney Salary",
          amount: 2760.46,
          balance: 1377.61,
          type: "credit",
        },
      ],
      totalCredits: 5850.92,
      totalDebits: 6101.75,
    });

    expect(result.success).toBe(true);
  });
});
