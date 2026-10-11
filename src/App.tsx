import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { MetricsDashboard } from "./components/MetricsDashboard";
import { TopologyMap } from "./components/TopologyMap";
import { TerminalConsole } from "./components/TerminalConsole";
import { WarRoomChat } from "./components/WarRoomChat";
import { DecisionMatrix } from "./components/DecisionMatrix";
import { PostMortemModal } from "./components/PostMortemModal";
import { AiScenarioGeneratorModal } from "./components/AiScenarioGeneratorModal";
import { EducationalGuideModal } from "./components/EducationalGuideModal";
import { PRESET_SCENARIOS_AR, PRESET_SCENARIOS_EN } from "./data/presetScenarios";
import {
  Scenario,
  SystemMetrics,
  LogEntry,
  TeamReaction,
  DecisionOption,
  EvaluationResult,
  PostMortemData,
  ActionHistoryItem,
  IncidentPhase,
} from "./types/incident";
import { soundManager } from "./utils/audio";
import { generateFallbackPostMortem } from "./utils/postmortemFallback";

export default function App() {
  const [language, setLanguage] = useState<"ar" | "en">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("inc_lang");
      if (saved === "ar" || saved === "en") return saved;
    }
    return "ar";
  });
  const isAr = language === "ar";

  // Scenarios state
  const [allScenarios, setAllScenarios] = useState<Scenario[]>(() =>
    language === "ar" ? PRESET_SCENARIOS_AR : PRESET_SCENARIOS_EN
  );
  const [currentScenario, setCurrentScenario] = useState<Scenario>(allScenarios[0]);

  // Phase & Metrics state
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetrics>(currentScenario.initialMetrics);
  const [logs, setLogs] = useState<LogEntry[]>(currentScenario.initialLogs);
  const [teamMessages, setTeamMessages] = useState<TeamReaction[]>([
    {
      author: "Sarah (SRE Lead)",
      role: "sre",
      message:
        language === "ar"
          ? "جميع مؤشرات الأداء تدق ناقوس الخطر! تم تفعيل خط الطوارئ. بانتظار توجيه قائد الحادث."
          : "PagerDuty Sev-1 alert triggered! Blast radius expanding. Standing by for Incident Commander guidance.",
      timestamp: "13:00:15",
    },
    {
      author: "Alex (SecOps)",
      role: "secops",
      message:
        language === "ar"
          ? "أنا أراقب حركة الشبكة ونقاط التسلل. سنحتاج لاحتواء الهجوم بأسرع وقت لتجنب تفاقم التسريب أو سقوط العنقود."
          : "SecOps bridge active. Monitoring edge ingress and external anomalies. Let's contain the blast radius first.",
      timestamp: "13:00:28",
    },
  ]);

  // Decision & History
  const [actionHistory, setActionHistory] = useState<ActionHistoryItem[]>([]);
  const [lastEvaluation, setLastEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isIncidentResolved, setIsIncidentResolved] = useState<boolean>(false);

  // Post Mortem
  const [postMortem, setPostMortem] = useState<PostMortemData | null>(null);
  const [isGeneratingPostMortem, setIsGeneratingPostMortem] = useState<boolean>(false);

  // Time & Cost ticker
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [totalLoss, setTotalLoss] = useState<number>(0);

  // Modals & Sound
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState<boolean>(false);
  const [isHandbookOpen, setIsHandbookOpen] = useState<boolean>(false);
  const [isPostMortemOpen, setIsPostMortemOpen] = useState<boolean>(false);

  // Audio siren trigger on mount/scenario switch
  useEffect(() => {
    soundManager.playAlertSiren();
  }, [currentScenario.id]);

  // Timer loop for incident duration and accumulating cost
  useEffect(() => {
    if (isIncidentResolved) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setTotalLoss((prev) => {
        const lossPerSec = currentMetrics.financialLossPerMinute / 60;
        return Math.round(prev + lossPerSec);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isIncidentResolved, currentMetrics.financialLossPerMinute]);

  // Sync language change
  const handleToggleLanguage = () => {
    soundManager.playKeyTick();
    const newLang = language === "ar" ? "en" : "ar";
    setLanguage(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("inc_lang", newLang);
    }
    const presets = newLang === "ar" ? PRESET_SCENARIOS_AR : PRESET_SCENARIOS_EN;
    setAllScenarios(presets);
    const matched = presets.find((s) => s.id === currentScenario.id) || presets[0];
    setCurrentScenario(matched);
    resetIncidentState(matched, newLang);
  };

  const handleSelectScenario = (sc: Scenario) => {
    setCurrentScenario(sc);
    resetIncidentState(sc);
  };

  const resetIncidentState = (sc: Scenario, targetLang?: "ar" | "en") => {
    const lang = targetLang || language;
    setCurrentPhaseIndex(0);
    setCurrentMetrics(sc.initialMetrics);
    setLogs(sc.initialLogs);
    setActionHistory([]);
    setLastEvaluation(null);
    setIsIncidentResolved(false);
    setPostMortem(null);
    setElapsedSeconds(0);
    setTotalLoss(0);
    setTeamMessages([
      {
        author: "Sarah (SRE Lead)",
        role: "sre",
        message:
          lang === "ar"
            ? "تم فتح خط الطوارئ الخاص بالحادث! تفقد السجلات والمؤشرات بانتظار قرارك الفوري."
            : "Emergency bridge active. Check telemetry and logs. Standing by for your directive.",
        timestamp: "13:00:15",
      },
    ]);
  };

  // Execute standard option or custom action
  const handleExecuteAction = async (actionText: string, optionTitle?: string) => {
    setIsEvaluating(true);
    soundManager.playKeyTick();

    const currentPhase = currentScenario.phases[currentPhaseIndex] || currentScenario.phases[0];

    try {
      const res = await fetch("/api/evaluate-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioTitle: currentScenario.title,
          category: currentScenario.category,
          severity: currentScenario.severity,
          phaseIndex: currentPhaseIndex + 1,
          actionTaken: actionText,
          currentMetrics,
          actionHistory,
          language,
        }),
      });

      let evalData: EvaluationResult;

      if (res.ok) {
        evalData = await res.json();
      } else {
        // Fallback evaluation
        evalData = {
          verdict: "acceptable",
          scoreDelta: 15,
          analysis:
            language === "ar"
              ? "تم تنفيذ الإجراء التكتيكي بنجاح. أظهرت السجلات انخفاضاً ملحوظاً في حجم الأخطاء وتحسن استجابة السيرفرات."
              : "Tactical action executed. Telemetry shows a drop in error rates and stabilizing latencies.",
          immediateOutcome:
            language === "ar"
              ? "تم تقليل حجم الحمل بنسبة 60% وانخفاض معدل الخطأ."
              : "Reduced blast radius by 60%, error rate stabilizing.",
          updatedMetrics: {
            cpuPercent: Math.max(20, currentMetrics.cpuPercent - 25),
            errorRatePercent: Math.max(2, currentMetrics.errorRatePercent - 40),
            latencyP99Ms: Math.max(300, currentMetrics.latencyP99Ms - 3000),
            financialLossPerMinute: Math.max(200, currentMetrics.financialLossPerMinute - 1200),
          },
          newLogs: [
            {
              timestamp: new Date().toISOString(),
              level: "INFO",
              source: "incident-commander",
              message: `Executed action: ${actionText.substring(0, 60)}...`,
            },
          ],
          teamReactions: [
            {
              author: "Sarah (SRE Lead)",
              role: "sre",
              message:
                language === "ar"
                  ? "المؤشرات بدأت بالاستقرار فوراً! استجابة ممتازة."
                  : "Telemetry stabilizing! Great tactical call.",
            },
          ],
          isIncidentResolved: currentPhaseIndex >= 1,
        };
      }

      // Play audio feedback based on verdict
      if (evalData.verdict === "optimal" || evalData.verdict === "acceptable") {
        soundManager.playSuccessChime();
      } else {
        soundManager.playFailureGlitch();
      }

      // Apply updated metrics
      setCurrentMetrics((prev) => ({
        ...prev,
        ...evalData.updatedMetrics,
      }));

      // Append logs
      const generatedLogs: LogEntry[] = (evalData.newLogs || []).map((l, i) => ({
        id: `gen-${Date.now()}-${i}`,
        timestamp: l.timestamp || new Date().toISOString(),
        level: l.level || "INFO",
        source: l.source || "sre-runner",
        message: l.message,
      }));
      setLogs((prev) => [...prev, ...generatedLogs]);

      // Append team chat reactions
      if (evalData.teamReactions && evalData.teamReactions.length > 0) {
        setTeamMessages((prev) => [...prev, ...evalData.teamReactions]);
      }

      // Add to action history
      const historyItem: ActionHistoryItem = {
        phaseIndex: currentPhaseIndex + 1,
        phaseName: currentPhase.phaseName,
        actionTaken: optionTitle || actionText,
        timestamp: new Date().toLocaleTimeString(),
        verdict: evalData.verdict,
        scoreDelta: evalData.scoreDelta,
        analysis: evalData.analysis,
      };
      setActionHistory((prev) => [...prev, historyItem]);

      // Update evaluation state
      setLastEvaluation(evalData);

      // Check if resolved or if nextPhase exists
      if (evalData.isIncidentResolved || currentPhaseIndex >= 2) {
        setIsIncidentResolved(true);
        triggerPostMortemGeneration([...actionHistory, historyItem]);
      } else if (evalData.nextPhase) {
        // dynamically append next phase to current scenario
        setCurrentScenario((prev) => ({
          ...prev,
          phases: [...prev.phases, evalData.nextPhase!],
        }));
      }
    } catch (err: any) {
      console.error(err);
      soundManager.playFailureGlitch();
    } finally {
      setIsEvaluating(false);
    }
  };

  // Proceed to next phase
  const handleProceedToNextPhase = () => {
    setLastEvaluation(null);
    setCurrentPhaseIndex((prev) => prev + 1);
  };

  // Generate Post-Mortem RCA via Gemini or smart fallback
  const triggerPostMortemGeneration = async (finalHistory?: ActionHistoryItem[]) => {
    setIsGeneratingPostMortem(true);
    const historyToUse = finalHistory || actionHistory;
    const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));

    try {
      const res = await fetch("/api/generate-postmortem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: currentScenario,
          history: historyToUse,
          finalMetrics: currentMetrics,
          totalMinutes: durationMins,
          language,
        }),
      });

      if (res.ok) {
        const pmData = await res.json();
        if (pmData && pmData.executiveSummary) {
          setPostMortem(pmData);
          return;
        }
      }

      // If response is not ok or empty, use guaranteed client fallback
      const fallback = generateFallbackPostMortem(
        currentScenario,
        historyToUse,
        currentMetrics,
        durationMins,
        language
      );
      setPostMortem(fallback);
    } catch (err) {
      console.warn("Using client-side fallback postmortem due to error:", err);
      const fallback = generateFallbackPostMortem(
        currentScenario,
        historyToUse,
        currentMetrics,
        durationMins,
        language
      );
      setPostMortem(fallback);
    } finally {
      setIsGeneratingPostMortem(false);
    }
  };

  // Send message in war room chat
  const handleSendMessage = (msg: string) => {
    const newMsg: TeamReaction = {
      author: language === "ar" ? "أنت (قائد الحادث)" : "Incident Commander",
      role: "sre",
      message: msg,
      timestamp: new Date().toLocaleTimeString(),
    };
    setTeamMessages((prev) => [...prev, newMsg]);

    // Simulated reply after brief delay
    setTimeout(() => {
      const reply: TeamReaction = {
        author: "Sarah (SRE Lead)",
        role: "sre",
        message:
          language === "ar"
            ? `علم، تم استلام التوجيه: "${msg.substring(0, 40)}...". الفريق ينفذ التحقق الآن.`
            : `Acknowledged directive: "${msg.substring(0, 40)}...". Monitoring telemetry.`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setTeamMessages((prev) => [...prev, reply]);
    }, 1200);
  };

  const currentPhase: IncidentPhase =
    currentScenario.phases[currentPhaseIndex] ||
    currentScenario.phases[currentScenario.phases.length - 1] || {
      phaseIndex: 1,
      phaseName: isAr ? "المرحلة: الفرز والاحتواء" : "Phase: Triage & Containment",
      description: currentScenario.summary,
      options: [],
    };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white"
    >
      {/* Navigation Bar */}
      <Navbar
        currentScenario={currentScenario}
        allScenarios={allScenarios}
        onSelectScenario={handleSelectScenario}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        isMuted={isMuted}
        onToggleSound={() => {
          const next = !isMuted;
          setIsMuted(next);
          soundManager.setMuted(next);
        }}
        onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
        onOpenHandbook={() => setIsHandbookOpen(true)}
        onOpenPostMortem={() => {
          if (!postMortem && !isGeneratingPostMortem) {
            triggerPostMortemGeneration(actionHistory);
          }
          setIsPostMortemOpen(true);
        }}
        onResetIncident={() => resetIncidentState(currentScenario)}
        elapsedSeconds={elapsedSeconds}
        totalLoss={totalLoss}
        isResolved={isIncidentResolved}
      />

      {/* Main War Room Body */}
      <main className="max-w-7xl mx-auto p-3 sm:p-5 space-y-4">
        {/* 1. Live SRE Telemetry & Metrics Signals */}
        <MetricsDashboard
          metrics={currentMetrics}
          blastRadius={currentScenario.estimatedBlastRadius}
          language={language}
        />

        {/* 2. Architecture Topology Map */}
        <TopologyMap nodes={currentScenario.topologyNodes} language={language} />

        {/* 3. Core Decision Matrix & Dilemma Engine */}
        <DecisionMatrix
          currentPhase={currentPhase}
          phaseNumber={currentPhaseIndex + 1}
          onSelectOption={(opt) => handleExecuteAction(opt.description, opt.title)}
          onSubmitCustomAction={(custom) => handleExecuteAction(custom, "Custom Directive")}
          isEvaluating={isEvaluating}
          lastEvaluation={lastEvaluation}
          onProceedToNextPhase={handleProceedToNextPhase}
          onOpenPostMortem={() => {
            if (!postMortem) triggerPostMortemGeneration(actionHistory);
            setIsPostMortemOpen(true);
          }}
          isIncidentResolved={isIncidentResolved}
          language={language}
        />

        {/* 4. Split Screen: Interactive Syslogs/CLI + War Room Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            <TerminalConsole
              logs={logs}
              scenarioTitle={currentScenario.title}
              language={language}
            />
          </div>
          <div className="lg:col-span-4">
            <WarRoomChat
              messages={teamMessages}
              onSendMessage={handleSendMessage}
              language={language}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <PostMortemModal
        isOpen={isPostMortemOpen}
        onClose={() => setIsPostMortemOpen(false)}
        postMortem={postMortem}
        scenario={currentScenario}
        isLoading={isGeneratingPostMortem}
        language={language}
        onRegenerate={() => triggerPostMortemGeneration(actionHistory)}
      />

      <AiScenarioGeneratorModal
        isOpen={isAiGeneratorOpen}
        onClose={() => setIsAiGeneratorOpen(false)}
        onScenarioCreated={(sc) => {
          setAllScenarios((prev) => [sc, ...prev]);
          handleSelectScenario(sc);
        }}
        language={language}
      />

      <EducationalGuideModal
        isOpen={isHandbookOpen}
        onClose={() => setIsHandbookOpen(false)}
        language={language}
      />
    </div>
  );
}
