"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DebtDirection } from "@/lib/types";

export async function createDebt(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login");

  const direction = String(formData.get("direction") ?? "hutang") as DebtDirection;
  const counterparty = String(formData.get("counterparty") ?? "").trim();
  const principalAmount = Number(formData.get("principal_amount") ?? 0);
  const dueDate = String(formData.get("due_date") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!counterparty) throw new Error("Nama orang/pihak wajib diisi");
  if (!principalAmount || principalAmount <= 0) throw new Error("Jumlah harus lebih dari 0");

  const { data: debt, error } = await supabase
    .from("istri_debts")
    .insert({
      owner_id: user.id,
      direction,
      counterparty,
      principal_amount: principalAmount,
      remaining_amount: principalAmount,
      due_date: dueDate,
      note,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  if (dueDate) {
    await supabase.from("istri_reminders").insert({
      owner_id: user.id,
      title:
        direction === "hutang"
          ? `Bayar hutang ke ${counterparty}`
          : `Tagih piutang dari ${counterparty}`,
      category: "utang",
      related_debt_id: debt.id,
      due_at: new Date(`${dueDate}T09:00:00`).toISOString(),
    });
  }

  revalidatePath("/debts");
  revalidatePath("/reminders");
  revalidatePath("/");
}

export async function addDebtPayment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login");

  const debtId = String(formData.get("debt_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const accountId = String(formData.get("account_id") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!debtId) throw new Error("Utang tidak ditemukan");
  if (!amount || amount <= 0) throw new Error("Jumlah harus lebih dari 0");

  const { error } = await supabase.from("istri_debt_payments").insert({
    owner_id: user.id,
    debt_id: debtId,
    account_id: accountId,
    amount,
    note,
  });
  if (error) throw new Error(error.message);

  if (accountId) {
    const { data: debt } = await supabase
      .from("istri_debts")
      .select("direction, counterparty")
      .eq("id", debtId)
      .single();
    if (debt) {
      await supabase.from("istri_transactions").insert({
        owner_id: user.id,
        account_id: accountId,
        type: debt.direction === "hutang" ? "expense" : "income",
        amount,
        note: `Pembayaran utang: ${debt.counterparty}`,
      });
    }
  }

  revalidatePath("/debts");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/");
}

export async function markDebtPaidOff(debtId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("istri_debts")
    .update({ status: "paid_off", remaining_amount: 0 })
    .eq("id", debtId);
  if (error) throw new Error(error.message);

  revalidatePath("/debts");
  revalidatePath("/");
}
