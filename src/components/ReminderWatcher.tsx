"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const CHECK_INTERVAL_MS = 60_000;

export default function ReminderWatcher() {
  const notifiedIds = useRef(new Set<string>());

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const supabase = createClient();

    async function checkDueReminders() {
      if (Notification.permission !== "granted") return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: reminders } = await supabase
        .from("istri_reminders")
        .select("id, title, description, due_at")
        .eq("owner_id", user.id)
        .eq("status", "pending")
        .lte("due_at", new Date().toISOString());

      for (const reminder of reminders ?? []) {
        if (notifiedIds.current.has(reminder.id)) continue;
        notifiedIds.current.add(reminder.id);
        new Notification(reminder.title, {
          body: reminder.description ?? "Waktunya diingat!",
          tag: reminder.id,
        });
      }
    }

    checkDueReminders();
    const interval = setInterval(checkDueReminders, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
