import { chatCompletion } from "./llm";

export type ExtractedSubmission = {
  category: string;
  summary: string;
  location_name: string;
  ward: string;
  lat: number;
  lng: number;
  sentiment: string;
  urgency: string;
};

const LONDON_WARDS = [
  "Hackney", "Southwark", "Islington", "Lambeth",
  "Tower Hamlets", "Camden", "Westminster", "Lewisham",
  "Newham", "Haringey", "Waltham Forest", "Greenwich",
];

const CATEGORIES = [
  "Roads & Transport", "Parks & Green Spaces", "Housing",
  "Healthcare", "Education", "Utilities", "Safety & Crime", "Environment",
];

// Ward coordinate lookup (approx centres)
const WARD_COORDS: Record<string, [number, number]> = {
  "Hackney": [51.5450, -0.0553],
  "Southwark": [51.5035, -0.0804],
  "Islington": [51.5416, -0.1025],
  "Lambeth": [51.4955, -0.1162],
  "Tower Hamlets": [51.5099, -0.0059],
  "Camden": [51.5390, -0.1426],
  "Westminster": [51.4975, -0.1357],
  "Lewisham": [51.4615, -0.0117],
  "Newham": [51.5077, 0.0469],
  "Haringey": [51.5906, -0.1119],
  "Waltham Forest": [51.5908, -0.0134],
  "Greenwich": [51.4810, 0.0549],
};

export async function extractSubmission(text: string): Promise<ExtractedSubmission> {
  const prompt = `You are an AI assistant helping analyse citizen feedback for a UK Member of Parliament.

Extract structured information from this citizen submission. Return ONLY valid JSON.

Citizen submission: "${text}"

Available wards: ${LONDON_WARDS.join(", ")}
Available categories: ${CATEGORIES.join(", ")}

Return JSON with exactly these fields:
{
  "category": "<one of the available categories>",
  "summary": "<1-2 sentence objective summary>",
  "location_name": "<specific location mentioned or inferred>",
  "ward": "<closest matching ward from the list>",
  "sentiment": "<positive|neutral|frustrated|angry|urgent>",
  "urgency": "<low|medium|high|critical>"
}`;

  const response = await chatCompletion(
    [{ role: "user", content: prompt }],
    true
  );

  const parsed = JSON.parse(response) as Partial<ExtractedSubmission>;
  const ward = parsed.ward || "Westminster";
  const coords = WARD_COORDS[ward] || [51.5074, -0.1278];

  return {
    category: parsed.category || "Other",
    summary: parsed.summary || text.slice(0, 150),
    location_name: parsed.location_name || ward,
    ward,
    lat: coords[0],
    lng: coords[1],
    sentiment: parsed.sentiment || "neutral",
    urgency: parsed.urgency || "medium",
  };
}
