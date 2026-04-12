import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, describe, expect, test } from "bun:test";

import type { Transaction } from "./schema";

const dataDir = await mkdtemp(join(tmpdir(), "pennywise-storage-"));
process.env.TAX_UI_DATA_DIR = dataDir;

const { clearAllData, getTransactions, saveTransaction } = await import("./storage");

afterAll(async () => {
  await rm(dataDir, { recursive: true, force: true });
});

describe("clearAllData", () => {
  test("clears saved transactions", async () => {
    const transaction: Transaction = {
      id: "transaction-1",
      date: "2026-04-12",
      amount: 24.95,
      category: "groceries",
      type: "expense",
      description: "Coles North Perth",
      createdAt: "2026-04-12T01:00:00.000Z",
      updatedAt: "2026-04-12T01:00:00.000Z",
    };

    await saveTransaction(transaction);
    expect(await getTransactions()).toEqual([transaction]);

    await clearAllData();

    expect(await getTransactions()).toEqual([]);
  });
});
