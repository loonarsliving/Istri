import { createClient } from "@/lib/supabase/server";
import { createAccount, archiveAccount } from "@/app/actions/accounts";
import { formatRupiah } from "@/lib/format";
import type { Account, Transaction } from "@/lib/types";

function computeBalance(account: Account, transactions: Transaction[]): number {
  return transactions.reduce((balance, tx) => {
    if (tx.type === "income" && tx.account_id === account.id) return balance + tx.amount;
    if (tx.type === "expense" && tx.account_id === account.id) return balance - tx.amount;
    if (tx.type === "transfer" && tx.account_id === account.id) return balance - tx.amount;
    if (tx.type === "transfer" && tx.transfer_to_account_id === account.id) return balance + tx.amount;
    return balance;
  }, account.starting_balance);
}

export default async function AccountsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: accounts }, { data: transactions }] = await Promise.all([
    supabase
      .from("istri_accounts")
      .select("*")
      .eq("owner_id", user!.id)
      .eq("archived", false)
      .order("created_at", { ascending: true }),
    supabase.from("istri_transactions").select("*").eq("owner_id", user!.id),
  ]);

  const accountList = (accounts ?? []) as Account[];
  const txList = (transactions ?? []) as Transaction[];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-rose-900">Rekening</h1>

      <div className="space-y-2">
        {accountList.length === 0 && (
          <p className="text-sm text-rose-900/50">Belum ada rekening.</p>
        )}
        {accountList.map((acc) => (
          <div key={acc.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm font-medium text-rose-900">{acc.name}</p>
              <p className="text-xs text-rose-900/50">{acc.type}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-rose-900">{formatRupiah(computeBalance(acc, txList))}</p>
              <form action={archiveAccount.bind(null, acc.id)}>
                <button className="text-xs text-red-500 underline">Arsipkan</button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-rose-900">Tambah rekening</p>
        <form action={createAccount} className="mt-3 space-y-3">
          <div>
            <label className="text-xs font-medium text-rose-900/70">Nama rekening</label>
            <input
              name="name"
              required
              placeholder="Contoh: BCA, Dompet Tunai"
              className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-rose-900/70">Jenis</label>
            <select
              name="type"
              className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            >
              <option value="cash">Tunai</option>
              <option value="bank">Bank</option>
              <option value="e_wallet">E-Wallet</option>
              <option value="other">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-rose-900/70">Saldo awal</label>
            <input
              name="starting_balance"
              type="number"
              min={0}
              step="1"
              defaultValue={0}
              className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            />
          </div>
          <button className="w-full rounded-lg bg-rose-600 py-2 text-sm font-medium text-white">
            Simpan
          </button>
        </form>
      </div>
    </div>
  );
}
