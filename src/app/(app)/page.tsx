import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatDateTime } from "@/lib/format";
import type { Account, Debt, Reminder, Transaction } from "@/lib/types";

function computeBalance(account: Account, transactions: Transaction[]): number {
  return transactions.reduce((balance, tx) => {
    if (tx.type === "income" && tx.account_id === account.id) return balance + tx.amount;
    if (tx.type === "expense" && tx.account_id === account.id) return balance - tx.amount;
    if (tx.type === "transfer" && tx.account_id === account.id) return balance - tx.amount;
    if (tx.type === "transfer" && tx.transfer_to_account_id === account.id) return balance + tx.amount;
    return balance;
  }, account.starting_balance);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: accounts }, { data: transactions }, { data: debts }, { data: reminders }] =
    await Promise.all([
      supabase.from("istri_accounts").select("*").eq("owner_id", user!.id).eq("archived", false),
      supabase.from("istri_transactions").select("*").eq("owner_id", user!.id),
      supabase.from("istri_debts").select("*").eq("owner_id", user!.id).eq("status", "active"),
      supabase
        .from("istri_reminders")
        .select("*")
        .eq("owner_id", user!.id)
        .eq("status", "pending")
        .order("due_at", { ascending: true })
        .limit(5),
    ]);

  const accountList = (accounts ?? []) as Account[];
  const txList = (transactions ?? []) as Transaction[];
  const debtList = (debts ?? []) as Debt[];
  const reminderList = (reminders ?? []) as Reminder[];

  const totalBalance = accountList.reduce((sum, acc) => sum + computeBalance(acc, txList), 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthTx = txList.filter((tx) => new Date(tx.occurred_at) >= monthStart);
  const monthIncome = thisMonthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = thisMonthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const totalHutang = debtList
    .filter((d) => d.direction === "hutang")
    .reduce((s, d) => s + d.remaining_amount, 0);
  const totalPiutang = debtList
    .filter((d) => d.direction === "piutang")
    .reduce((s, d) => s + d.remaining_amount, 0);

  const overdue = reminderList.filter((r) => new Date(r.due_at) < now);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-rose-600 p-4 text-white shadow-sm">
        <p className="text-xs opacity-80">Total saldo semua rekening</p>
        <p className="mt-1 text-2xl font-semibold">{formatRupiah(totalBalance)}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-white/15 px-3 py-2">
            <p className="opacity-80">Pemasukan bulan ini</p>
            <p className="font-semibold">{formatRupiah(monthIncome)}</p>
          </div>
          <div className="rounded-lg bg-white/15 px-3 py-2">
            <p className="opacity-80">Pengeluaran bulan ini</p>
            <p className="font-semibold">{formatRupiah(monthExpense)}</p>
          </div>
        </div>
      </section>

      {overdue.length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            {overdue.length} pengingat terlewat / jatuh tempo
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {overdue.map((r) => (
              <li key={r.id}>• {r.title} — {formatDateTime(r.due_at)}</li>
            ))}
          </ul>
          <Link href="/reminders" className="mt-2 inline-block text-xs font-medium text-amber-800 underline">
            Lihat semua pengingat
          </Link>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3">
        <Link href="/debts" className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-rose-900/60">Total hutang saya</p>
          <p className="mt-1 text-lg font-semibold text-red-600">{formatRupiah(totalHutang)}</p>
        </Link>
        <Link href="/debts" className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-rose-900/60">Total piutang</p>
          <p className="mt-1 text-lg font-semibold text-emerald-600">{formatRupiah(totalPiutang)}</p>
        </Link>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-rose-900">Rekening</p>
          <Link href="/accounts" className="text-xs text-rose-600 underline">
            Kelola
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {accountList.length === 0 && (
            <p className="text-sm text-rose-900/50">Belum ada rekening. Tambahkan dulu, yuk.</p>
          )}
          {accountList.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between text-sm">
              <span className="text-rose-900/80">{acc.name}</span>
              <span className="font-medium text-rose-900">{formatRupiah(computeBalance(acc, txList))}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-rose-900">Pengingat terdekat</p>
          <Link href="/reminders" className="text-xs text-rose-600 underline">
            Lihat semua
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {reminderList.length === 0 && (
            <p className="text-sm text-rose-900/50">Belum ada pengingat.</p>
          )}
          {reminderList.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-sm">
              <span className="text-rose-900/80">{r.title}</span>
              <span className="text-xs text-rose-900/50">{formatDateTime(r.due_at)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
