import type { Debt, Transaction } from "@/lib/types";

export type DebtRatioLevel = "ideal" | "kurang_ideal" | "tidak_ideal" | "unknown";

export interface DebtRatioInsight {
  level: DebtRatioLevel;
  ratio: number | null;
  monthlyDebtPayments: number;
  monthlyIncome: number;
  message: string;
}

// Thresholds per OJK / perbankan guidance: <35% ideal, 35-50% kurang ideal, >=50% tidak ideal.
export function computeDebtRatio(
  transactions: Transaction[],
  monthStart: Date,
  monthEnd: Date
): DebtRatioInsight {
  const monthTx = transactions.filter((tx) => {
    const d = new Date(tx.occurred_at);
    return d >= monthStart && d < monthEnd;
  });

  const monthlyIncome = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthlyDebtPayments = monthTx
    .filter((t) => t.type === "expense" && (t.note ?? "").toLowerCase().includes("pembayaran utang"))
    .reduce((s, t) => s + t.amount, 0);

  if (monthlyIncome <= 0) {
    return {
      level: "unknown",
      ratio: null,
      monthlyDebtPayments,
      monthlyIncome,
      message: "Belum ada data pemasukan bulan ini untuk menghitung rasio utang.",
    };
  }

  const ratio = monthlyDebtPayments / monthlyIncome;
  let level: DebtRatioLevel = "ideal";
  let message = "Rasio cicilan terhadap pemasukan masih di batas aman (di bawah 35%).";
  if (ratio >= 0.5) {
    level = "tidak_ideal";
    message = "Cicilan sudah di atas 50% dari pemasukan bulan ini — berisiko mengganggu kebutuhan pokok. Pertimbangkan untuk tidak menambah utang baru dulu.";
  } else if (ratio >= 0.35) {
    level = "kurang_ideal";
    message = "Cicilan sudah 35-50% dari pemasukan bulan ini — sebaiknya berhati-hati menambah utang baru.";
  }

  return { level, ratio, monthlyDebtPayments, monthlyIncome, message };
}

export interface EmergencyFundInsight {
  totalBalance: number;
  avgMonthlyExpense: number;
  monthsCovered: number | null;
  targetMonths: number;
  message: string;
}

// Rule of thumb: 6x average monthly expense as a reasonable default target
// (3-6x for singles, 9-12x for married couples/families per Kemenkeu guidance).
export function computeEmergencyFund(
  totalBalance: number,
  transactions: Transaction[],
  now: Date,
  targetMonths = 6
): EmergencyFundInsight {
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const recentExpenses = transactions.filter(
    (tx) => tx.type === "expense" && new Date(tx.occurred_at) >= threeMonthsAgo
  );
  const totalExpense = recentExpenses.reduce((s, t) => s + t.amount, 0);
  const avgMonthlyExpense = totalExpense / 3;

  if (avgMonthlyExpense <= 0) {
    return {
      totalBalance,
      avgMonthlyExpense: 0,
      monthsCovered: null,
      targetMonths,
      message: "Belum cukup data pengeluaran untuk menghitung target dana darurat.",
    };
  }

  const monthsCovered = totalBalance / avgMonthlyExpense;
  const pct = Math.min(100, Math.round((monthsCovered / targetMonths) * 100));
  const message =
    monthsCovered >= targetMonths
      ? `Dana daruratmu sudah mencukupi target ${targetMonths} bulan pengeluaran. Mantap!`
      : `Saldo saat ini setara ${monthsCovered.toFixed(1)} bulan pengeluaran (${pct}% dari target ${targetMonths} bulan).`;

  return { totalBalance, avgMonthlyExpense, monthsCovered, targetMonths, message };
}

export function pickDailyTip(tips: string[], seed: Date): string {
  const dayIndex = Math.floor(seed.getTime() / (1000 * 60 * 60 * 24));
  return tips[dayIndex % tips.length];
}

export function suggestDebtPayoffOrder(debts: Debt[]): { snowball: Debt[]; avalanche: Debt[] } {
  const active = debts.filter((d) => d.status === "active" && d.direction === "hutang");
  const snowball = [...active].sort((a, b) => a.remaining_amount - b.remaining_amount);
  // We don't track interest rate per debt yet, so avalanche falls back to largest-first
  // (paying the biggest obligation down first) until interest rate tracking is added.
  const avalanche = [...active].sort((a, b) => b.remaining_amount - a.remaining_amount);
  return { snowball, avalanche };
}
