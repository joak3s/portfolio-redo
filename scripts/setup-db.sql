-- Create project_tools junction table
CREATE TABLE IF NOT EXISTS project_tools (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (project_id, tool_id)
);

-- Create project_tags junction table
CREATE TABLE IF NOT EXISTS project_tags (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (project_id, tag_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_tools_project_id ON project_tools(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tools_tool_id ON project_tools(tool_id);
CREATE INDEX IF NOT EXISTS idx_project_tags_project_id ON project_tags(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tags_tag_id ON project_tags(tag_id);

-- Enable Row Level Security (RLS)
ALTER TABLE project_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON project_tools
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON project_tags
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON project_tools
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users only" ON project_tags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON project_tools
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON project_tags
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON project_tools
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON project_tags
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role text not null check (role in ('admin', 'user')) default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create profiles policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Create a trigger to set updated_at on profiles
create function public.handle_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profiles_updated
  before update on profiles
  for each row
  execute procedure handle_updated_at();

-- Set up Storage
insert into storage.buckets (id, name, public) values ('project-images', 'project-images', true);

-- Set up Storage RLS policies
create policy "Authenticated users can upload images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'project-images');

create policy "Users can update their own images"
on storage.objects for update
to authenticated
using (bucket_id = 'project-images' AND auth.uid() IN (
  SELECT created_by FROM projects WHERE id = (SELECT project_id FROM project_images WHERE url = object_name)
));

create policy "Public can view published project images"
on storage.objects for select
to public
using (bucket_id = 'project-images' AND EXISTS (
  SELECT 1 FROM projects p
  JOIN project_images pi ON p.id = pi.project_id
  WHERE p.status = 'published' AND pi.url = object_name
)); 