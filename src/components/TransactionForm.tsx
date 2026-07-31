"use client";

import { useState } from "react";
import { createTransaction } from "@/app/actions/transactions";
import type { Account, TransactionType } from "@/lib/types";

export default function TransactionForm({ accounts }: { accounts: Account[] }) {
  const [type, setType] = useState<TransactionType>("expense");

  return (
    <form action={createTransaction} className="mt-3 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {(["expense", "income", "transfer"] as TransactionType[]).map((t) => (
          <label
            key={t}
            className={`cursor-pointer rounded-lg border py-2 text-center text-xs font-medium ${
              type === t ? "border-rose-500 bg-rose-50 text-rose-700" : "border-rose-200 text-rose-900/60"
            }`}
          >
            <input
              type="radio"
              name="type"
              value={t}
              checked={type === t}
              onChange={() => setType(t)}
              className="hidden"
            />
            {t === "expense" ? "Pengeluaran" : t === "income" ? "Pemasukan" : "Transfer"}
          </label>
        ))}
      </div>

      <div>
        <label className="text-xs font-medium text-rose-900/70">
          {type === "transfer" ? "Dari rekening" : "Rekening"}
        </label>
        <select
          name="account_id"
          required
          className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
        >
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>
      </div>

      {type === "transfer" && (
        <div>
          <label className="text-xs font-medium text-rose-900/70">Ke rekening</label>
          <select
            name="transfer_to_account_id"
            required
            className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {type !== "transfer" && (
        <div>
          <label className="text-xs font-medium text-rose-900/70">Kategori</label>
          <input
            name="category_name"
            placeholder={type === "income" ? "Contoh: Gaji, Bonus" : "Contoh: Makan, Belanja"}
            className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
          />
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-rose-900/70">Jumlah (Rp)</label>
        <input
          name="amount"
          type="number"
          min={1}
          step="1"
          required
          className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-rose-900/70">Tanggal & jam</label>
        <input
          name="occurred_at"
          type="datetime-local"
          defaultValue={new Date().toISOString().slice(0, 16)}
          className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-rose-900/70">Catatan</label>
        <input
          name="note"
          placeholder="Opsional"
          className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
        />
      </div>

      <button className="w-full rounded-lg bg-rose-600 py-2 text-sm font-medium text-white">
        Simpan
      </button>
    </form>
  );
}
