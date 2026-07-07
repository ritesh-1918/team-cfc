import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { chatCompletion } from "@/lib/llm";

export async function GET() {
  const db = createServiceClient();
  const { data } = await db
    .from("recommendations")
    .select("*")
    .order("priority_score", { ascending: false })
    .limit(10);

  return NextResponse.json({ recommendations: data || [] });
}

export async function POST(req: NextRequest) {
  const db = createServiceClient();

  // Get top clusters
  const { data: submissions } = await db
    .from("submissions")
    .select("category, ward, urgency, summary");

  if (!submissions || submissions.length === 0) {
    return NextResponse.json({ error: "No submissions yet" }, { status: 400 });
  }

  // Aggregate
  const map: Record<string, { category: string; ward: string; count: number; summaries: string[] }> = {};
  for (const s of submissions) {
    const key = `${s.category}||${s.ward}`;
    if (!map[key]) map[key] = { category: s.category, ward: s.ward, count: 0, summaries: [] };
    map[key].count++;
    if (s.summary) map[key].summaries.push(s.summary);
  }

  const topClusters = Object.values(map)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const prompt = `You are an AI advisor to a UK Member of Parliament.

Based on these citizen feedback clusters, generate ranked development project recommendations.

Feedback clusters:
${topClusters.map((c, i) => `${i + 1}. ${c.category} in ${c.ward}: ${c.count} reports. Examples: ${c.summaries.slice(0, 2).join("; ")}`).join("\n")}

Generate exactly ${topClusters.length} project recommendations. Return ONLY valid JSON array:
[
  {
    "title": "<specific project title>",
    "description": "<2-3 sentence description of the proposed development work>",
    "category": "<category>",
    "ward": "<ward>",
    "priority_score": <number 1-100>,
    "rationale": "<why this is the top priority based on citizen data>",
    "submission_count": <number>,
    "estimated_impact": "<number of residents benefited>"
  }
]

Rank by priority. Be specific and actionable.`;

  const response = await chatCompletion([{ role: "user", content: prompt }], true);

  let parsed: unknown;
  try {
    // Strip markdown code fences if LLM wraps response
    const clean = response.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    return NextResponse.json({ error: "LLM returned invalid JSON" }, { status: 500 });
  }

  // Normalise: LLM may wrap in { recommendations: [...] } or { projects: [...] }
  if (!Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    parsed = obj.recommendations || obj.projects || obj.items || Object.values(obj)[0] || [];
  }

  // Map to only valid DB columns
  const VALID_COLS = ["title","description","category","ward","priority_score","rationale","submission_count","estimated_impact"];
  const rows = (parsed as Record<string, unknown>[]).map((r) => {
    const clean: Record<string, unknown> = {};
    for (const col of VALID_COLS) if (r[col] !== undefined) clean[col] = r[col];
    return clean;
  });

  // Delete only existing rows, then insert fresh
  await db.from("recommendations").delete().gt("priority_score", -1);

  const { data: inserted, error } = await db
    .from("recommendations")
    .insert(rows)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recommendations: inserted });
}
