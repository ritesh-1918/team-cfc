import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  const db = createServiceClient();

  // Live clusters from submissions
  const { data: submissions } = await db
    .from("submissions")
    .select("category, ward, urgency, lat, lng");

  if (!submissions) return NextResponse.json({ clusters: [] });

  // Aggregate by category + ward
  const map: Record<
    string,
    { category: string; ward: string; count: number; highUrgency: number; lat: number; lng: number }
  > = {};

  for (const s of submissions) {
    const key = `${s.category}||${s.ward}`;
    if (!map[key]) {
      map[key] = { category: s.category, ward: s.ward, count: 0, highUrgency: 0, lat: s.lat, lng: s.lng };
    }
    map[key].count++;
    if (s.urgency === "high" || s.urgency === "critical") map[key].highUrgency++;
  }

  const clusters = Object.values(map)
    .map((c) => ({
      ...c,
      priority_score: c.count + c.highUrgency * 0.5,
      theme: `${c.category} in ${c.ward}`,
    }))
    .sort((a, b) => b.priority_score - a.priority_score);

  // Category totals
  const categoryMap: Record<string, number> = {};
  for (const s of submissions) {
    categoryMap[s.category] = (categoryMap[s.category] || 0) + 1;
  }
  const categoryBreakdown = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Ward hotspots
  const wardMap: Record<string, { count: number; lat: number; lng: number }> = {};
  for (const s of submissions) {
    if (!wardMap[s.ward]) wardMap[s.ward] = { count: 0, lat: s.lat, lng: s.lng };
    wardMap[s.ward].count++;
  }
  const wardHotspots = Object.entries(wardMap).map(([ward, v]) => ({
    ward,
    count: v.count,
    lat: v.lat,
    lng: v.lng,
  }));

  return NextResponse.json({
    clusters: clusters.slice(0, 10),
    categoryBreakdown,
    wardHotspots,
    total: submissions.length,
  });
}
