"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Mic, MicOff, Send, CheckCircle2, Loader2,
  MapPin, LayoutDashboard, Zap, Sparkles, ArrowUpRight,
  Tag, Navigation, Heart, AlertOctagon
} from "lucide-react";

type SubmitState = "idle" | "submitting" | "success" | "error";

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: { length: number; [i: number]: { [i: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type ExtractionResult = {
  category: string;
  summary: string;
  location_name: string;
  ward: string;
  sentiment: string;
  urgency: string;
};

const URGENCY_CONFIG: Record<string, { dot: string; text: string; bg: string; label: string }> = {
  low:      { dot: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/25", label: "Low" },
  medium:   { dot: "bg-amber-400",   text: "text-amber-300",   bg: "bg-amber-500/10 border-amber-500/25",   label: "Medium" },
  high:     { dot: "bg-orange-400",  text: "text-orange-300",  bg: "bg-orange-500/10 border-orange-500/25", label: "High" },
  critical: { dot: "bg-red-400",     text: "text-red-300",     bg: "bg-red-500/10 border-red-500/25",       label: "Critical" },
};

const SAMPLES = [
  "The pothole on Baker Street near the tube station is dangerous. Three cyclists have fallen this week.",
  "Our local park in Hackney has no lighting after 6pm. Elderly residents are afraid to use it.",
  "The GP surgery in Islington has a 3-week wait time. We desperately need extended hours.",
  "Flooding on Lambeth Road every time it rains heavily. Drainage hasn't been maintained for years.",
];

const STEPS = ["Parsing feedback", "Extracting signals", "Storing securely"];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export default function SubmissionPage() {
  const [text, setText] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognitionInstance | null>(null);
  const [totalSubmissions, setTotalSubmissions] = useState<number | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => r.json())
      .then((d) => setTotalSubmissions(d.total ?? null))
      .catch(() => {});
  }, []);

  async function handleSubmit() {
    if (!text.trim()) return;
    setState("submitting");
    setStep(0);
    setError("");

    // Advance steps visually
    const t1 = setTimeout(() => setStep(1), 900);
    const t2 = setTimeout(() => setStep(2), 2000);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      clearTimeout(t1); clearTimeout(t2);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.extracted);
      setState("success");
      setTotalSubmissions((n) => (n !== null ? n + 1 : null));
    } catch (err: unknown) {
      clearTimeout(t1); clearTimeout(t2);
      setError(err instanceof Error ? err.message : "Submission failed");
      setState("error");
    }
  }

  function toggleRecording() {
    if (isRecording) {
      recognition?.stop();
      setIsRecording(false);
      return;
    }
    type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;
    const w = typeof window !== "undefined" ? (window as unknown as Record<string, unknown>) : null;
    const SpeechRecognitionAPI: SpeechRecognitionCtor | null =
      (w?.SpeechRecognition as SpeechRecognitionCtor) ||
      (w?.webkitSpeechRecognition as SpeechRecognitionCtor) ||
      null;
    if (!SpeechRecognitionAPI) { setError("Voice input requires Chrome."); return; }
    const rec = new SpeechRecognitionAPI();
    rec.lang = "en-GB";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let t = "";
      for (let i = 0; i < event.results.length; i++) t += event.results[i][0].transcript;
      setText(t);
    };
    rec.onerror = () => { setError("Microphone error."); setIsRecording(false); };
    rec.onend = () => setIsRecording(false);
    rec.start();
    setRecognition(rec);
    setIsRecording(true);
  }

  function reset() { setText(""); setState("idle"); setResult(null); setError(""); }

  return (
    <div className="relative min-h-screen bg-[#08080c] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[30%] left-[10%] w-[650px] h-[650px] rounded-full bg-[#1d6bf3]/10 blur-[130px]" />
        <div className="absolute -top-[10%] right-[5%] w-[500px] h-[500px] rounded-full bg-[#7c3aed]/8 blur-[110px]" />
        <div className="absolute bottom-[10%] left-[30%] w-[400px] h-[400px] rounded-full bg-[#1d6bf3]/5 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-white/[0.05] bg-[#08080c]/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1d6bf3] to-[#7c3aed] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-zinc-100 tracking-tight group-hover:text-white transition-colors">CivicPulse</span>
          </Link>
          <div className="flex items-center gap-5">
            {totalSubmissions !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 text-xs text-zinc-500"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                <span>{totalSubmissions.toLocaleString()} voices heard</span>
              </motion.div>
            )}
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-100 transition-colors duration-200 group"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">MP Dashboard</span>
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-xl mx-auto px-6 pt-16 pb-16">
        {/* Hero text */}
        <motion.div initial="hidden" animate="show" variants={stagger} className="text-center mb-10">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] text-xs text-zinc-500">
              <Sparkles className="w-3 h-3 text-[#1d6bf3]" />
              AI-powered civic feedback
            </div>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-5xl sm:text-[3.5rem] font-bold tracking-tight mb-4 leading-[1.08]">
            <span className="text-zinc-100">Tell your MP</span>
            <br />
            <span className="bg-gradient-to-r from-[#3d82f7] via-[#6ea3ff] to-[#a78bfa] bg-clip-text text-transparent">
              what matters.
            </span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-zinc-500 text-base leading-relaxed max-w-sm mx-auto">
            Describe any issue in your area. AI extracts the key details and surfaces recurring patterns to your representative.
          </motion.p>
        </motion.div>

        <AnimatePresence mode="wait">
          {state === "success" && result ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <SuccessCard result={result} onReset={reset} />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm shadow-2xl shadow-black/50 overflow-hidden">
                {/* Text area */}
                <div className="p-5 pb-3">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
                    placeholder="Describe the issue in your area… e.g. 'The road on High Street has potholes that damaged my car and are dangerous for cyclists.'"
                    className="w-full bg-transparent border-0 text-zinc-100 placeholder-zinc-700 resize-none focus:outline-none text-[15px] leading-[1.6] min-h-[110px]"
                  />
                </div>

                {/* Divider */}
                <div className="h-px bg-white/[0.05]" />

                {/* Footer toolbar */}
                <div className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={toggleRecording}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                        isRecording
                          ? "bg-red-500/12 border-red-500/25 text-red-400"
                          : "bg-white/[0.04] border-white/[0.07] text-zinc-500 hover:text-zinc-200 hover:border-white/[0.12]"
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400" />
                          </span>
                          <MicOff className="w-3.5 h-3.5" />
                          Stop
                        </>
                      ) : (
                        <><Mic className="w-3.5 h-3.5" />Voice</>
                      )}
                    </motion.button>
                    {text.length > 0 && (
                      <span className="text-xs text-zinc-700 tabular-nums">{text.length}</span>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={!text.trim() || state === "submitting"}
                    className="flex items-center gap-2 bg-[#1d6bf3] hover:bg-[#2b78ff] disabled:opacity-35 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-xl transition-all duration-200 shadow-lg shadow-[#1d6bf3]/30"
                  >
                    {state === "submitting" ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analysing…</>
                    ) : (
                      <><Send className="w-3.5 h-3.5" />Submit</>
                    )}
                  </motion.button>
                </div>

                {/* Multi-step loading progress */}
                <AnimatePresence>
                  {state === "submitting" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-white/[0.05] overflow-hidden"
                    >
                      <div className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          {STEPS.map((label, i) => (
                            <div key={i} className="flex items-center gap-1.5 flex-1">
                              <div className="relative flex-shrink-0">
                                {i < step ? (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center"
                                  >
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                  </motion.div>
                                ) : i === step ? (
                                  <div className="w-4 h-4 rounded-full border border-[#1d6bf3]/60 border-t-[#1d6bf3] animate-spin" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-white/[0.1]" />
                                )}
                              </div>
                              <span className={`text-[11px] truncate transition-colors ${
                                i === step ? "text-zinc-300" : i < step ? "text-zinc-600" : "text-zinc-800"
                              }`}>{label}</span>
                              {i < STEPS.length - 1 && (
                                <div className="flex-1 h-px bg-white/[0.06] mx-1" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-red-500/15 overflow-hidden"
                    >
                      <p className="text-red-400 text-xs px-5 py-3 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />{error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sample prompts */}
              <div className="mt-5">
                <p className="text-[11px] text-zinc-700 text-center mb-3 uppercase tracking-widest">Try a sample</p>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLES.map((s, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.01, borderColor: "rgba(255,255,255,0.10)" }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setText(s)}
                      className="text-left text-[12px] text-zinc-600 hover:text-zinc-300 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.10] rounded-xl px-3.5 py-3 transition-all duration-200 line-clamp-2 leading-relaxed"
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SuccessCard({ result, onReset }: { result: ExtractionResult; onReset: () => void }) {
  const urgency = URGENCY_CONFIG[result.urgency] || URGENCY_CONFIG.medium;

  const fields = [
    { label: "Category",      value: result.category,      icon: Tag,           accent: false },
    { label: "Ward",          value: result.ward,           icon: Navigation,    accent: false },
    { label: "Sentiment",     value: result.sentiment,      icon: Heart,         accent: false },
    { label: "Urgency",       value: urgency.label,         icon: AlertOctagon,  accent: true  },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm shadow-2xl shadow-black/50 overflow-hidden">
      {/* Success header */}
      <div className="px-6 pt-6 pb-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.1 }}
            className="w-11 h-11 rounded-2xl bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center shrink-0"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </motion.div>
          <div>
            <motion.p
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="text-sm font-semibold text-zinc-100"
            >
              Feedback received
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-xs text-zinc-600 mt-0.5"
            >
              AI extracted and stored your issue
            </motion.p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* AI Summary — prominent */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-[#1d6bf3]/20 bg-[#1d6bf3]/5 px-4 py-3.5"
        >
          <p className="text-[10px] uppercase tracking-widest text-[#1d6bf3]/60 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> AI Summary
          </p>
          <p className="text-sm text-zinc-200 leading-[1.65]">{result.summary}</p>
        </motion.div>

        {/* 4 field chips */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-2"
        >
          {fields.map((f) => (
            <motion.div
              key={f.label}
              variants={fadeUp}
              className={`rounded-xl px-3.5 py-3 border transition-colors ${
                f.accent ? urgency.bg : "bg-white/[0.03] border-white/[0.07]"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <f.icon className={`w-3 h-3 ${f.accent ? urgency.text : "text-zinc-700"}`} />
                <p className="text-[10px] uppercase tracking-widest text-zinc-700">{f.label}</p>
              </div>
              <p className={`text-sm font-semibold capitalize leading-tight ${f.accent ? urgency.text : "text-zinc-200"}`}>
                {f.value}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Location */}
        {result.location_name && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="flex items-center gap-2 text-xs text-zinc-600"
          >
            <MapPin className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
            <span>{result.location_name}</span>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-2.5 pt-1"
        >
          <button
            onClick={onReset}
            className="flex-1 text-sm py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] hover:border-white/[0.12] text-zinc-400 hover:text-zinc-200 transition-all duration-200"
          >
            Submit another
          </button>
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 text-sm py-2.5 rounded-xl bg-[#1d6bf3] hover:bg-[#2b78ff] text-white font-medium transition-all duration-200 shadow-lg shadow-[#1d6bf3]/25"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
