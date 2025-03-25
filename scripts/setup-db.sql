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