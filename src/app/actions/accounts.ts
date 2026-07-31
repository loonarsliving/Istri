"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AccountType } from "@/lib/types";

export async function createAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum login");

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "cash") as AccountType;
  const startingBalance = Number(formData.get("starting_balance") ?? 0);

  if (!name) throw new Error("Nama rekening wajib diisi");

  const { error } = await supabase.from("istri_accounts").insert({
    owner_id: user.id,
    name,
    type,
    starting_balance: startingBalance,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/accounts");
  revalidatePath("/");
}

export async function archiveAccount(accountId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("istri_accounts")
    .update({ archived: true })
    .eq("id", accountId);
  if (error) throw new Error(error.message);

  revalidatePath("/accounts");
  revalidatePath("/");
}
