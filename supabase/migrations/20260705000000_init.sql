-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Submissions: raw citizen input
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_text TEXT NOT NULL,
  category TEXT DEFAULT 'Other',
  summary TEXT,
  location_name TEXT,
  ward TEXT DEFAULT 'Central',
  lat FLOAT DEFAULT 51.5074,
  lng FLOAT DEFAULT -0.1278,
  sentiment TEXT DEFAULT 'neutral',
  urgency TEXT DEFAULT 'medium',
  structured_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clusters: grouped similar submissions by category + ward
CREATE TABLE IF NOT EXISTS clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme TEXT NOT NULL,
  category TEXT,
  count INTEGER DEFAULT 0,
  ward TEXT,
  priority_score FLOAT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recommendations: final ranked output for MPs
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  ward TEXT,
  priority_score FLOAT DEFAULT 0,
  rationale TEXT,
  submission_count INTEGER DEFAULT 0,
  estimated_impact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_ward ON submissions(ward);
CREATE INDEX IF NOT EXISTS idx_submissions_category ON submissions(category);
CREATE INDEX IF NOT EXISTS idx_clusters_priority ON clusters(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON recommendations(priority_score DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE clusters;
ALTER PUBLICATION supabase_realtime ADD TABLE recommendations;
