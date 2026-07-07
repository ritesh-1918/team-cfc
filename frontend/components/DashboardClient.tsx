"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Zap, ArrowLeft, RefreshCw, Sparkles, TrendingUp,
  MapPin, Users, AlertTriangle, CheckCircle, Clock,
  ChevronRight, BarChart3, ArrowUpRight
} from "lucide-react";

const HotspotMap = dynamic(() => import("./HotspotMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-[#1d6bf3]/40 border-t-[#1d6bf3] animate-spin" />
      <span className="text-xs text-zinc-600">Loading map…</span>
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
  "Roads & Transport":   "#1d6bf3",
  "Parks & Green Spaces":"#10b981",
  "Housing":             "#f59e0b",
  "Healthcare":          "#ef4444",
  "Education":           "#3b82f6",
  "Utilities":           "#8b5cf6",
  "Safety & Crime":      "#ec4899",
  "Environment":         "#00d4aa",
};

const URGENCY_STYLES: Record<string, string> = {
  critical: "bg-red-400/15 text-red-400 border-red-400/25",
  high:     "bg-orange-400/15 text-orange-400 border-orange-400/25",
  medium:   "bg-amber-400/15 text-amber-400 border-amber-400/25",
  low:      "bg-emerald-400/15 text-emerald-400 border-emerald-400/25",
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

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

  const stats = [
    { label: "Submissions",    value: insights?.total ?? 0,                    icon: Users,         color: "#1d6bf3" },
    { label: "Issue Clusters", value: insights?.clusters.length ?? 0,           icon: AlertTriangle, color: "#f59e0b" },
    { label: "Wards Affected", value: insights?.wardHotspots.length ?? 0,       icon: MapPin,        color: "#00d4aa" },
    { label: "Recommendations",value: recommendations.length,                   icon: CheckCircle,   color: "#7c3aed" },
  ];

  return (
    <div className="min-h-screen bg-[#08080c]">
      {/* Ambient top glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#1d6bf3]/[0.07] blur-[100px] rounded-full" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#08080c]/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-300 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#1d6bf3] to-[#7c3aed] flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="font-semibold text-zinc-100 tracking-tight text-sm">CivicPulse</span>
              <span className="text-zinc-700 text-sm">/</span>
              <span className="text-zinc-500 text-sm">MP Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-600 hidden sm:block">
              {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refresh}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-500 hover:text-zinc-300 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </motion.button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Intelligence Overview</h1>
          <p className="text-sm text-zinc-600 mt-1">Live citizen feedback analysis for development prioritisation</p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
        >
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </motion.div>

        {/* Hotspot map */}
        <AnimatePresence>
          {insights && insights.wardHotspots.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6"
            >
              <SectionHeader
                title="Demand Hotspot Map"
                subtitle="Issue density by ward — circle size reflects volume"
                badge={`${insights.wardHotspots.length} active wards`}
                icon={<MapPin className="w-4 h-4 text-[#1d6bf3]" />}
              />
              <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
                <HotspotMap hotspots={insights.wardHotspots} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: clusters + submissions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Clusters */}
            <Panel>
              <SectionHeader
                title="Priority Issue Clusters"
                subtitle="Grouped by category and ward"
                icon={<TrendingUp className="w-4 h-4 text-zinc-500" />}
              />
              {!insights?.clusters.length ? (
                <EmptyState
                  icon={<BarChart3 className="w-6 h-6" />}
                  title="No clusters yet"
                  message="Submit citizen feedback to see issue clusters appear here."
                />
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-0">
                  {insights.clusters.slice(0, 7).map((c, i) => (
                    <ClusterRow key={i} cluster={c} rank={i + 1} />
                  ))}
                </motion.div>
              )}
            </Panel>

            {/* Recent submissions */}
            <Panel>
              <SectionHeader
                title="Recent Submissions"
                subtitle="Latest citizen feedback"
                icon={<Clock className="w-4 h-4 text-zinc-500" />}
              />
              {!submissions.length ? (
                <EmptyState
                  icon={<Users className="w-6 h-6" />}
                  title="No submissions yet"
                  message="Citizens haven't submitted any feedback yet."
                />
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-0">
                  {submissions.slice(0, 6).map((s) => (
                    <SubmissionRow key={s.id} submission={s} />
                  ))}
                </motion.div>
              )}
            </Panel>
          </div>

          {/* Right: recommendations + categories */}
          <div className="space-y-6">
            {/* Recommendations */}
            <Panel>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">MP Recommendations</h2>
                  <p className="text-xs text-zinc-600 mt-0.5">AI-ranked development projects</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={generateRecommendations}
                  disabled={genLoading || (insights?.total ?? 0) === 0}
                  className="flex items-center gap-1.5 text-xs bg-[#1d6bf3] hover:bg-[#2b78ff] disabled:opacity-40 text-white px-3 py-1.5 rounded-lg transition-all shadow-md shadow-[#1d6bf3]/25"
                >
                  {genLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Generate
                </motion.button>
              </div>
              {!recommendations.length ? (
                <EmptyState
                  icon={<Sparkles className="w-6 h-6" />}
                  title="No recommendations"
                  message="Click Generate to create AI-ranked development priorities."
                />
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
                  {recommendations.map((r, i) => (
                    <RecommendationCard key={r.id} rec={r} rank={i + 1} />
                  ))}
                </motion.div>
              )}
            </Panel>

            {/* Category breakdown */}
            <Panel>
              <SectionHeader
                title="Category Breakdown"
                subtitle="Issues by type"
                icon={<BarChart3 className="w-4 h-4 text-zinc-500" />}
              />
              {!insights?.categoryBreakdown.length ? (
                <EmptyState
                  icon={<BarChart3 className="w-6 h-6" />}
                  title="No data"
                  message="Category data appears after submissions."
                />
              ) : (
                <div className="space-y-3">
                  {insights.categoryBreakdown.map((c) => (
                    <CategoryBar key={c.name} name={c.name} value={c.value} total={insights.total} />
                  ))}
                </div>
              )}
            </Panel>

            {/* Ward hotspots list */}
            {insights?.wardHotspots && insights.wardHotspots.length > 0 && (
              <Panel>
                <SectionHeader
                  title="Top Wards"
                  subtitle="Most reported areas"
                  icon={<MapPin className="w-4 h-4 text-zinc-500" />}
                />
                <div className="space-y-0">
                  {insights.wardHotspots
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 6)
                    .map((w, i) => (
                      <WardRow key={w.ward} ward={w} rank={i + 1} total={insights.total} />
                    ))}
                </div>
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────── */

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({
  title, subtitle, badge, icon,
}: { title: string; subtitle: string; badge?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-start gap-2.5">
        {icon && <div className="mt-0.5">{icon}</div>}
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
          <p className="text-xs text-zinc-600 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {badge && (
        <span className="text-xs text-zinc-600 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.1)" }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 cursor-default transition-colors duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-800" />
      </div>
      <p className="text-3xl font-bold text-zinc-100 tabular-nums tracking-tight">{value.toLocaleString()}</p>
      <p className="text-xs text-zinc-600 mt-1">{label}</p>
    </motion.div>
  );
}

function ClusterRow({ cluster, rank }: { cluster: Cluster; rank: number }) {
  const color = CATEGORY_COLORS[cluster.category] || "#1d6bf3";
  const maxScore = 10;
  const pct = Math.min(100, (cluster.priority_score / maxScore) * 100);
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.025)" }}
      className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0 rounded-lg px-1 -mx-1 transition-colors duration-150 cursor-default"
    >
      <span className="text-xs font-mono text-zinc-700 w-5 text-right shrink-0">{rank}</span>
      <div className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: color, opacity: 0.8 }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 truncate font-medium">{cluster.theme}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-1 flex-1 max-w-[80px] bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
          </div>
          <span className="text-xs text-zinc-600">{cluster.priority_score.toFixed(1)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-xs text-zinc-500 flex items-center gap-1">
          <Users className="w-3 h-3" />{cluster.count}
        </span>
      </div>
    </motion.div>
  );
}

function SubmissionRow({ submission }: { submission: Submission }) {
  const style = URGENCY_STYLES[submission.urgency] || URGENCY_STYLES.medium;
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.025)" }}
      className="flex items-start gap-3 py-3 border-b border-white/[0.04] last:border-0 rounded-lg px-1 -mx-1 transition-colors duration-150 cursor-default"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300 truncate leading-snug">
          {submission.summary || submission.raw_text}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-zinc-600 flex items-center gap-1">
            <MapPin className="w-3 h-3" />{submission.ward}
          </span>
          <span className="text-zinc-800 text-xs">·</span>
          <span className="text-xs text-zinc-600">{submission.category}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${style}`}>
          {submission.urgency}
        </span>
        <span className="text-[10px] text-zinc-700">
          {new Date(submission.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </motion.div>
  );
}

function RecommendationCard({ rec, rank }: { rec: Recommendation; rank: number }) {
  const color = CATEGORY_COLORS[rec.category] || "#1d6bf3";
  const score = Math.min(100, Math.round(rec.priority_score));
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.025)" }}
      className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 transition-all duration-200 cursor-default"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-zinc-700">#{rank}</span>
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1 w-14 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
          </div>
          <span className="text-xs font-semibold text-zinc-400 tabular-nums">{score}</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-zinc-100 mb-1 leading-snug">{rec.title}</p>
      <p className="text-xs text-zinc-600 mb-3 line-clamp-2 leading-relaxed">{rec.description}</p>
      <div className="flex items-center gap-2 text-xs text-zinc-600 mb-2">
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{rec.ward}</span>
        <span>·</span>
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{rec.submission_count} reports</span>
      </div>
      {rec.estimated_impact && (
        <div className="bg-[#00d4aa]/8 border border-[#00d4aa]/20 rounded-lg px-2.5 py-1.5 mb-2">
          <p className="text-xs text-[#00d4aa] flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3 shrink-0" />
            {rec.estimated_impact}
          </p>
        </div>
      )}
      {rec.rationale && (
        <p className="text-xs text-[#1d6bf3]/80 flex items-start gap-1 border-t border-white/[0.04] pt-2 leading-relaxed">
          <ChevronRight className="w-3 h-3 shrink-0 mt-0.5" />
          {rec.rationale}
        </p>
      )}
    </motion.div>
  );
}

function CategoryBar({ name, value, total }: { name: string; value: number; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const color = CATEGORY_COLORS[name] || "#1d6bf3";
  return (
    <div className="group cursor-default">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors truncate mr-2">{name}</span>
        <span className="text-xs font-semibold text-zinc-600 tabular-nums shrink-0">{value}</span>
      </div>
      <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function WardRow({ ward, rank, total }: { ward: { ward: string; count: number }; rank: number; total: number }) {
  const pct = total > 0 ? (ward.count / total) * 100 : 0;
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.025)" }}
      className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0 rounded-lg px-1 -mx-1 transition-colors duration-150 cursor-default"
    >
      <span className="text-xs font-mono text-zinc-700 w-4 text-right shrink-0">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-zinc-400 truncate">{ward.ward}</span>
          <span className="text-xs text-zinc-600 tabular-nums shrink-0 ml-2">{ward.count}</span>
        </div>
        <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: rank * 0.04 }}
            className="h-full bg-[#1d6bf3] rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-700 mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-zinc-500 mb-1">{title}</p>
      <p className="text-xs text-zinc-700 max-w-[200px] leading-relaxed">{message}</p>
    </div>
  );
}
