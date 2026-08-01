-- Lets a reminder notify a different WhatsApp number than the account's
-- default (istri_settings.whatsapp_number) -- needed once reminders started
-- covering both the account owner's own to-dos and reminders meant for
-- someone else (e.g. the husband's own workout schedule going to his phone).
alter table public.istri_reminders add column if not exists notify_phone text;

create or replace function public.istri_process_due_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reminder record;
  v_phone text;
begin
  for v_reminder in
    select r.id, r.owner_id, r.title, r.description, r.due_at, r.notify_phone
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

    update public.istri_reminders set whatsapp_sent_at = now() where id = v_reminder.id;
  end loop;
end;
$$;
