-- สร้าง sequence สำหรับ auto-increment ID
CREATE SEQUENCE IF NOT EXISTS projects_id_seq START 1;

-- Create the projects table
CREATE TABLE projects (
  id INTEGER PRIMARY KEY DEFAULT nextval('projects_id_seq'),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  link TEXT NOT NULL,
  image TEXT NOT NULL, -- base64 encoded image
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  z FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
-- Enable row level security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read projects
CREATE POLICY "Allow anyone to read projects" 
  ON projects FOR SELECT USING (true);

-- Allow anyone to insert projects
CREATE POLICY "Allow anyone to insert projects" 
  ON projects FOR INSERT WITH CHECK (true);

-- Create index for improved query performance
CREATE INDEX projects_created_at_idx ON projects (created_at); 