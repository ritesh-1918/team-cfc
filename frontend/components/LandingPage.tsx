"use client";

import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, Mic, MapPin, Zap, Users, TrendingUp } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const STATS = [
  { value: "9", label: "Wards Covered", icon: MapPin },
  { value: "AI", label: "Powered Analysis", icon: Zap },
  { value: "Real-time", label: "Issue Tracking", icon: TrendingUp },
  { value: "Voice", label: "Input Support", icon: Mic },
];

const FEATURES = [
  {
    icon: Mic,
    title: "Voice & Text Input",
    desc: "Citizens report issues by speaking or typing. AI extracts category, location, and urgency automatically.",
  },
  {
    icon: MapPin,
    title: "Ward Hotspot Map",
    desc: "Live geographic clustering reveals where problems concentrate across all 9 wards.",
  },
  {
    icon: BarChart3,
    title: "AI Recommendations",
    desc: "Llama-3.1 prioritises development projects by community impact, cost efficiency, and urgency.",
  },
  {
    icon: Users,
    title: "MP Dashboard",
    desc: "Real-time insights let representatives act on constituents' most pressing needs.",
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[30%] right-[-15%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-indigo-600/8 blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-semibold text-white tracking-tight">CivicPulse</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-white/50 hover:text-white/80 transition-colors px-4 py-2"
          >
            Dashboard
          </button>
          <button
            onClick={() => router.push("/submit")}
            className="text-sm bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/80 hover:text-white rounded-lg px-4 py-2 transition-all"
          >
            Submit Issue
          </button>
        </div>
      </nav>

      {/* Hero */}
      <motion.section
        className="relative z-10 max-w-6xl mx-auto px-8 pt-20 pb-28 text-center"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          AI-powered civic engagement platform
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
        >
          <span className="text-white">Citizens speak.</span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Government listens.
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="text-lg text-white/40 max-w-xl mx-auto mb-10 leading-relaxed"
        >
          AI extracts issues from citizen feedback, maps hotspots across wards, and delivers ranked development recommendations to MPs.
        </motion.p>

        <motion.div variants={fadeUp} className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => router.push("/submit")}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 rounded-xl text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30"
          >
            Report an Issue
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 px-6 py-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-xl text-white/70 hover:text-white font-medium text-sm transition-all"
          >
            <BarChart3 size={15} />
            View Dashboard
          </button>
        </motion.div>
      </motion.section>

      {/* Stats */}
      <motion.section
        className="relative z-10 max-w-6xl mx-auto px-8 pb-20"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-center hover:bg-white/[0.05] transition-colors"
            >
              <s.icon size={18} className="text-blue-400/70 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-xs text-white/35">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features */}
      <motion.section
        className="relative z-10 max-w-6xl mx-auto px-8 pb-28"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.div variants={fadeUp} className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">End-to-end civic intelligence</h2>
          <p className="text-white/40 text-sm max-w-md mx-auto">From voice report to MP action plan — powered by large language models.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              className="group bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-white/[0.06] flex items-center justify-center mb-4 group-hover:border-blue-500/30 transition-colors">
                <f.icon size={16} className="text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2 text-sm">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        className="relative z-10 max-w-6xl mx-auto px-8 pb-28"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        viewport={{ once: true }}
      >
        <div className="relative rounded-3xl bg-gradient-to-br from-blue-600/10 to-violet-600/10 border border-white/[0.07] p-12 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-3">Have an issue to report?</h2>
            <p className="text-white/40 text-sm mb-8 max-w-sm mx-auto">Speak or type your concern. AI does the rest — extraction, categorisation, prioritisation.</p>
            <button
              onClick={() => router.push("/submit")}
              className="group inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 rounded-xl text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/20"
            >
              Start Reporting
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] px-8 py-6 max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Zap size={10} className="text-white" />
          </div>
          <span className="text-white/30 text-xs">CivicPulse</span>
        </div>
        <span className="text-white/20 text-xs">
          <a href="https://civicpulse1918.vercel.app" className="hover:text-white/40 transition-colors">civicpulse1918.vercel.app</a>
        </span>
      </footer>
    </div>
  );
}
