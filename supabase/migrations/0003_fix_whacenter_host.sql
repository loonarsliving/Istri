-- Fix: Whacenter's send endpoint lives on app.whacenter.com, not api.whacenter.com.
-- The wrong host was returning HTTP 401 "Invalid API Key" for every send.
-- Confirmed against loonarsliving/mkhsistem, which sends WhatsApp successfully
-- with the same device_id against https://app.whacenter.com/api/send.
create or replace function public.istri_whacenter_send(p_number text, p_message text)
returns void
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  v_device_id text;
begin
  select decrypted_secret into v_device_id from vault.decrypted_secrets where name = 'whacenter_device_id';
  if v_device_id is null then
    raise notice 'whacenter_device_id not set in vault, skipping send';
    return;
  end if;

  perform net.http_post(
    url := 'https://app.whacenter.com/api/send',
    body := jsonb_build_object('device_id', v_device_id, 'number', p_number, 'message', p_message),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 10000
  );
end;
$$;
