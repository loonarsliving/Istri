"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ReminderCategory, ReminderRepeat } from "@/lib/types";

export async function createReminder(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "lainnya") as ReminderCategory;
  const dueAtRaw = String(formData.get("due_at") ?? "");
  const repeatRule = String(formData.get("repeat_rule") ?? "none") as ReminderRepeat;
  const notifyWhatsapp = formData.get("notify_whatsapp") === "on";

  if (!title) throw new Error("Judul pengingat wajib diisi");
  if (!dueAtRaw) throw new Error("Tanggal & jam wajib diisi");

  const { error } = await supabase.from("istri_reminders").insert({
    owner_id: user.id,
    title,
    description,
    category,
    due_at: new Date(dueAtRaw).toISOString(),
    repeat_rule: repeatRule,
    notify_whatsapp: notifyWhatsapp,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/reminders");
  revalidatePath("/");
}

export async function updateReminder(reminderId: string, formData: FormData) {
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "lainnya") as ReminderCategory;
  const dueAtRaw = String(formData.get("due_at") ?? "");
  const repeatRule = String(formData.get("repeat_rule") ?? "none") as ReminderRepeat;
  const notifyWhatsapp = formData.get("notify_whatsapp") === "on";

  if (!title) throw new Error("Judul pengingat wajib diisi");
  if (!dueAtRaw) throw new Error("Tanggal & jam wajib diisi");

  const { error } = await supabase
    .from("istri_reminders")
    .update({
      title,
      description,
      category,
      due_at: new Date(dueAtRaw).toISOString(),
      repeat_rule: repeatRule,
      notify_whatsapp: notifyWhatsapp,
    })
    .eq("id", reminderId);
  if (error) throw new Error(error.message);

  revalidatePath("/reminders");
  revalidatePath("/");
  redirect("/reminders");
}

function nextOccurrence(dueAt: string, repeat: ReminderRepeat): string | null {
  const date = new Date(dueAt);
  switch (repeat) {
    case "daily":
      date.setDate(date.getDate() + 1);
      return date.toISOString();
    case "weekly":
      date.setDate(date.getDate() + 7);
      return date.toISOString();
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      return date.toISOString();
    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      return date.toISOString();
    default:
      return null;
  }
}

export async function markReminderDone(reminderId: string) {
  const supabase = await createClient();
  const { data: reminder, error: fetchError } = await supabase
    .from("istri_reminders")
    .select("due_at, repeat_rule")
    .eq("id", reminderId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const next = nextOccurrence(reminder.due_at, reminder.repeat_rule);

  if (next) {
    const { error } = await supabase
      .from("istri_reminders")
      .update({ due_at: next, status: "pending" })
      .eq("id", reminderId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("istri_reminders")
      .update({ status: "done" })
      .eq("id", reminderId);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/reminders");
  revalidatePath("/");
}

export async function snoozeReminder(reminderId: string, minutes: number) {
  const supabase = await createClient();
  const { data: reminder, error: fetchError } = await supabase
    .from("istri_reminders")
    .select("due_at")
    .eq("id", reminderId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const newDue = new Date(new Date(reminder.due_at).getTime() + minutes * 60_000);

  const { error } = await supabase
    .from("istri_reminders")
    .update({ due_at: newDue.toISOString(), status: "pending" })
    .eq("id", reminderId);
  if (error) throw new Error(error.message);

  revalidatePath("/reminders");
  revalidatePath("/");
}

export async function deleteReminder(reminderId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("istri_reminders").delete().eq("id", reminderId);
  if (error) throw new Error(error.message);

  revalidatePath("/reminders");
  revalidatePath("/");
}
