import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function createServiceClient() {
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

export type Submission = {
  id: string;
  raw_text: string;
  category: string;
  summary: string;
  location_name: string;
  ward: string;
  lat: number;
  lng: number;
  sentiment: string;
  urgency: string;
  structured_data: Record<string, unknown>;
  created_at: string;
};

export type Cluster = {
  id: string;
  theme: string;
  category: string;
  count: number;
  ward: string;
  priority_score: number;
  updated_at: string;
};

export type Recommendation = {
  id: string;
  title: string;
  description: string;
  category: string;
  ward: string;
  priority_score: number;
  rationale: string;
  submission_count: number;
  estimated_impact: string;
  created_at: string;
};
