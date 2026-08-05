-- Replaces the wife's 5 scattered daily meal reminders + 6 weekly workout
-- reminders (previously istri_reminders rows titled "🌸 Aku: ...") with a
-- single consolidated WhatsApp digest sent once at 10:00 WIB, listing the
-- whole day's menu plus that day's workout (varies by weekday). Requested
-- because she wants everything up front at 10am instead of piecemeal
-- throughout the day.
create or replace function public.istri_send_wife_daily_digest()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid := '29a1978c-26fc-4b7b-9638-93e9b4fd1ce0';
  v_phone text;
  v_dow int := extract(isodow from now() at time zone 'Asia/Jakarta'); -- 1=Senin ... 7=Minggu
  v_workout text;
  v_message text;
begin
  select whatsapp_number into v_phone
  from public.istri_settings
  where owner_id = v_owner_id and whatsapp_enabled = true;

  if v_phone is null then
    return;
  end if;

  v_workout := case v_dow
    when 1 then E'💪 *Olahraga: Full Body A*\n- Squat (pegangan kursi): 3x12-15\n- Wall/incline push-up: 3x10-12\n- Glute bridge: 3x15\n- Standing row (band/dumbbell ringan): 3x12\n- Plank: 3x20-30 detik\n- Side leg raise: 3x15/sisi'
    when 2 then E'🚶 *Olahraga: Jalan Kaki Cepat 30-45 menit*\nBoleh diselingi jalan santai kalau lelah. Alternatif: sepeda santai.'
    when 3 then E'💪 *Olahraga: Full Body B*\n- Step-up di bangku rendah: 3x10/kaki\n- Wall sit: 3x30 detik\n- Superman: 3x12\n- Bicep curl (botol air/dumbbell ringan): 3x12\n- Seated knee lift: 3x15\n- Calf raise: 3x15'
    when 4 then E'🧘 *Olahraga: Peregangan/Yoga Ringan*\n15-20 menit stretching + jalan santai opsional. Hari pemulihan aktif.'
    when 5 then E'💪 *Olahraga: Full Body A*\n- Squat (pegangan kursi): 3x12-15\n- Wall/incline push-up: 3x10-12\n- Glute bridge: 3x15\n- Standing row (band/dumbbell ringan): 3x12\n- Plank: 3x20-30 detik\n- Side leg raise: 3x15/sisi'
    when 6 then E'🚶 *Olahraga: Jalan Kaki Cepat 30-45 menit*\nBoleh diselingi jalan santai kalau lelah. Alternatif: sepeda santai.'
    else E'😴 *Hari ini istirahat total* — tidak ada jadwal olahraga.'
  end;

  v_message := '🌸 *Jadwal Hari Ini*' || E'\n\n' ||
    '🍳 07.00 Sarapan: Dadar 2 putih telur + 1 kuning telur isi bayam & tomat, 1 lembar roti gandum, timun potong (~300 kkal)' || E'\n' ||
    '🍎 10.00 Snack Pagi: 1 cup yogurt plain/Greek yogurt rendah lemak + ½ apel/pir potong dadu (~120 kkal)' || E'\n' ||
    '🐟 12.30 Makan Siang: 100g ikan/dada ayam tanpa kulit panggang, sayur tumis, lalapan+sambal, nasi merah 1 centong kecil (~450 kkal)' || E'\n' ||
    '🥗 16.00 Snack Sore: 1 buah jeruk/pepaya, atau edamame rebus segenggam (~120 kkal)' || E'\n' ||
    '🍲 19.00 Makan Malam: 100-120g tahu/tempe/ikan (rotasi), sayur bening, nasi merah ½ centong opsional (~400 kkal)' || E'\n\n' ||
    v_workout || E'\n\n' ||
    'Semangat hari ini! 🌸';

  perform public.istri_whacenter_send(v_phone, v_message);
end;
$$;

select cron.schedule(
  'istri-wife-daily-digest',
  '0 3 * * *', -- 10:00 WIB
  $$select public.istri_send_wife_daily_digest();$$
);

-- The per-item reminders this digest replaces were deleted directly against
-- production (not reproduced here as a migration statement since deleting
-- by title match against seeded rows isn't idempotent/safe to replay).
