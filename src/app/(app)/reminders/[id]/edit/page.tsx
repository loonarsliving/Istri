import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateReminder } from "@/app/actions/reminders";
import { toDatetimeLocalValue } from "@/lib/format";
import type { Reminder } from "@/lib/types";

export default async function EditReminderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: reminder } = await supabase
    .from("istri_reminders")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user!.id)
    .single();

  if (!reminder) notFound();
  const r = reminder as Reminder;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/reminders" className="text-sm text-rose-600 underline">
          ← Kembali
        </Link>
      </div>
      <h1 className="text-lg font-semibold text-rose-900">Edit pengingat</h1>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <form action={updateReminder.bind(null, r.id)} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-rose-900/70">Judul</label>
            <input
              name="title"
              required
              defaultValue={r.title}
              className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-rose-900/70">Catatan</label>
            <input
              name="description"
              placeholder="Opsional"
              defaultValue={r.description ?? ""}
              className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-rose-900/70">Kategori</label>
            <select
              name="category"
              defaultValue={r.category}
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
              defaultValue={toDatetimeLocalValue(r.due_at)}
              className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-rose-900/70">Ulangi</label>
            <select
              name="repeat_rule"
              defaultValue={r.repeat_rule}
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
              defaultChecked={r.notify_whatsapp}
              className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-400"
            />
            Kirim juga via WhatsApp
          </label>
          <div>
            <label className="text-xs font-medium text-rose-900/70">Nomor WA tujuan</label>
            <input
              name="notify_phone"
              defaultValue={r.notify_phone ?? ""}
              placeholder="Opsional, contoh: 6281234567890 — kosongkan untuk nomor default"
              className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            />
          </div>
          <button className="w-full rounded-lg bg-rose-600 py-2 text-sm font-medium text-white">
            Simpan perubahan
          </button>
        </form>
      </div>
    </div>
  );
}
