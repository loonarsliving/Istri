"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TransactionType } from "@/lib/types";

export async function createTransaction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login");

  const type = String(formData.get("type") ?? "expense") as TransactionType;
  const accountId = String(formData.get("account_id") ?? "");
  const transferToAccountId = String(formData.get("transfer_to_account_id") ?? "") || null;
  const amount = Number(formData.get("amount") ?? 0);
  const note = String(formData.get("note") ?? "").trim() || null;
  const occurredAt = String(formData.get("occurred_at") ?? "") || new Date().toISOString();
  const categoryName = String(formData.get("category_name") ?? "").trim();

  if (!accountId) throw new Error("Pilih rekening");
  if (!amount || amount <= 0) throw new Error("Jumlah harus lebih dari 0");
  if (type === "transfer" && !transferToAccountId) throw new Error("Pilih rekening tujuan");

  let categoryId: string | null = null;
  if (categoryName && type !== "transfer") {
    const { data: existing } = await supabase
      .from("istri_categories")
      .select("id")
      .eq("owner_id", user.id)
      .eq("kind", type)
      .ilike("name", categoryName)
      .maybeSingle();

    if (existing) {
      categoryId = existing.id;
    } else {
      const { data: created, error: catError } = await supabase
        .from("istri_categories")
        .insert({ owner_id: user.id, name: categoryName, kind: type })
        .select("id")
        .single();
      if (catError) throw new Error(catError.message);
      categoryId = created.id;
    }
  }

  const { error } = await supabase.from("istri_transactions").insert({
    owner_id: user.id,
    account_id: accountId,
    transfer_to_account_id: type === "transfer" ? transferToAccountId : null,
    category_id: categoryId,
    type,
    amount,
    note,
    occurred_at: occurredAt,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/");
}

export async function deleteTransaction(transactionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("istri_transactions").delete().eq("id", transactionId);
  if (error) throw new Error(error.message);

  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/");
}
