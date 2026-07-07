"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Mic, MicOff, Send, CheckCircle2, Loader2,
  MapPin, LayoutDashboard, Zap, Activity,
  ArrowUpRight, Sparkles
} from "lucide-react";

type SubmitState = "idle" | "submitting" | "success" | "error";

// Browser Speech Recognition — type locally to avoid build-env DOM lib gaps
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

const URGENCY_STYLES: Record<string, { dot: string; text: string; bg: string }> = {
  low:      { dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  medium:   { dot: "bg-amber-400",   text: "text-amber-400",   bg: "bg-amber-400/10 border-amber-400/20" },
  high:     { dot: "bg-orange-400",  text: "text-orange-400",  bg: "bg-orange-400/10 border-orange-400/20" },
  critical: { dot: "bg-red-400",     text: "text-red-400",     bg: "bg-red-400/10 border-red-400/20" },
};

const SAMPLES = [
  "The pothole on Baker Street near the tube station is dangerous. Three cyclists have fallen this week.",
  "Our local park in Hackney has no lighting after 6pm. Elderly residents are afraid to use it.",
  "The GP surgery in Islington has a 3-week wait time. We desperately need extended hours.",
  "Flooding on Lambeth Road every time it rains heavily. Drainage hasn't been maintained for years.",
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function SubmissionPage() {
  const [text, setText] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognitionInstance | null>(null);
  const [totalSubmissions, setTotalSubmissions] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => r.json())
      .then((d) => setTotalSubmissions(d.total ?? null))
      .catch(() => {});
  }, []);

  async function handleSubmit() {
    if (!text.trim()) return;
    setState("submitting");
    setError("");
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.extracted);
      setState("success");
      setTotalSubmissions((n) => (n !== null ? n + 1 : null));
    } catch (err: unknown) {
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
    if (!SpeechRecognitionAPI) {
      setError("Voice input requires Chrome.");
      return;
    }
    const rec = new SpeechRecognitionAPI();
    rec.lang = "en-GB";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      setText(transcript);
    };
    rec.onerror = () => { setError("Microphone error."); setIsRecording(false); };
    rec.onend = () => setIsRecording(false);
    rec.start();
    setRecognition(rec);
    setIsRecording(true);
  }

  function reset() {
    setText(""); setState("idle"); setResult(null); setError("");
  }

  return (
    <div className="relative min-h-screen bg-[#08080c] overflow-hidden">
      {/* Ambient gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[30%] left-[10%] w-[600px] h-[600px] rounded-full bg-[#1d6bf3]/12 blur-[120px]" />
        <div className="absolute -top-[10%] right-[5%] w-[500px] h-[500px] rounded-full bg-[#7c3aed]/10 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[30%] w-[400px] h-[400px] rounded-full bg-[#1d6bf3]/6 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-white/[0.06] bg-[#08080c]/70 backdrop-blur-xl px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1d6bf3] to-[#7c3aed] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-zinc-100 tracking-tight">CivicPulse</span>
          </div>
          <div className="flex items-center gap-4">
            {totalSubmissions !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 text-xs text-zinc-400"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d4aa] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00d4aa]" />
                </span>
                <span>{totalSubmissions.toLocaleString()} voices heard</span>
              </motion.div>
            )}
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 transition-colors duration-200 group"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>MP Dashboard</span>
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 pt-20 pb-12">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="text-center mb-12"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] text-xs text-zinc-400">
              <Sparkles className="w-3 h-3 text-[#1d6bf3]" />
              <span>AI-powered civic feedback</span>
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl font-bold tracking-tight mb-5 leading-[1.05]"
          >
            <span className="text-zinc-100">Tell your MP</span>
            <br />
            <span className="bg-gradient-to-r from-[#1d6bf3] via-[#5b8ef0] to-[#7c3aed] bg-clip-text text-transparent">
              what matters.
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-zinc-500 text-lg leading-relaxed max-w-md mx-auto">
            Describe any issue in your area. AI extracts the key details and
            surfaces recurring patterns to your representative.
          </motion.p>
        </motion.div>

        <AnimatePresence mode="wait">
          {state === "success" && result ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
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
              {/* Glass form card */}
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6 shadow-2xl shadow-black/40">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
                  placeholder="Describe the issue in your area… e.g. 'The road on High Street has potholes that damaged my car and are dangerous for cyclists.'"
                  className="w-full bg-transparent border-0 text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none text-sm leading-relaxed min-h-[120px] transition-all"
                />

                <div className="h-px bg-white/[0.06] -mx-6 mb-4" />

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={toggleRecording}
                      className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-all duration-200 ${
                        isRecording
                          ? "bg-red-500/15 border-red-500/30 text-red-400"
                          : "bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.14]"
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
                          </span>
                          <MicOff className="w-3.5 h-3.5" />
                          Recording…
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          Voice
                        </>
                      )}
                    </motion.button>
                    <span className="text-xs text-zinc-700">
                      {text.length > 0 && `${text.length} chars`}
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={!text.trim() || state === "submitting"}
                    className="flex items-center gap-2 bg-[#1d6bf3] hover:bg-[#2b78ff] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-[#1d6bf3]/25"
                  >
                    {state === "submitting" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analysing…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Sample prompts */}
              <div className="mt-5">
                <p className="text-xs text-zinc-700 text-center mb-3 uppercase tracking-widest">
                  Try a sample
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLES.map((s, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.01, borderColor: "rgba(255,255,255,0.12)" }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setText(s)}
                      className="text-left text-xs text-zinc-500 hover:text-zinc-300 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl px-3 py-2.5 transition-all duration-200 line-clamp-2 leading-relaxed"
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
  const urgency = URGENCY_STYLES[result.urgency] || URGENCY_STYLES.medium;
  const fields = [
    { label: "Category",  value: result.category,  icon: "◆" },
    { label: "Ward",      value: result.ward,       icon: "◎" },
    { label: "Sentiment", value: result.sentiment,  icon: "◉" },
    { label: "Urgency",   value: result.urgency,    icon: "▲", urgent: true },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6 shadow-2xl shadow-black/40">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-100">Submission received</p>
          <p className="text-xs text-zinc-600 mt-0.5">AI extracted and stored your feedback</p>
        </div>
      </div>

      {/* Fields grid */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-2 mb-4"
      >
        {fields.map((f) => (
          <motion.div
            key={f.label}
            variants={fadeUp}
            className={`rounded-xl px-3 py-2.5 border ${f.urgent ? urgency.bg : "bg-white/[0.03] border-white/[0.07]"}`}
          >
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">{f.label}</p>
            <p className={`text-sm font-medium capitalize ${f.urgent ? urgency.text : "text-zinc-200"}`}>
              {f.value}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 mb-5"
      >
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1.5 flex items-center gap-1.5">
          <MapPin className="w-3 h-3" /> AI Summary
        </p>
        <p className="text-sm text-zinc-300 leading-relaxed">{result.summary}</p>
      </motion.div>

      {/* Actions */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onReset}
          className="flex-1 text-sm py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-zinc-300 transition-all duration-200"
        >
          Submit another
        </motion.button>
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="flex-1">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full text-sm py-2.5 rounded-xl bg-[#1d6bf3] hover:bg-[#2b78ff] text-white font-medium transition-all duration-200 shadow-lg shadow-[#1d6bf3]/25"
          >
            <LayoutDashboard className="w-4 h-4" />
            View dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
