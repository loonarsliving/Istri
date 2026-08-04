-- istri_process_due_reminders only sent the WA and stamped whatsapp_sent_at;
-- due_at itself only ever advanced via the app's "Selesai" button
-- (markReminderDone). Notification-only reminders (daily meal/workout
-- schedules) are never manually completed, so after their first send
-- due_at stayed in the past forever and the "sent_at < due_at" guard
-- never became true again -- WhatsApp silently stopped after day one.
-- Cron now advances due_at itself for repeat_rule <> 'none' reminders.
create or replace function public.istri_process_due_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reminder record;
  v_phone text;
  v_next_due timestamptz;
begin
  for v_reminder in
    select r.id, r.owner_id, r.title, r.description, r.due_at, r.notify_phone, r.repeat_rule
    from public.istri_reminders r
    where r.status = 'pending'
      and r.notify_whatsapp = true
      and r.due_at <= now()
      and (r.whatsapp_sent_at is null or r.whatsapp_sent_at < r.due_at)
  loop
    if v_reminder.notify_phone is not null then
      v_phone := v_reminder.notify_phone;
    else
      select s.whatsapp_number into v_phone
      from public.istri_settings s
      where s.owner_id = v_reminder.owner_id and s.whatsapp_enabled = true;
    end if;

    if v_phone is not null then
      perform public.istri_whacenter_send(
        v_phone,
        '⏰ Pengingat: ' || v_reminder.title ||
          case when v_reminder.description is not null then E'\n' || v_reminder.description else '' end
      );
    end if;

    v_next_due := case v_reminder.repeat_rule
      when 'daily' then v_reminder.due_at + interval '1 day'
      when 'weekly' then v_reminder.due_at + interval '7 days'
      when 'monthly' then v_reminder.due_at + interval '1 month'
      when 'yearly' then v_reminder.due_at + interval '1 year'
      else v_reminder.due_at
    end;

    update public.istri_reminders
    set whatsapp_sent_at = now(), due_at = v_next_due
    where id = v_reminder.id;
  end loop;
end;
$$;
