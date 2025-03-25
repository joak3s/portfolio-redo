-- Enable RLS
alter table storage.objects enable row level security;

-- Create policies for storage.objects
drop policy if exists "Allow authenticated users to upload files" on storage.objects;
create policy "Allow authenticated users to upload files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'project-images' AND
  (storage.foldername(name))[1] = 'projects'
);

drop policy if exists "Allow authenticated users to select files" on storage.objects;
create policy "Allow authenticated users to select files"
on storage.objects for select
to authenticated
using (bucket_id = 'project-images');

drop policy if exists "Allow authenticated users to update files" on storage.objects;
create policy "Allow authenticated users to update files"
on storage.objects for update
to authenticated
using (bucket_id = 'project-images');

drop policy if exists "Allow authenticated users to delete files" on storage.objects;
create policy "Allow authenticated users to delete files"
on storage.objects for delete
to authenticated
using (bucket_id = 'project-images');

-- Create policies for project_images table
alter table public.project_images enable row level security;

drop policy if exists "Enable read access for all users" on public.project_images;
create policy "Enable read access for all users"
on public.project_images for select
to authenticated
using (true);

drop policy if exists "Enable insert for authenticated users" on public.project_images;
create policy "Enable insert for authenticated users"
on public.project_images for insert
to authenticated
with check (true);

drop policy if exists "Enable update for authenticated users" on public.project_images;
create policy "Enable update for authenticated users"
on public.project_images for update
to authenticated
using (true);

drop policy if exists "Enable delete for authenticated users" on public.project_images;
create policy "Enable delete for authenticated users"
on public.project_images for delete
to authenticated
using (true);

-- Create the storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do update
set public = true; 