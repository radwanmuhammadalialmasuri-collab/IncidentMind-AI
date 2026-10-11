import React, { useState } from "react";
import {
  Compass,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Terminal,
  Zap,
  Sparkles,
  TrendingUp,
  FileCheck,
} from "lucide-react";
import {
  DecisionOption,
  IncidentPhase,
  DecisionVerdict,
  EvaluationResult,
} from "../types/incident";
import { soundManager } from "../utils/audio";

interface DecisionMatrixProps {
  currentPhase: IncidentPhase;
  phaseNumber: number;
  totalPhases?: number;
  onSelectOption: (option: DecisionOption) => void;
  onSubmitCustomAction: (actionText: string) => void;
  isEvaluating: boolean;
  lastEvaluation: EvaluationResult | null;
  onProceedToNextPhase: () => void;
  onOpenPostMortem: () => void;
  isIncidentResolved: boolean;
  language: "ar" | "en";
}

export const DecisionMatrix: React.FC<DecisionMatrixProps> = ({
  currentPhase,
  phaseNumber,
  onSelectOption,
  onSubmitCustomAction,
  isEvaluating,
  lastEvaluation,
  onProceedToNextPhase,
  onOpenPostMortem,
  isIncidentResolved,
  language,
}) => {
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<"preset" | "custom">("preset");
  const [customActionText, setCustomActionText] = useState("");
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const getRiskBadge = (risk: DecisionOption["risk"]) => {
    switch (risk) {
      case "Low":
        return "bg-emerald-950/60 text-emerald-400 border-emerald-800/80";
      case "Medium":
        return "bg-amber-950/60 text-amber-400 border-amber-800/80";
      case "High":
        return "bg-rose-950/60 text-rose-400 border-rose-800/80 animate-pulse";
    }
  };

  const getVerdictDetails = (verdict: DecisionVerdict) => {
    switch (verdict) {
      case "optimal":
        return {
          color: "text-emerald-400 bg-emerald-950/40 border-emerald-500/50",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
          label: isAr ? "قرار مثالي (Optimal Decision)" : "Optimal Decision",
        };
      case "acceptable":
        return {
          color: "text-cyan-400 bg-cyan-950/40 border-cyan-500/50",
          icon: <CheckCircle2 className="w-5 h-5 text-cyan-400" />,
          label: isAr ? "قرار مقبول مع تنازلات (Acceptable Tradeoff)" : "Acceptable Tradeoff",
        };
      case "suboptimal":
        return {
          color: "text-amber-400 bg-amber-950/40 border-amber-500/50",
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
          label: isAr ? "قرار غير دقيق أو أحدث أضراراً جانبية (Suboptimal)" : "Suboptimal Decision",
        };
      case "catastrophic":
        return {
          color: "text-rose-400 bg-rose-950/50 border-rose-500",
          icon: <XCircle className="w-5 h-5 text-rose-400" />,
          label: isAr ? "قرار كارثي ضاعف الانهيار (Catastrophic Failure)" : "Catastrophic Failure",
        };
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customActionText.trim() || isEvaluating) return;
    soundManager.playKeyTick();
    onSubmitCustomAction(customActionText.trim());
    setCustomActionText("");
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-5 backdrop-blur-sm shadow-xl flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-rose-400" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
              {currentPhase.phaseName}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab("preset")}
              className={`px-2.5 py-1 text-xs font-mono rounded font-semibold transition-all cursor-pointer ${
                activeTab === "preset"
                  ? "bg-slate-800 text-slate-100 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isAr ? "الخيارات الاستراتيجية" : "Standard Choices"}
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`px-2.5 py-1 text-xs font-mono rounded font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === "custom"
                  ? "bg-purple-900/50 border border-purple-700/60 text-purple-300 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3 h-3 text-yellow-300" />
              <span>{isAr ? "قرار حر مخصص (AI Eval)" : "Custom Tactical Action"}</span>
            </button>
          </div>
        </div>

        {/* Phase dilemma briefing */}
        <div className="mb-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          <p>{currentPhase.description}</p>
        </div>
      </div>

      {/* Main Content: Preset options OR Custom Action OR Live Evaluation Review */}
      {lastEvaluation ? (
        // SHOW EVALUATION RESULT MODAL / PANEL
        <div className="space-y-3.5">
          {(() => {
            const vInfo = getVerdictDetails(lastEvaluation.verdict);
            return (
              <div className={`p-4 rounded-xl border ${vInfo.color} space-y-3 shadow-lg`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {vInfo.icon}
                    <span className="font-mono font-bold text-sm sm:text-base">{vInfo.label}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-950/70 border border-slate-800">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {isAr ? "تأثير النتيجة: " : "Score Delta: "}
                      <strong
                        className={lastEvaluation.scoreDelta >= 0 ? "text-emerald-400" : "text-rose-400"}
                      >
                        {lastEvaluation.scoreDelta > 0 ? `+${lastEvaluation.scoreDelta}` : lastEvaluation.scoreDelta}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/40 p-3 rounded-lg border border-slate-800/60 font-sans">
                  {lastEvaluation.analysis}
                </div>

                <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    <strong className="text-slate-200">{isAr ? "النتيجة الفورية: " : "Tactical Outcome: "}</strong>
                    {lastEvaluation.immediateOutcome}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Action buttons after evaluation */}
          <div className="flex items-center justify-end gap-2 pt-2">
            {isIncidentResolved ? (
              <button
                onClick={() => {
                  soundManager.playSuccessChime();
                  onOpenPostMortem();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>{isAr ? "تم احتواء الحادث! عرض تقرير RCA الشامل" : "Incident Contained! View Full RCA Report"}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  soundManager.playKeyTick();
                  onProceedToNextPhase();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-mono text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-950/50 cursor-pointer"
              >
                <span>{isAr ? "الانتقال إلى المرحلة التالية" : "Proceed to Next Incident Phase"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : activeTab === "preset" ? (
        // PRESET OPTIONS CARDS
        <div className="space-y-2.5">
          {currentPhase.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            return (
              <div
                key={option.id}
                onClick={() => {
                  if (!isEvaluating) {
                    soundManager.playKeyTick();
                    setSelectedOptionId(option.id);
                  }
                }}
                className={`p-3 rounded-lg border transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-slate-800/90 border-cyan-400 ring-1 ring-cyan-400/50"
                    : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/90"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span className="font-mono text-cyan-400">[{option.id}]</span>
                    {option.title}
                  </h4>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold ${getRiskBadge(
                      option.risk
                    )}`}
                  >
                    {isAr ? `مستوى المخاطرة: ${option.risk}` : `Risk: ${option.risk}`}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans mb-2">
                  {option.description}
                </p>

                {option.expectedTradeoff && (
                  <div className="text-[11px] font-mono text-amber-300/90 mb-2 bg-amber-950/20 px-2 py-1 rounded border border-amber-900/40">
                    <strong className="text-amber-200">{isAr ? "التنازل المتوقع: " : "Tradeoff: "}</strong>
                    {option.expectedTradeoff}
                  </div>
                )}

                {option.command && (
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800 font-mono text-[11px] text-emerald-400 flex items-center gap-1.5 overflow-x-auto">
                    <Terminal className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="select-all">{option.command}</span>
                  </div>
                )}

                {isSelected && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOption(option);
                      }}
                      disabled={isEvaluating}
                      className="px-4 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>{isEvaluating ? "..." : isAr ? "تنفيذ هذا الإجراء الآن" : "Execute Tactical Action"}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // CUSTOM ACTION FREE TEXT FORM
        <form onSubmit={handleCustomSubmit} className="space-y-3">
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <label className="block text-xs font-mono font-bold text-purple-300 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>
                {isAr
                  ? "اكتب قرارك التكتيكي أو أمراً برمجياً وسيقوم محرك Gemini بتحليله ومحاكاة نتائجه:"
                  : "Describe your custom engineering decision or exact bash command for Gemini SRE evaluation:"}
              </span>
            </label>
            <textarea
              rows={4}
              value={customActionText}
              onChange={(e) => setCustomActionText(e.target.value)}
              placeholder={
                isAr
                  ? "مثال: سنقوم بإنشاء Read Replica لقاعدة البيانات وتوجيه استعلامات القراءة فقط إليها عبر PgBouncer، وتحديد مهلة المعاملات بـ 5 ثوان..."
                  : "e.g. Spin up a read-replica in AWS RDS, update pgbouncer to route SELECTs to reader endpoint, and apply aggressive 5s query timeouts..."
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500 leading-relaxed"
            />
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mt-2">
              <span>{isAr ? "التقييم يشمل: كبح الخطر، الآثار الجانبية، والردود الفورية" : "Evaluates: Blast radius, side effects, telemetry impact"}</span>
              <button
                type="submit"
                disabled={isEvaluating || !customActionText.trim()}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>{isEvaluating ? "..." : isAr ? "إرسال للتقييم الفوري" : "Submit for SRE Evaluation"}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
