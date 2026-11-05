# Kendi Supabase sıralamanı kurma (isteğe bağlı)

Oyun bu ayar olmadan da çalışır; skorlar cihazda kalır. Kurarsan Şöhret Salonu'nda
"Tüm cihazlar" ve "Son oyunlar" sekmeleri açılır.

1. https://supabase.com adresinde ücretsiz bir proje aç.
2. **SQL Editor**'de şunu çalıştır:

```sql
create table public.plays (
  id bigint generated always as identity primary key,
  name text check (char_length(name) <= 16),
  score integer not null check (score >= 0),
  wave integer, diff text, secs integer, kills integer, age integer,
  mvp text, device text,
  at timestamptz not null default now()
);
alter table public.plays enable row level security;
create policy "herkes okur" on public.plays for select to anon using (true);
create policy "herkes ekler" on public.plays for insert to anon with check (true);
grant select, insert on public.plays to anon;
grant usage on schema public to anon;
```

3. **Project Settings → API**'den *Project URL* ve *publishable (anon)* anahtarını al.
   `service_role` / secret anahtarını asla koyma: bu dosya herkese açıktır.
4. `index.html` içindeki satırı doldur:

```js
const BOARD={url:'https://PROJEN.supabase.co',key:'sb_publishable_...'};
```

Not: Skorlar tarayıcıdan gönderildiği için hileye açıktır. Arkadaşlar arası sıralama için yeterlidir.
