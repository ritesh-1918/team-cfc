"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mic, MicOff, Send, CheckCircle2, Loader2,
  MapPin, LayoutDashboard, Zap, Activity
} from "lucide-react";

type SubmitState = "idle" | "recording" | "submitting" | "success" | "error";

type ExtractionResult = {
  category: string;
  summary: string;
  location_name: string;
  ward: string;
  sentiment: string;
  urgency: string;
};

const URGENCY_COLOR: Record<string, string> = {
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

const SAMPLE_SUBMISSIONS = [
  "The pothole on Baker Street near the tube station is dangerous. Three cyclists have fallen this week. It needs urgent repair.",
  "Our local park in Hackney has no lighting after 6pm. Elderly residents are afraid to use it. We need LED streetlights installed.",
  "The GP surgery in Islington has a 3-week wait time. We desperately need a second surgery or extended hours.",
  "Flooding on Lambeth Road every time it rains heavily. The drainage system hasn't been maintained for years.",
];

export default function SubmissionPage() {
  const [text, setText] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
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

    const SpeechRecognitionAPI =
      (typeof window !== "undefined" &&
        (window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition)) ||
      null;

    if (!SpeechRecognitionAPI) {
      setError("Voice input not supported in this browser. Use Chrome.");
      return;
    }

    const rec = new SpeechRecognitionAPI();
    rec.lang = "en-GB";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setText(transcript);
    };

    rec.onerror = () => {
      setError("Microphone error. Check permissions.");
      setIsRecording(false);
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    rec.start();
    setRecognition(rec);
    setIsRecording(true);
  }

  function reset() {
    setText("");
    setState("idle");
    setResult(null);
    setError("");
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" />
            <span className="font-semibold text-zinc-100">CivicPulse</span>
          </div>
          <div className="flex items-center gap-3">
            {totalSubmissions !== null && (
              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                {totalSubmissions} voices heard
              </span>
            )}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800"
            >
              <LayoutDashboard className="w-4 h-4" />
              MP Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-2xl mx-auto px-6 pt-16 pb-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 text-xs text-indigo-400 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Your voice shapes your community
          </div>
          <h1 className="text-4xl font-bold text-zinc-100 mb-3 tracking-tight">
            Tell your MP what matters
          </h1>
          <p className="text-zinc-400 text-lg">
            Submit development concerns. AI groups similar issues and surfaces
            the most urgent needs to your representative.
          </p>
        </div>

        {state === "success" && result ? (
          <SuccessCard result={result} onReset={reset} />
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe the issue in your area… e.g. 'The road on High Street has potholes that damaged my car and are dangerous for cyclists.'"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-4 text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 text-sm leading-relaxed min-h-[140px] transition-all"
            />

            {error && (
              <p className="text-red-400 text-sm mt-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={toggleRecording}
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-all ${
                  isRecording
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700"
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isRecording ? "Stop recording" : "Voice input"}
              </button>

              <button
                onClick={handleSubmit}
                disabled={!text.trim() || state === "submitting"}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-all"
              >
                {state === "submitting" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {state === "submitting" ? "Analysing…" : "Submit"}
              </button>
            </div>

            {/* Quick samples */}
            <div className="mt-5 pt-5 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 mb-2">Try a sample:</p>
              <div className="flex flex-col gap-2">
                {SAMPLE_SUBMISSIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setText(s)}
                    className="text-left text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg px-3 py-2 transition-all truncate"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SuccessCard({ result, onReset }: { result: ExtractionResult; onReset: () => void }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
        <div>
          <h3 className="font-semibold text-zinc-100">Submission received</h3>
          <p className="text-xs text-zinc-500">AI extracted and stored your feedback</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <InfoRow icon="📂" label="Category" value={result.category} />
        <InfoRow icon="📍" label="Ward" value={result.ward} />
        <InfoRow icon="💬" label="Sentiment" value={result.sentiment} />
        <InfoRow
          icon="🔥"
          label="Urgency"
          value={result.urgency}
          className={URGENCY_COLOR[result.urgency] || ""}
        />
      </div>

      <div className="bg-zinc-950 border border-zinc-700 rounded-xl p-3 mb-5">
        <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Summary
        </p>
        <p className="text-sm text-zinc-300">{result.summary}</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 text-sm py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all"
        >
          Submit another
        </button>
        <Link
          href="/dashboard"
          className="flex-1 text-sm py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-center transition-all flex items-center justify-center gap-1.5"
        >
          <LayoutDashboard className="w-4 h-4" />
          View dashboard
        </Link>
      </div>
    </div>
  );
}

function InfoRow({
  icon, label, value, className = "",
}: {
  icon: string; label: string; value: string; className?: string;
}) {
  return (
    <div className={`bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 ${className}`}>
      <p className="text-xs text-zinc-500 mb-0.5">{icon} {label}</p>
      <p className="text-sm font-medium text-zinc-200 capitalize">{value}</p>
    </div>
  );
}
