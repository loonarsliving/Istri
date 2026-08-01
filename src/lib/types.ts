export type AccountType = "cash" | "bank" | "e_wallet" | "other";

export interface Account {
  id: string;
  owner_id: string;
  name: string;
  type: AccountType;
  starting_balance: number;
  color: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  owner_id: string;
  account_id: string;
  transfer_to_account_id: string | null;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  note: string | null;
  occurred_at: string;
  created_at: string;
}

export type CategoryKind = "income" | "expense";

export interface Category {
  id: string;
  owner_id: string;
  name: string;
  kind: CategoryKind;
  icon: string | null;
  created_at: string;
}

export type DebtDirection = "hutang" | "piutang";
export type DebtStatus = "active" | "paid_off";

export interface Debt {
  id: string;
  owner_id: string;
  direction: DebtDirection;
  counterparty: string;
  principal_amount: number;
  remaining_amount: number;
  due_date: string | null;
  note: string | null;
  status: DebtStatus;
  created_at: string;
  updated_at: string;
}

export interface DebtPayment {
  id: string;
  owner_id: string;
  debt_id: string;
  account_id: string | null;
  amount: number;
  paid_at: string;
  note: string | null;
  created_at: string;
}

export type ReminderCategory = "keuangan" | "utang" | "aktivitas" | "lainnya";
export type ReminderRepeat = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type ReminderStatus = "pending" | "done" | "snoozed";

export interface Reminder {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  category: ReminderCategory;
  related_debt_id: string | null;
  due_at: string;
  repeat_rule: ReminderRepeat;
  status: ReminderStatus;
  notify_whatsapp: boolean;
  notify_phone: string | null;
  created_at: string;
  updated_at: string;
}
