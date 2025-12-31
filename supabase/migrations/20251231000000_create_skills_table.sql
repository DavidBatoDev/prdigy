-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- Create policy for reading skills (public access)
CREATE POLICY "Allow public read access" ON skills
    FOR SELECT USING (true);

-- Create policy for inserting skills (service role only)
CREATE POLICY "Allow service role insert" ON skills
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Insert initial popular skills
INSERT INTO skills (name) VALUES
    ('Graphic Design'),
    ('Content Writing'),
    ('Web Development'),
    ('Data Entry'),
    ('Digital Marketing'),
    ('Project Management'),
    ('Translation'),
    ('Video Editing'),
    ('SEO'),
    ('Social Media Marketing'),
    ('Virtual Assistant'),
    ('Illustration'),
    ('3D Modeling'),
    ('Voice Over'),
    ('Customer Service'),
    ('Accounting'),
    ('Legal Consulting'),
    ('HR & Recruiting'),
    ('Photography'),
    ('Videography'),
    ('Mobile App Development'),
    ('UI/UX Design'),
    ('Data Science'),
    ('Machine Learning'),
    ('Blockchain'),
    ('DevOps'),
    ('Cybersecurity'),
    ('Technical Writing'),
    ('Branding'),
    ('Animation'),
    ('Game Development'),
    ('Software Architecture'),
    ('Cloud Computing'),
    ('QA Testing'),
    ('Scriptwriting'),
    ('Music Production'),
    ('Interior Design'),
    ('Financial Analysis'),
    ('Market Research'),
    ('Business Strategy')
ON CONFLICT (name) DO NOTHING;
