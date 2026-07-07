"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Zap, ArrowLeft, RefreshCw, Sparkles, TrendingUp,
  MapPin, Users, AlertTriangle, CheckCircle, Clock,
  ChevronRight
} from "lucide-react";

const HotspotMap = dynamic(() => import("./HotspotMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[340px] rounded-xl bg-zinc-800/50 flex items-center justify-center">
      <span className="text-xs text-zinc-500">Loading map…</span>
    </div>
  ),
});

type Submission = {
  id: string; raw_text: string; category: string; ward: string;
  sentiment: string; urgency: string; summary: string; created_at: string;
};
type Cluster = {
  theme: string; category: string; ward: string;
  count: number; priority_score: number; lat: number; lng: number;
};
type Recommendation = {
  id: string; title: string; description: string; category: string;
  ward: string; priority_score: number; rationale: string;
  submission_count: number; estimated_impact: string;
};
type Insight = {
  clusters: Cluster[];
  categoryBreakdown: { name: string; value: number }[];
  wardHotspots: { ward: string; count: number; lat: number; lng: number }[];
  total: number;
};

const CATEGORY_COLORS: Record<string, string> = {
  "Roads & Transport": "#6366f1",
  "Parks & Green Spaces": "#22c55e",
  "Housing": "#f59e0b",
  "Healthcare": "#ef4444",
  "Education": "#3b82f6",
  "Utilities": "#8b5cf6",
  "Safety & Crime": "#ec4899",
  "Environment": "#10b981",
};

const URGENCY_BADGE: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  low: "bg-green-500/20 text-green-400 border border-green-500/30",
};

