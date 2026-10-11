import React from "react";
import {
  ShieldAlert,
  Flame,
  Volume2,
  VolumeX,
  Languages,
  Sparkles,
  RotateCcw,
  BookOpen,
  FileText,
  Radio,
  Clock,
  DollarSign,
} from "lucide-react";
import { Scenario, Severity } from "../types/incident";
import { soundManager } from "../utils/audio";

interface NavbarProps {
  currentScenario: Scenario;
  allScenarios: Scenario[];
  onSelectScenario: (scenario: Scenario) => void;
  language: "ar" | "en";
  onToggleLanguage: () => void;
  isMuted: boolean;
  onToggleSound: () => void;
  onOpenAiGenerator: () => void;
  onOpenHandbook: () => void;
  onOpenPostMortem: () => void;
  onResetIncident: () => void;
  elapsedSeconds: number;
  totalLoss: number;
  isResolved: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScenario,
  allScenarios,
  onSelectScenario,
  language,
  onToggleLanguage,
  isMuted,
  onToggleSound,
  onOpenAiGenerator,
  onOpenHandbook,
  onOpenPostMortem,
  onResetIncident,
  elapsedSeconds,
  totalLoss,
  isResolved,
}) => {
  const isAr = language === "ar";

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case "Sev-1":
        return "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse";
      case "Sev-2":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "Sev-3":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40";
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-3 sm:px-6 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & War Room Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 via-rose-700 to-amber-600 shadow-lg shadow-rose-950/50 text-white">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-rose-400 font-semibold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-spin" />
                {isAr ? "غرفة عمليات الحوادث (SOC / SRE War Room)" : "SOC / SRE Incident War Room"}
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(
                  currentScenario.severity
                )}`}
              >
                {isResolved ? (isAr ? "تم الاحتواء ✓" : "CONTAINED ✓") : currentScenario.severity}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2 truncate max-w-[280px] sm:max-w-md">
              {currentScenario.title}
            </h1>
          </div>
        </div>

        {/* Center: Live Incident Ticker (Elapsed time & Downtime cost counter) */}
        <div className="hidden md:flex items-center gap-4 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-xs shadow-inner">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">{isAr ? "مدة الحادث:" : "MTTR Elapsed:"}</span>
            <span className="text-amber-300 font-bold tracking-widest">{formatTime(elapsedSeconds)}</span>
          </div>
          <div className="h-3 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 text-slate-300">
            <DollarSign className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-slate-400">{isAr ? "الخسارة التقديرية:" : "SLA Impact:"}</span>
            <span className="text-rose-400 font-bold">${totalLoss.toLocaleString()}</span>
          </div>
        </div>

        {/* Right: Actions & Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Scenario Selector */}
          <select
            value={currentScenario.id}
            onChange={(e) => {
              const found = allScenarios.find((s) => s.id === e.target.value);
              if (found) {
                soundManager.playKeyTick();
                onSelectScenario(found);
              }
            }}
            className="text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-500 font-mono cursor-pointer"
          >
            {allScenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                [{sc.severity}] {sc.title.substring(0, 32)}...
              </option>
            ))}
          </select>

          {/* AI Generator button */}
          <button
            onClick={() => {
              soundManager.playKeyTick();
              onOpenAiGenerator();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-950/40 transition-all cursor-pointer"
            title={isAr ? "توليد سيناريو حادث جديد بالذكاء الاصطناعي" : "Generate Custom Incident with AI"}
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span className="hidden sm:inline">{isAr ? "محرك AI للسيناريوهات" : "AI Generator"}</span>
          </button>

          {/* Post-Mortem View */}
          <button
            onClick={() => {
              soundManager.playKeyTick();
              onOpenPostMortem();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-all cursor-pointer"
            title={isAr ? "عرض تقرير تحليل السبب الجذري (RCA Post-Mortem)" : "View Incident Post-Mortem"}
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden lg:inline">{isAr ? "تقرير ما بعد الحادث RCA" : "Post-Mortem"}</span>
          </button>

          {/* Handbook Guide */}
          <button
            onClick={() => {
              soundManager.playKeyTick();
              onOpenHandbook();
            }}
            className="p-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            title={isAr ? "دليل قيادة الحوادث وأفضل ممارسات SRE" : "Incident Commander Handbook"}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-1.5 text-xs rounded-lg border transition-all cursor-pointer ${
              isMuted
                ? "bg-slate-900/60 border-slate-800 text-slate-500"
                : "bg-slate-900 border-slate-700 text-amber-400 shadow-sm"
            }`}
            title={isMuted ? (isAr ? "تشغيل المؤثرات الصوتية" : "Unmute Sound") : isAr ? "كتم الصوت" : "Mute Sound"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Dual Language Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 font-mono text-xs shadow-inner">
            <button
              onClick={() => {
                if (!isAr) onToggleLanguage();
              }}
              className={`px-2 py-1 rounded text-[11px] transition-all cursor-pointer font-bold ${
                isAr
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="تفعيل اللغة العربية"
            >
              عربي
            </button>
            <button
              onClick={() => {
                if (isAr) onToggleLanguage();
              }}
              className={`px-2 py-1 rounded text-[11px] transition-all cursor-pointer font-bold ${
                !isAr
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Switch to English"
            >
              EN
            </button>
          </div>

          {/* Reset Incident */}
          <button
            onClick={() => {
              soundManager.playKeyTick();
              onResetIncident();
            }}
            className="p-1.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-900/50 transition-all cursor-pointer"
            title={isAr ? "إعادة تعيين وبدء المحاكاة من الصفر" : "Restart Scenario"}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
