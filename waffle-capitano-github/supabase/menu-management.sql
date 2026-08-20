-- إعداد إدارة منيو وافل كابيتانو والصور.
-- هذا الملف مطابق للإعداد المطبق على مشروع Supabase الإنتاجي.

begin;

alter table public.dessert_products
  add column if not exists image_path text,
  add column if not exists image_position_x smallint not null default 50,
  add column if not exists image_position_y smallint not null default 50,
  add column if not exists image_zoom numeric(3,2) not null default 1.00,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.dessert_products'::regclass
      and conname = 'dessert_products_image_path_check'
  ) then
    alter table public.dessert_products
      add constraint dessert_products_image_path_check
      check (
        image_path is null
        or (
          char_length(image_path) between 1 and 500
          and image_path !~ '(^|/)\.\.(/|$)'
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.dessert_products'::regclass
      and conname = 'dessert_products_image_position_x_check'
  ) then
    alter table public.dessert_products
      add constraint dessert_products_image_position_x_check
      check (image_position_x between 0 and 100);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.dessert_products'::regclass
      and conname = 'dessert_products_image_position_y_check'
  ) then
    alter table public.dessert_products
      add constraint dessert_products_image_position_y_check
      check (image_position_y between 0 and 100);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.dessert_products'::regclass
      and conname = 'dessert_products_image_zoom_check'
  ) then
    alter table public.dessert_products
      add constraint dessert_products_image_zoom_check
      check (image_zoom between 1.00 and 3.00);
  end if;
end $$;

grant select on public.dessert_products to anon;
grant select, insert, update on public.dessert_products to authenticated;

drop policy if exists "public can read available dessert products" on public.dessert_products;
create policy "public can read available dessert products"
on public.dessert_products for select to anon
using (available = true);

drop policy if exists "dessert staff insert products" on public.dessert_products;
create policy "dessert staff insert products"
on public.dessert_products for insert to authenticated
with check ((select private.is_dessert_staff()));

drop policy if exists "dessert staff update products" on public.dessert_products;
create policy "dessert staff update products"
on public.dessert_products for update to authenticated
using ((select private.is_dessert_staff()))
with check ((select private.is_dessert_staff()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dessert-products', 'dessert-products', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "dessert staff read product images" on storage.objects;
create policy "dessert staff read product images"
on storage.objects for select to authenticated
using (bucket_id = 'dessert-products' and (select private.is_dessert_staff()));

drop policy if exists "dessert staff upload product images" on storage.objects;
create policy "dessert staff upload product images"
on storage.objects for insert to authenticated
with check (bucket_id = 'dessert-products' and (select private.is_dessert_staff()));

drop policy if exists "dessert staff update product images" on storage.objects;
create policy "dessert staff update product images"
on storage.objects for update to authenticated
using (bucket_id = 'dessert-products' and (select private.is_dessert_staff()))
with check (bucket_id = 'dessert-products' and (select private.is_dessert_staff()));

drop policy if exists "dessert staff delete product images" on storage.objects;
create policy "dessert staff delete product images"
on storage.objects for delete to authenticated
using (bucket_id = 'dessert-products' and (select private.is_dessert_staff()));

commit;
