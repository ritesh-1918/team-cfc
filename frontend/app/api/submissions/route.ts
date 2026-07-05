import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { extractSubmission } from "@/lib/extract";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    const extracted = await extractSubmission(text);
    const db = createServiceClient();

    const { data, error } = await db
      .from("submissions")
      .insert({
        raw_text: text,
        category: extracted.category,
        summary: extracted.summary,
        location_name: extracted.location_name,
        ward: extracted.ward,
        lat: extracted.lat,
        lng: extracted.lng,
        sentiment: extracted.sentiment,
        urgency: extracted.urgency,
        structured_data: extracted,
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger async cluster + recommendation refresh (fire and forget)
    refreshInsights(db).catch(console.error);

    return NextResponse.json({ submission: data, extracted });
  } catch (err: unknown) {
    console.error("submission error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const db = createServiceClient();
  const { data, error } = await db
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ submissions: data });
}

async function refreshInsights(db: ReturnType<typeof createServiceClient>) {
  // Recompute clusters: group by category + ward
  const { data: groups } = await db.from("submissions").select("category, ward");
  if (!groups) return;

  const counts: Record<string, { category: string; ward: string; count: number }> = {};
  for (const row of groups) {
    const key = `${row.category}||${row.ward}`;
    if (!counts[key]) counts[key] = { category: row.category, ward: row.ward, count: 0 };
    counts[key].count++;
  }

  for (const item of Object.values(counts)) {
    const urgencyMultiplier = 1.0;
    const priorityScore = item.count * urgencyMultiplier;

    await db.from("clusters").upsert(
      {
        theme: `${item.category} in ${item.ward}`,
        category: item.category,
        ward: item.ward,
        count: item.count,
        priority_score: priorityScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "theme" }
    );
  }
}
