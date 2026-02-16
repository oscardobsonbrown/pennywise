import { z } from "zod";

import type { AustralianState } from "../data/postcodes";

const LabeledAmount = z.object({
  label: z.string(),
  amount: z.number(),
});

// Australian income items (from ATO tax return)
const IncomeItem = z.object({
  label: z.string(),
  amount: z.number(),
});

// Australian deductions (work-related, etc.)
const DeductionItem = z.object({
  label: z.string(),
  amount: z.number(),
});

// Australian tax offsets (not "credits" like US)
const TaxOffsetItem = z.object({
  label: z.string(),
  amount: z.number(),
});

// PAYG (Pay As You Go) withholding payments
const PAYGPayment = z.object({
  label: z.string(),
  amount: z.number(),
});

// Australian location information
const AustralianLocationSchema = z.object({
  postcode: z.string(),
  suburb: z.string(),
  state: z.string(),
});

// Australian tax rates (Medicare levy, etc.)
const AustralianTaxRates = z.object({
  federal: z.object({
    marginal: z.number(),
    effective: z.number(),
  }),
  medicare: z
    .object({
      rate: z.number(),
      amount: z.number(),
    })
    .optional(),
});

// Main Australian Tax Return schema
export const TaxReturnSchema = z.object({
  year: z.number(),
  name: z.string(),

  // Australian location
  location: AustralianLocationSchema,

  // Tax File Number indicator (not the actual TFN for privacy)
  hasTFN: z.boolean().optional(),

  // Australian residency status
  residencyStatus: z.enum(["resident", "foreign_resident", "working_holiday"]).optional(),

  // Assessable Income (Australian term)
  income: z.object({
    items: z.array(IncomeItem),
    total: z.number(),
  }),

  // Deductions
  deductions: z.object({
    items: z.array(DeductionItem),
    total: z.number(),
  }),

  // Taxable Income (Income - Deductions)
  taxableIncome: z.number(),

  // Australian tax calculation
  tax: z.object({
    // Income tax before offsets
    grossTax: z.number(),
    // Medicare Levy (typically 2% of taxable income)
    medicareLevy: z.number(),
    // Medicare Levy Surcharge (if applicable)
    medicareLevySurcharge: z.number().optional(),
    // HELP/HECS repayment (if applicable)
    helpRepayment: z.number().optional(),
    // Total tax before offsets
    totalTaxBeforeOffsets: z.number(),
    // Tax offsets (reduce tax payable)
    offsets: z.array(TaxOffsetItem),
    totalOffsets: z.number(),
    // Final tax payable
    taxPayable: z.number(),
  }),

  // PAYG Withholding (tax already paid)
  paygWithholding: z.object({
    items: z.array(PAYGPayment),
    total: z.number(),
  }),

  // Final result
  result: z.object({
    // Positive = refund, Negative = amount owing
    refundOrOwing: z.number(),
    // True if getting a refund
    isRefund: z.boolean(),
  }),

  // Tax rates information
  rates: AustralianTaxRates.optional(),

  // Additional Australian-specific fields
  privateHealthInsurance: z
    .object({
      hasCover: z.boolean(),
      rebate: z.number().optional(),
    })
    .optional(),

  // Spouse details (for offsets)
  spouse: z
    .object({
      hasSpouse: z.boolean(),
      taxableIncome: z.number().optional(),
    })
    .optional(),
});

export type TaxReturn = z.infer<typeof TaxReturnSchema>;
export type LabeledAmount = z.infer<typeof LabeledAmount>;
export type AustralianLocation = z.infer<typeof AustralianLocationSchema>;

// Helper type for creating Australian tax returns
export interface AustralianTaxReturnInput {
  year: number;
  name: string;
  location: {
    postcode: string;
    suburb: string;
    state: AustralianState;
  };
  income: Array<{ label: string; amount: number }>;
  deductions: Array<{ label: string; amount: number }>;
  offsets?: Array<{ label: string; amount: number }>;
  paygWithholding?: Array<{ label: string; amount: number }>;
}

export interface PendingUpload {
  id: string;
  filename: string;
  year: number | null;
  status: "extracting-year" | "parsing";
  file: File;
}

export interface FileProgress {
  id: string;
  filename: string;
  status: "pending" | "parsing" | "complete" | "error";
  year?: number;
  error?: string;
}

export interface FileWithId {
  id: string;
  file: File;
}
