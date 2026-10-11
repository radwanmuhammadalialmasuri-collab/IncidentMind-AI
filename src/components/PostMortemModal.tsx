import React, { useState } from "react";
import {
  X,
  Award,
  Clock,
  DollarSign,
  ShieldAlert,
  CheckCircle,
  AlertOctagon,
  Copy,
  Check,
  FileText,
  ListOrdered,
  Sparkles,
} from "lucide-react";
import { PostMortemData, Scenario } from "../types/incident";
import { soundManager } from "../utils/audio";

interface PostMortemModalProps {
  isOpen: boolean;
  onClose: () => void;
  postMortem: PostMortemData | null;
  scenario: Scenario;
  isLoading: boolean;
  language: "ar" | "en";
  onRegenerate?: () => void;
}

export const PostMortemModal: React.FC<PostMortemModalProps> = ({
  isOpen,
  onClose,
  postMortem,
  scenario,
  isLoading,
  language,
  onRegenerate,
}) => {
  const isAr = language === "ar";
  const [copied, setCopied] = useState(false);

  // Auto trigger generation if opened without data
  React.useEffect(() => {
    if (isOpen && !postMortem && !isLoading && onRegenerate) {
      onRegenerate();
    }
  }, [isOpen, postMortem, isLoading, onRegenerate]);

  if (!isOpen) return null;

  const handleCopyMarkdown = () => {
    soundManager.playKeyTick();
    if (postMortem?.markdownReport) {
      navigator.clipboard.writeText(postMortem.markdownReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A+":
      case "A":
        return "text-emerald-400 border-emerald-500/50 bg-emerald-950/40";
      case "B":
        return "text-cyan-400 border-cyan-500/50 bg-cyan-950/40";
      case "C":
        return "text-amber-400 border-amber-500/50 bg-amber-950/40";
      default:
        return "text-rose-400 border-rose-500/50 bg-rose-950/40";
    }
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-3.5 sm:px-6 py-3 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-lg bg-sky-950/60 border border-sky-800/80 text-sky-400 shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-semibold truncate block">
                {isAr ? "تقرير ما بعد الحادث الرسمي (Blameless RCA)" : "Official Post-Mortem & RCA Report"}
              </span>
              <h3 className="text-xs sm:text-base font-bold text-slate-100 truncate">{scenario.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onRegenerate && (
              <button
                onClick={() => {
                  soundManager.playKeyTick();
                  onRegenerate();
                }}
                disabled={isLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded-lg bg-sky-950/80 border border-sky-800 text-sky-300 hover:text-white hover:bg-sky-900 transition-colors cursor-pointer"
                title={isAr ? "إعادة تحليل وتوليد التقرير" : "Regenerate RCA report"}
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span className="hidden sm:inline">{isAr ? "تحديث التقرير" : "Refresh RCA"}</span>
              </button>
            )}

            {postMortem && (
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isAr ? "نسخ Markdown" : "Copy"}</span>
              </button>
            )}
            <button
              onClick={() => {
                soundManager.playKeyTick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-6 pb-24 sm:pb-8 overflow-y-auto flex-1 space-y-5">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
              <p className="text-sm font-mono text-slate-200 font-bold">
                {isAr
                  ? "جاري إعداد وصياغة تقرير تحليل السبب الجذري (RCA)..."
                  : "Synthesizing Root Cause Analysis (RCA) and SRE Scorecard..."}
              </p>
              <p className="text-xs font-mono text-slate-400">
                {isAr
                  ? "يتم تجميع الخط الزمني للقرارات، حساب مقاييس MTTR، واستخراج خطط العمل الوقائية."
                  : "Compiling decision timeline, calculating MTTR metrics, and generating preventative action items."}
              </p>
            </div>
          ) : !postMortem ? (
            <div className="py-16 text-center space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-md mx-auto space-y-3">
                <FileText className="w-10 h-10 text-sky-400 mx-auto opacity-80" />
                <h4 className="text-sm font-bold text-slate-100 font-mono">
                  {isAr ? "جاهز لتوليد تقرير ما بعد الحادث الشامل (RCA)" : "Ready to generate Post-Mortem RCA Report"}
                </h4>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  {isAr
                    ? "يقوم التقرير بتحليل القرارات المتخذة، كشف الأسباب الجذرية عبر منهجية 5 Whys، وتقديم توصيات هندسية وفق معايير Google SRE."
                    : "The report analyzes all actions taken, extracts root causes via 5 Whys, and provides SRE scorecard metrics."}
                </p>
                {onRegenerate && (
                  <button
                    onClick={() => {
                      soundManager.playKeyTick();
                      onRegenerate();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-950/50 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>{isAr ? "⚡ توليد تقرير RCA الآن" : "⚡ Generate Post-Mortem Report Now"}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Score & SRE Scorecard Banner */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Grade Card */}
                <div
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${getGradeColor(
                    postMortem.grade
                  )}`}
                >
                  <Award className="w-6 h-6 mb-1 opacity-80" />
                  <span className="text-4xl sm:text-5xl font-black font-mono tracking-tighter">
                    {postMortem.grade}
                  </span>
                  <span className="text-xs font-mono font-bold mt-1">
                    {isAr ? `درجة الأداء: ${postMortem.gradeScore}/100` : `Incident Score: ${postMortem.gradeScore}/100`}
                  </span>
                </div>

                {/* Metrics Cards */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{isAr ? "زمن الاكتشاف MTTD:" : "MTTD (Detect):"}</span>
                    <strong className="text-slate-200">{postMortem.incidentScorecard.mttd}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{isAr ? "زمن الإقرار MTTA:" : "MTTA (Acknowledge):"}</span>
                    <strong className="text-slate-200">{postMortem.incidentScorecard.mtta}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{isAr ? "زمن التعافي MTTR:" : "MTTR (Recovery):"}</span>
                    <strong className="text-emerald-400 font-bold">{postMortem.incidentScorecard.mttr}</strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{isAr ? "انتهاك SLA:" : "SLA Breached:"}</span>
                    <strong className={postMortem.incidentScorecard.slaBreach ? "text-rose-400" : "text-emerald-400"}>
                      {postMortem.incidentScorecard.slaBreach ? (isAr ? "نعم (تجاوز الحدود)" : "YES") : isAr ? "لا (ضمن النطاق)" : "NO"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{isAr ? "تكلفة التوقف:" : "Downtime Cost:"}</span>
                    <strong className="text-rose-400">{postMortem.incidentScorecard.estimatedDowntimeCost}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{isAr ? "سلامة البيانات:" : "Data Integrity:"}</span>
                    <strong className="text-cyan-400">{postMortem.incidentScorecard.dataIntegrityStatus}</strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-center text-xs font-mono text-slate-300">
                  <div className="flex items-center gap-1.5 text-purple-400 mb-1 font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAr ? "ثقافة Blameless" : "Blameless Culture"}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    {isAr
                      ? "التركيز ليس على لوم الأشخاص، بل على إصلاح الفجوات المنهجية والأدوات وحماية النظام مستقبلاً."
                      : "We focus on system vulnerabilities, tooling flaws, and processes, not blaming human error."}
                  </p>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>{isAr ? "الملخص التنفيذي (Executive Summary)" : "Executive Summary"}</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {postMortem.executiveSummary}
                </p>
              </div>

              {/* Root Cause & 5 Whys */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? "تحليل السبب الجذري ومنهجية الأسئلة الخمسة (The 5 Whys)" : "Root Cause Analysis (5 Whys)"}</span>
                </h4>

                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs sm:text-sm text-rose-300 font-mono">
                  <strong className="text-rose-200">{isAr ? "السبب الجذري الأساسي: " : "Primary Root Cause: "}</strong>
                  {postMortem.rootCauseAnalysis.primaryRootCause}
                </div>

                <div className="space-y-2">
                  {postMortem.rootCauseAnalysis.fiveWhys.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs font-mono">
                      <div className="text-cyan-400 font-bold mb-1">
                        {isAr ? `لماذا #${idx + 1}: ` : `Why #${idx + 1}: `}
                        <span className="text-slate-200 font-sans">{item.why}</span>
                      </div>
                      <div className="text-slate-400 font-sans pl-3 border-l border-slate-700">
                        {item.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths vs Anti-Patterns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>{isAr ? "نقاط القوة في الاستجابة" : "Key Strengths"}</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 font-sans list-disc list-inside">
                    {postMortem.keyStrengths.map((str, i) => (
                      <li key={i} className="leading-relaxed">
                        {str}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Anti-Patterns / Mistakes */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    <span>{isAr ? "أخطاء وأنماط مضادة تم ارتكابها" : "Identified Anti-Patterns"}</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 font-sans list-disc list-inside">
                    {postMortem.criticalMistakesAndAntiPatterns.map((m, i) => (
                      <li key={i} className="leading-relaxed">
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Items (P0, P1, P2) */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  {isAr ? "مصفوفة خطة العمل والتحسين الوقائي (Action Items)" : "Action Items & Preventative Measures"}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-slate-300 text-left">
                    <thead className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
                      <tr>
                        <th className="p-2 w-16">{isAr ? "الأولوية" : "Priority"}</th>
                        <th className="p-2">{isAr ? "المهمة والإصلاح" : "Task"}</th>
                        <th className="p-2 w-32">{isAr ? "المسؤول" : "Owner"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {postMortem.actionItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="p-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                item.priority === "P0"
                                  ? "bg-rose-950 text-rose-400 border border-rose-800"
                                  : item.priority === "P1"
                                  ? "bg-amber-950 text-amber-400 border border-amber-800"
                                  : "bg-blue-950 text-blue-400 border border-blue-800"
                              }`}
                            >
                              {item.priority}
                            </span>
                          </td>
                          <td className="p-2 font-sans">{item.task}</td>
                          <td className="p-2 text-slate-400">{item.owner}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
