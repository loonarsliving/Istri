import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/server";
import ReminderWatcher from "@/components/ReminderWatcher";

const NAV_ITEMS = [
  { href: "/", label: "Ringkasan", icon: "🏠" },
  { href: "/transactions", label: "Transaksi", icon: "💸" },
  { href: "/accounts", label: "Rekening", icon: "🏦" },
  { href: "/debts", label: "Utang", icon: "📒" },
  { href: "/reminders", label: "Pengingat", icon: "⏰" },
  { href: "/wawasan", label: "Wawasan", icon: "📚" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-rose-50/40">
      <header className="flex items-center justify-between border-b border-rose-100 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-rose-900">Catatanku</p>
          <p className="text-xs text-rose-900/50">{user?.email}</p>
        </div>
        <form action={signOut}>
          <button className="text-xs font-medium text-rose-600 underline">Keluar</button>
        </form>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4">{children}</main>

      <ReminderWatcher />

      <nav className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t border-rose-100 bg-white">
        <div className="grid grid-cols-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 py-2 text-[10px] text-rose-900/70 hover:text-rose-600"
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
