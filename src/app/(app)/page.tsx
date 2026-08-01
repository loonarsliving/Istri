import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/format";
import { computeDebtRatio, computeEmergencyFund, pickDailyTip } from "@/lib/financial-insights";
import { FINANCIAL_TIP_SECTIONS } from "@/lib/financial-tips";
import type { Account, Debt, Transaction } from "@/lib/types";

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

  const [{ data: accounts }, { data: transactions }, { data: debts }] = await Promise.all([
    supabase.from("istri_accounts").select("*").eq("owner_id", user!.id).eq("archived", false),
    supabase.from("istri_transactions").select("*").eq("owner_id", user!.id),
    supabase.from("istri_debts").select("*").eq("owner_id", user!.id).eq("status", "active"),
  ]);

  const accountList = (accounts ?? []) as Account[];
  const txList = (transactions ?? []) as Transaction[];
  const debtList = (debts ?? []) as Debt[];

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

  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const debtRatio = computeDebtRatio(txList, monthStart, monthEnd);
  const emergencyFund = computeEmergencyFund(totalBalance, txList, now);
  const allTips = FINANCIAL_TIP_SECTIONS.flatMap((s) => s.tips);
  const dailyTip = pickDailyTip(allTips, now);

  const debtRatioColor =
    debtRatio.level === "ideal"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : debtRatio.level === "kurang_ideal"
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : debtRatio.level === "tidak_ideal"
          ? "text-red-700 bg-red-50 border-red-200"
          : "text-rose-900/60 bg-white border-rose-100";

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

      {debtRatio.level !== "unknown" && (
        <section className={`rounded-2xl border p-4 ${debtRatioColor}`}>
          <p className="text-xs font-semibold uppercase opacity-70">Rasio cicilan bulan ini</p>
          <p className="mt-1 text-lg font-semibold">
            {((debtRatio.ratio ?? 0) * 100).toFixed(0)}% dari pemasukan
          </p>
          <p className="mt-1 text-xs">{debtRatio.message}</p>
        </section>
      )}

      {emergencyFund.monthsCovered !== null && (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-rose-900/50">Dana darurat</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-rose-100">
            <div
              className="h-full rounded-full bg-rose-500"
              style={{
                width: `${Math.min(100, ((emergencyFund.monthsCovered ?? 0) / emergencyFund.targetMonths) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-rose-900/70">{emergencyFund.message}</p>
        </section>
      )}

      <section className="rounded-2xl border border-rose-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase text-rose-900/50">💡 Tips hari ini</p>
          <Link href="/wawasan" className="text-xs text-rose-600 underline">
            Lihat semua
          </Link>
        </div>
        <p className="mt-2 text-sm text-rose-900/80">{dailyTip}</p>
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
    </div>
  );
}
