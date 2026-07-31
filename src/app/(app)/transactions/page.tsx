import { createClient } from "@/lib/supabase/server";
import { deleteTransaction } from "@/app/actions/transactions";
import TransactionForm from "@/components/TransactionForm";
import { formatRupiah, formatDateTime } from "@/lib/format";
import type { Account, Transaction } from "@/lib/types";

export default async function TransactionsPage() {
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
    supabase
      .from("istri_transactions")
      .select("*")
      .eq("owner_id", user!.id)
      .order("occurred_at", { ascending: false })
      .limit(50),
  ]);

  const accountList = (accounts ?? []) as Account[];
  const txList = (transactions ?? []) as Transaction[];
  const accountName = (id: string) => accountList.find((a) => a.id === id)?.name ?? "-";

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-rose-900">Transaksi</h1>

      {accountList.length === 0 ? (
        <p className="rounded-2xl bg-white p-4 text-sm text-rose-900/60 shadow-sm">
          Tambahkan rekening dulu di menu Rekening sebelum mencatat transaksi.
        </p>
      ) : (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-rose-900">Catat transaksi</p>
          <TransactionForm accounts={accountList} />
        </div>
      )}

      <div className="space-y-2">
        {txList.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm">
            <div>
              <p className="text-sm font-medium text-rose-900">
                {tx.type === "transfer"
                  ? `${accountName(tx.account_id)} → ${accountName(tx.transfer_to_account_id ?? "")}`
                  : accountName(tx.account_id)}
              </p>
              <p className="text-xs text-rose-900/50">
                {tx.note ?? (tx.type === "transfer" ? "Transfer antar rekening" : "-")} · {formatDateTime(tx.occurred_at)}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-semibold ${
                  tx.type === "income" ? "text-emerald-600" : tx.type === "expense" ? "text-red-600" : "text-rose-900"
                }`}
              >
                {tx.type === "expense" ? "-" : tx.type === "income" ? "+" : ""}
                {formatRupiah(tx.amount)}
              </p>
              <form action={deleteTransaction.bind(null, tx.id)}>
                <button className="text-xs text-red-500 underline">Hapus</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
