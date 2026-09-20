-- Add a dedicated private profile-image bucket and seed the first
-- selectable professional skills. Stable taxonomy keys are language-independent.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "profile image owners can read files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "profile image owners can upload files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "profile image owners can update files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "profile image owners can delete files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

insert into public.taxonomy_terms(term_type, stable_key, label_en, label_uk, sort_order)
values
  ('skill','ceramics.wheel_throwing','Wheel throwing','Гончарний круг',10),
  ('skill','ceramics.hand_building','Hand building','Ручне формування',20),
  ('skill','ceramics.glazing','Ceramic glazing','Глазурування кераміки',30),
  ('skill','ceramics.firing','Kiln firing','Випал у печі',40),
  ('skill','wood.joinery','Joinery','Столярні з’єднання',50),
  ('skill','wood.carving','Wood carving','Різьблення по дереву',60),
  ('skill','wood.furniture_making','Furniture making','Виготовлення меблів',70),
  ('skill','textiles.weaving','Weaving','Ткацтво',80),
  ('skill','textiles.embroidery','Embroidery','Вишивка',90),
  ('skill','textiles.sewing','Sewing','Шиття',100),
  ('skill','metal.smithing','Smithing','Ковальство',110),
  ('skill','metal.fabrication','Metal fabrication','Виготовлення виробів з металу',120),
  ('skill','glass.forming','Glass forming','Формування скла',130),
  ('skill','jewellery.making','Jewellery making','Виготовлення прикрас',140),
  ('skill','restoration.conservation','Conservation','Консервація',150),
  ('skill','restoration.repair','Restoration repair','Реставраційний ремонт',160),
  ('skill','stone.carving','Stone carving','Різьблення по каменю',170),
  ('skill','leather.construction','Leather construction','Виготовлення виробів зі шкіри',180)
on conflict (stable_key) do update
set label_en = excluded.label_en,
    label_uk = excluded.label_uk,
    sort_order = excluded.sort_order,
    is_active = true;
