import { createClient } from "@/lib/supabase/server";
import { createDebt, addDebtPayment, markDebtPaidOff } from "@/app/actions/debts";
import { formatRupiah, formatDate } from "@/lib/format";
import { suggestDebtPayoffOrder } from "@/lib/financial-insights";
import type { Account, Debt } from "@/lib/types";

export default async function DebtsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: debts }, { data: accounts }] = await Promise.all([
    supabase
      .from("istri_debts")
      .select("*")
      .eq("owner_id", user!.id)
      .order("status", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("istri_accounts").select("*").eq("owner_id", user!.id).eq("archived", false),
  ]);

  const debtList = (debts ?? []) as Debt[];
  const accountList = (accounts ?? []) as Account[];
  const active = debtList.filter((d) => d.status === "active");
  const paidOff = debtList.filter((d) => d.status === "paid_off");
  const { snowball } = suggestDebtPayoffOrder(debtList);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-rose-900">Utang & Piutang</h1>

      {snowball.length > 1 && (
        <section className="rounded-2xl border border-rose-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-rose-900/50">
            🎯 Saran urutan pelunasan (metode Snowball)
          </p>
          <p className="mt-1 text-xs text-rose-900/60">
            Lunasi dulu yang nominalnya paling kecil untuk momentum, baru lanjut ke yang lebih besar.
          </p>
          <ol className="mt-2 space-y-1 text-sm text-rose-900/80">
            {snowball.map((d, i) => (
              <li key={d.id}>
                {i + 1}. {d.counterparty} — {formatRupiah(d.remaining_amount)}
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="space-y-2">
        {active.length === 0 && <p className="text-sm text-rose-900/50">Belum ada utang/piutang aktif.</p>}
        {active.map((debt) => {
          const overdue = debt.due_date ? new Date(debt.due_date) < new Date() : false;
          return (
            <div key={debt.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-rose-900">
                    {debt.direction === "hutang" ? "Hutang ke" : "Piutang dari"} {debt.counterparty}
                  </p>
                  {debt.due_date && (
                    <p className={`text-xs ${overdue ? "text-red-600" : "text-rose-900/50"}`}>
                      Jatuh tempo {formatDate(debt.due_date)} {overdue && "· Terlambat!"}
                    </p>
                  )}
                  {debt.note && <p className="text-xs text-rose-900/50">{debt.note}</p>}
                </div>
                <p className={`text-sm font-semibold ${debt.direction === "hutang" ? "text-red-600" : "text-emerald-600"}`}>
                  {formatRupiah(debt.remaining_amount)}
                </p>
              </div>

              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-rose-600 underline">
                  Catat pembayaran / pelunasan
                </summary>
                <form action={addDebtPayment} className="mt-2 space-y-2 rounded-lg bg-rose-50 p-3">
                  <input type="hidden" name="debt_id" value={debt.id} />
                  <input
                    name="amount"
                    type="number"
                    min={1}
                    step="1"
                    required
                    placeholder="Jumlah dibayar (Rp)"
                    className="w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
                  />
                  <select
                    name="account_id"
                    className="w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
                  >
                    <option value="">Tanpa catat ke rekening</option>
                    {accountList.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                  <button className="w-full rounded-lg bg-rose-600 py-1.5 text-xs font-medium text-white">
                    Simpan pembayaran
                  </button>
                </form>
                <form action={markDebtPaidOff.bind(null, debt.id)} className="mt-2">
                  <button className="text-xs text-emerald-700 underline">Tandai lunas</button>
                </form>
              </details>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-rose-900">Tambah utang / piutang</p>
        <form action={createDebt} className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="cursor-pointer rounded-lg border border-rose-200 py-2 text-center text-xs has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50">
              <input type="radio" name="direction" value="hutang" defaultChecked className="hidden" />
              Saya berhutang
            </label>
            <label className="cursor-pointer rounded-lg border border-rose-200 py-2 text-center text-xs has-[:checked]:border-rose-500 has-[:checked]:bg-rose-50">
              <input type="radio" name="direction" value="piutang" className="hidden" />
              Orang berhutang ke saya
            </label>
          </div>
          <div>
            <label className="text-xs font-medium text-rose-900/70">Nama orang/pihak</label>
            <input
              name="counterparty"
              required
              className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-rose-900/70">Jumlah (Rp)</label>
            <input
              name="principal_amount"
              type="number"
              min={1}
              step="1"
              required
              className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-rose-900/70">Jatuh tempo (opsional, akan dibuatkan pengingat)</label>
            <input
              name="due_date"
              type="date"
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
          <button className="w-full rounded-lg bg-rose-600 py-2 text-sm font-medium text-white">Simpan</button>
        </form>
      </div>

      {paidOff.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-rose-900">Sudah lunas</p>
          <div className="mt-2 space-y-1">
            {paidOff.map((debt) => (
              <p key={debt.id} className="text-sm text-rose-900/50 line-through">
                {debt.direction === "hutang" ? "Hutang ke" : "Piutang dari"} {debt.counterparty} —{" "}
                {formatRupiah(debt.principal_amount)}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
