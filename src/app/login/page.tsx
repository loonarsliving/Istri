"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function describeError(err: unknown): string {
    if (err instanceof Error) {
      const extra = Object.getOwnPropertyNames(err)
        .filter((k) => k !== "message" && k !== "stack")
        .map((k) => `${k}=${JSON.stringify((err as unknown as Record<string, unknown>)[k])}`)
        .join(", ");
      return `${err.name || "Error"}: ${err.message || "(tanpa pesan)"}${extra ? ` [${extra}]` : ""}`;
    }
    try {
      return `Non-error thrown: ${JSON.stringify(err)}`;
    } catch {
      return `Non-error thrown: ${String(err)}`;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(describeError(error));
          setLoading(false);
          return;
        }
        if (!data.session) {
          setError("Login sukses tapi tidak ada session dikembalikan (cek cookie browser).");
          setLoading(false);
          return;
        }
        router.replace("/");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setError(describeError(error));
          setLoading(false);
          return;
        }
        setInfo("Akun dibuat! Silakan login.");
        setMode("login");
        setLoading(false);
      }
    } catch (err) {
      setError(`EXCEPTION: ${describeError(err)}`);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-rose-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-rose-900">Catatanku</h1>
        <p className="mt-1 text-sm text-rose-900/60">
          Keuangan, utang, dan pengingat harian dalam satu tempat.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <div>
            <label className="text-sm font-medium text-rose-900/80">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-rose-900/80">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-rose-200 px-3 py-2 text-sm outline-none focus:border-rose-400"
            />
          </div>

          {error && <p className="text-sm text-red-600 break-words">{error}</p>}
          {info && <p className="text-sm text-emerald-600">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-rose-600 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full text-center text-sm text-rose-700 underline"
        >
          {mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
        </button>
      </div>
    </div>
  );
}
