-- WhatsApp (Whacenter) notifications: daily tips + reminder alerts sent via pg_cron + pg_net,
-- entirely inside Supabase (no external server needed). Device credential lives in Vault
-- (whacenter_device_id, inserted separately), never in a table.

alter table public.istri_reminders
  add column if not exists whatsapp_sent_at timestamptz;

create table if not exists public.istri_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  whatsapp_number text,
  whatsapp_enabled boolean not null default true,
  daily_tip_hour_wib int not null default 7 check (daily_tip_hour_wib between 0 and 23),
  updated_at timestamptz not null default now()
);

alter table public.istri_settings enable row level security;

create policy istri_settings_owner_all on public.istri_settings
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create trigger istri_settings_set_updated_at
  before update on public.istri_settings
  for each row execute function public.istri_set_updated_at();

-- Flat list of daily tips, mirrored from src/lib/financial-tips.ts so pg_cron can pick one
-- independently of the frontend deploy.
create table if not exists public.istri_daily_tips (
  id serial primary key,
  tip text not null
);

insert into public.istri_daily_tips (tip) values
  ('Formula 50/30/20: 50% kebutuhan pokok (makan, listrik, cicilan wajib), 30% keinginan/gaya hidup, 20% tabungan & investasi.'),
  ('Variasi 40/30/20/10 (populer di Indonesia): 40% kebutuhan pokok, 30% keinginan, 20% tabungan/investasi, 10% zakat/infak/sedekah.'),
  ('Begitu gaji masuk, bayar dulu semua tagihan wajib (listrik, cicilan, zakat) sebelum uang terpakai untuk hal lain.'),
  ('Evaluasi bareng pasangan tiap akhir bulan: cek ulang semua pemasukan & pengeluaran, cari kebocoran dana.'),
  ('Lajang/belum menikah: target dana darurat 3-6x pengeluaran bulanan.'),
  ('Pasangan menikah: idealnya dana darurat 9-12x pengeluaran bulanan.'),
  ('Kalau penghasilan tidak stabil, pertimbangkan target dana darurat di atas 12x pengeluaran bulanan.'),
  ('Simpan dana darurat di rekening terpisah dari rekening harian supaya tidak tergoda terpakai.'),
  ('Total cicilan semua utang sebaiknya di bawah 30-35% dari pendapatan bulanan — batas aman versi OJK.'),
  ('Sebelum ambil utang baru, hitung dulu: (cicilan bulanan + cicilan baru) ÷ pendapatan. Kalau lewat 35%, tunda dulu.'),
  ('Metode Snowball: lunasi dulu utang nominal TERKECIL — efeknya psikologis, tiap lunas jadi motivasi lanjut.'),
  ('Metode Avalanche: lunasi dulu utang BUNGA TERTINGGI — lebih hemat total bunga secara matematis.'),
  ('Catat SEMUA transaksi sekecil apapun — pengeluaran kecil yang tidak tercatat biasanya jadi kebocoran terbesar.'),
  ('Pisahkan rekening: 1 untuk kebutuhan harian, 1 untuk tabungan/dana darurat.'),
  ('Sisihkan tabungan di awal bulan (pay yourself first), bukan dari sisa uang di akhir bulan.'),
  ('Review ulang cicilan & langganan tiap 3 bulan — sering ada yang sudah tidak terpakai tapi tetap kebayar.')
on conflict do nothing;

create table if not exists public.istri_daily_tip_log (
  owner_id uuid not null references auth.users(id) on delete cascade,
  sent_date date not null default current_date,
  tip_id int references public.istri_daily_tips(id),
  primary key (owner_id, sent_date)
);

alter table public.istri_daily_tip_log enable row level security;

create policy istri_daily_tip_log_owner_select on public.istri_daily_tip_log
  for select using (owner_id = auth.uid());

-- Fire-and-forget send via pg_net; response is not awaited (matches this project's
-- existing automation_dispatch_log pattern of async dispatch).
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
    url := 'https://api.whacenter.com/api/send',
    body := jsonb_build_object('device_id', v_device_id, 'number', p_number, 'message', p_message),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 10000
  );
end;
$$;

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
    select r.id, r.owner_id, r.title, r.description, r.due_at
    from public.istri_reminders r
    where r.status = 'pending'
      and r.notify_whatsapp = true
      and r.due_at <= now()
      and (r.whatsapp_sent_at is null or r.whatsapp_sent_at < r.due_at)
  loop
    select s.whatsapp_number into v_phone
    from public.istri_settings s
    where s.owner_id = v_reminder.owner_id and s.whatsapp_enabled = true;

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

create or replace function public.istri_send_daily_tip()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings record;
  v_tip record;
begin
  for v_settings in
    select owner_id, whatsapp_number from public.istri_settings
    where whatsapp_enabled = true and whatsapp_number is not null
  loop
    if exists (
      select 1 from public.istri_daily_tip_log
      where owner_id = v_settings.owner_id and sent_date = current_date
    ) then
      continue;
    end if;

    select id, tip into v_tip
    from public.istri_daily_tips
    order by (id + extract(doy from current_date)::int) % (select count(*) from public.istri_daily_tips)
    limit 1;

    perform public.istri_whacenter_send(v_settings.whatsapp_number, '💡 Tips keuangan hari ini: ' || v_tip.tip);

    insert into public.istri_daily_tip_log (owner_id, sent_date, tip_id)
    values (v_settings.owner_id, current_date, v_tip.id)
    on conflict do nothing;
  end loop;
end;
$$;

-- Every 10 minutes: check for due reminders. Daily at 00:00 UTC (07:00 WIB): send tip of the day.
select cron.schedule('istri-wa-reminders', '*/10 * * * *', $$select public.istri_process_due_reminders();$$);
select cron.schedule('istri-wa-daily-tip', '0 0 * * *', $$select public.istri_send_daily_tip();$$);