export default function DashboardClient() {
  const [insights, setInsights] = useState<Insight | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = useCallback(async () => {
    setLoading(true);
    const [ins, subs, recs] = await Promise.all([
      fetch("/api/insights").then((r) => r.json()),
      fetch("/api/submissions").then((r) => r.json()),
      fetch("/api/recommendations").then((r) => r.json()),
    ]);
    setInsights(ins);
    setSubmissions(subs.submissions || []);
    setRecommendations(recs.recommendations || []);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function generateRecommendations() {
    setGenLoading(true);
    await fetch("/api/recommendations", { method: "POST" });
    await refresh();
    setGenLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 sticky top-0 bg-zinc-950/80 backdrop-blur z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              <span className="font-semibold text-zinc-100">CivicPulse</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400 text-sm">MP Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">
              Refreshed {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              onClick={refresh}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Submissions" value={insights?.total ?? 0} icon={<Users className="w-4 h-4" />} color="indigo" />
          <StatCard label="Active Issues" value={insights?.clusters.length ?? 0} icon={<AlertTriangle className="w-4 h-4" />} color="amber" />
          <StatCard label="Wards Affected" value={insights?.wardHotspots.length ?? 0} icon={<MapPin className="w-4 h-4" />} color="emerald" />
          <StatCard label="Recommendations" value={recommendations.length} icon={<CheckCircle className="w-4 h-4" />} color="purple" />
        </div>

        {/* Demand hotspot map */}
        {insights && insights.wardHotspots.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  Demand Hotspot Map
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Circle size = issue volume · Colour: red = critical, amber = moderate, indigo = low
                </p>
              </div>
              <span className="text-xs text-zinc-500">{insights.wardHotspots.length} wards active</span>
            </div>
            <HotspotMap hotspots={insights.wardHotspots} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top clusters */}
            <Section title="Priority Issue Clusters" subtitle="Grouped by category and ward">
              {insights?.clusters.length === 0 ? (
                <EmptyState message="No submissions yet. Submit one to see clusters." />
              ) : (
                <div className="space-y-2">
                  {insights?.clusters.slice(0, 6).map((c, i) => (
                    <ClusterRow key={i} cluster={c} rank={i + 1} />
                  ))}
                </div>
              )}
            </Section>

            {/* Recent submissions */}
            <Section title="Recent Submissions" subtitle="Latest citizen feedback">
              {submissions.length === 0 ? (
                <EmptyState message="No submissions yet." />
              ) : (
                <div className="space-y-2">
                  {submissions.slice(0, 6).map((s) => (
                    <SubmissionRow key={s.id} submission={s} />
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Recommendations */}
            <Section
              title="MP Recommendations"
              subtitle="AI-ranked development projects"
              action={
                <button
                  onClick={generateRecommendations}
                  disabled={genLoading || (insights?.total ?? 0) === 0}
                  className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-all"
                >
                  {genLoading ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Generate
                </button>
              }
            >
              {recommendations.length === 0 ? (
                <EmptyState message="Click Generate to create AI recommendations." />
              ) : (
                <div className="space-y-3">
                  {recommendations.map((r, i) => (
                    <RecommendationCard key={r.id} rec={r} rank={i + 1} />
                  ))}
                </div>
              )}
            </Section>

            {/* Category breakdown */}
            <Section title="Category Breakdown" subtitle="Issues by type">
              {!insights?.categoryBreakdown.length ? (
                <EmptyState message="No data yet." />
              ) : (
                <div className="space-y-2">
                  {insights.categoryBreakdown.map((c) => (
                    <CategoryBar key={c.name} name={c.name} value={c.value} total={insights.total} />
                  ))}
                </div>
              )}
            </Section>

            {/* Ward hotspots */}
            <Section title="Ward Hotspots" subtitle="Most reported areas">
              {!insights?.wardHotspots.length ? (
                <EmptyState message="No data yet." />
              ) : (
                <div className="space-y-1.5">
                  {insights.wardHotspots
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 6)
                    .map((w, i) => (
                      <div key={w.ward} className="flex items-center gap-2 py-1.5">
                        <span className="text-xs text-zinc-600 w-4 text-right">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-zinc-300 truncate">{w.ward}</span>
                            <span className="text-xs text-zinc-500">{w.count}</span>
                          </div>
                          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${(w.count / (insights.total || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    indigo: "text-indigo-400 bg-indigo-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    purple: "text-purple-400 bg-purple-500/10",
  };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className={`w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-zinc-100 mb-0.5">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function Section({
  title, subtitle, children, action,
}: {
  title: string; subtitle: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function ClusterRow({ cluster, rank }: { cluster: Cluster; rank: number }) {
  const color = CATEGORY_COLORS[cluster.category] || "#6366f1";
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-zinc-800 last:border-0">
      <span className="text-xs text-zinc-600 w-4 shrink-0 text-right">{rank}</span>
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 truncate">{cluster.theme}</p>
        <p className="text-xs text-zinc-500">{cluster.category}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-zinc-400 flex items-center gap-1">
          <Users className="w-3 h-3" /> {cluster.count}
        </span>
        <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {cluster.priority_score.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function SubmissionRow({ submission }: { submission: Submission }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-zinc-800 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300 truncate">{submission.summary || submission.raw_text}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-zinc-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {submission.ward}
          </span>
          <span className="text-xs text-zinc-500">·</span>
          <span className="text-xs text-zinc-500">{submission.category}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full ${URGENCY_BADGE[submission.urgency] || URGENCY_BADGE.medium}`}>
          {submission.urgency}
        </span>
        <span className="text-xs text-zinc-600 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(submission.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

function RecommendationCard({ rec, rank }: { rec: Recommendation; rank: number }) {
  const color = CATEGORY_COLORS[rec.category] || "#6366f1";
  const score = Math.min(100, Math.round(rec.priority_score));
  return (
    <div className="border border-zinc-700/50 rounded-xl p-4 hover:border-zinc-600 transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-500">#{rank}</span>
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-16 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${score}%` }} />
          </div>
          <span className="text-xs text-zinc-400">{score}</span>
        </div>
      </div>
      <p className="text-sm font-medium text-zinc-200 mb-1">{rec.title}</p>
      <p className="text-xs text-zinc-500 mb-2 line-clamp-2">{rec.description}</p>
      <div className="flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{rec.ward}</span>
        <span>·</span>
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{rec.submission_count} reports</span>
      </div>
      {rec.estimated_impact && (
        <div className="mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1.5">
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 shrink-0" />
            {rec.estimated_impact}
          </p>
        </div>
      )}
      {rec.rationale && (
        <p className="text-xs text-indigo-400 mt-2 border-t border-zinc-800 pt-2 flex items-start gap-1">
          <ChevronRight className="w-3 h-3 shrink-0 mt-0.5" />
          {rec.rationale}
        </p>
      )}
    </div>
  );
}

function CategoryBar({ name, value, total }: { name: string; value: number; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const color = CATEGORY_COLORS[name] || "#6366f1";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-zinc-400 truncate mr-2">{name}</span>
        <span className="text-xs text-zinc-500 shrink-0">{value}</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-xs text-zinc-600 text-center py-4">{message}</p>
  );
}
