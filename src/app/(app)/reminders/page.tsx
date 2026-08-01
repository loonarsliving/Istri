import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createReminder, markReminderDone, snoozeReminder, deleteReminder } from "@/app/actions/reminders";
import { formatDateTime } from "@/lib/format";
import type { Reminder } from "@/lib/types";

const CATEGORY_LABEL: Record<string, string> = {
  keuangan: "Keuangan",
  utang: "Utang",
  aktivitas: "Aktivitas",
  lainnya: "Lainnya",
};

export default async function RemindersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: reminders } = await supabase
    .from("istri_reminders")
    .select("*")
    .eq("owner_id", user!.id)
    .eq("status", "pending")
    .order("due_at", { ascending: true });

  const reminderList = (reminders ?? []) as Reminder[];
  const now = new Date();
  const overdue = reminderList.filter((r) => new Date(r.due_at) < now);
  const upcoming = reminderList.filter((r) => new Date(r.due_at) >= now);

  function ReminderCard({ reminder, isOverdue }: { reminder: Reminder; isOverdue: boolean }) {
    return (
      <div className={`rounded-2xl bg-white p-4 shadow-sm ${isOverdue ? "border border-red-200" : ""}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-rose-900">{reminder.title}</p>
            {reminder.description && <p className="text-xs text-rose-900/50">{reminder.description}</p>}
            <p className={`mt-1 text-xs ${isOverdue ? "text-red-600" : "text-rose-900/50"}`}>
              {formatDateTime(reminder.due_at)} · {CATEGORY_LABEL[reminder.category]}
              {reminder.repeat_rule !== "none" && ` · ulang ${reminder.repeat_rule}`}
              {reminder.notify_whatsapp && " · WA"}
            </p>
          </div>
        </div>
        <div className="mt-2 flex gap-3">
          <form action={markReminderDone.bind(null, reminder.id)}>
            <button className="text-xs font-medium text-emerald-700 underline">Selesai</button>
          </form>
          <form action={snoozeReminder.bind(null, reminder.id, 60)}>
            <button className="text-xs font-medium text-amber-700 underline">Tunda 1 jam</button>
          </form>
          <Link href={`/reminders/${reminder.id}/edit`} className="text-xs font-medium text-rose-700 underline">
            Edit
          </Link>
          <form action={deleteReminder.bind(null, reminder.id)}>
            <button className="text-xs font-medium text-red-500 underline">Hapus</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-rose-900">Pengingat</h1>

      {overdue.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-red-600">Jatuh tempo / terlewat</p>
          {overdue.map((r) => (
            <ReminderCard key={r.id} reminder={r} isOverdue />
          ))}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-rose-900/50">Akan datang</p>
        {upcoming.length === 0 && <p className="text-sm text-rose-900/50">Tidak ada pengingat lain.</p>}
        {upcoming.map((r) => (
          <ReminderCard key={r.id} reminder={r} isOverdue={false} />
        ))}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-rose-900">Tambah pengingat</p>
        <form action={createReminder} className="mt-3 space-y-3">
          <div>
            <label className="text-xs font-medium text-rose-900/70">Judul</label>
            <input
              name="title"
              required
              placeholder="Contoh: Bayar listrik, Jemput anak"
              className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-rose-900/70">Catatan</label>
            <input
              name="description"
              placeholder="Opsional"
              className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-rose-900/70">Kategori</label>
            <select
              name="category"
              className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            >
              <option value="lainnya">Lainnya</option>
              <option value="keuangan">Keuangan</option>
              <option value="utang">Utang</option>
              <option value="aktivitas">Aktivitas harian</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-rose-900/70">Tanggal & jam</label>
            <input
              name="due_at"
              type="datetime-local"
              required
              className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-rose-900/70">Ulangi</label>
            <select
              name="repeat_rule"
              className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            >
              <option value="none">Tidak berulang</option>
              <option value="daily">Setiap hari</option>
              <option value="weekly">Setiap minggu</option>
              <option value="monthly">Setiap bulan</option>
              <option value="yearly">Setiap tahun</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-rose-900/70">
            <input
              name="notify_whatsapp"
              type="checkbox"
              className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-400"
            />
            Kirim juga via WhatsApp
          </label>
          <div>
            <label className="text-xs font-medium text-rose-900/70">Nomor WA tujuan</label>
            <input
              name="notify_phone"
              placeholder="Opsional, contoh: 6281234567890 — kosongkan untuk nomor default"
              className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            />
          </div>
          <button className="w-full rounded-lg bg-rose-600 py-2 text-sm font-medium text-white">Simpan</button>
        </form>
      </div>
    </div>
  );
}
