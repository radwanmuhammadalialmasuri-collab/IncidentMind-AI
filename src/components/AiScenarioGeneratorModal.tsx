import React, { useState } from "react";
import { X, Sparkles, AlertCircle, Shield, Server, Layers, Cpu } from "lucide-react";
import { IncidentCategory, Severity, Scenario } from "../types/incident";
import { soundManager } from "../utils/audio";

interface AiScenarioGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioCreated: (scenario: Scenario) => void;
  language: "ar" | "en";
}

export const AiScenarioGeneratorModal: React.FC<AiScenarioGeneratorModalProps> = ({
  isOpen,
  onClose,
  onScenarioCreated,
  language,
}) => {
  const isAr = language === "ar";
  const [category, setCategory] = useState<IncidentCategory>("security");
  const [severity, setSeverity] = useState<Severity>("Sev-1");
  const [stack, setStack] = useState("Kubernetes 1.29 + PostgreSQL 16 + Redis + AWS EKS");
  const [customTopic, setCustomTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playKeyTick();
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          severity,
          stack,
          customTopic,
          language,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      soundManager.playSuccessChime();
      onScenarioCreated(data);
      onClose();
    } catch (err: any) {
      console.error(err);
      soundManager.playFailureGlitch();
      setError(
        isAr
          ? "تعذر توليد السيناريو عبر الذكاء الاصطناعي. تأكد من تفعيل مفتاح GEMINI_API_KEY وحاول مرة أخرى."
          : "Failed to generate scenario via AI. Please check server logs and try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const categories = [
    { id: "security", label: isAr ? "أمن سيبراني واختراقات" : "Cybersecurity & Exploits" },
    { id: "infra", label: isAr ? "بنية تحتية وسقوط خوادم" : "Infrastructure & Server Outages" },
    { id: "data-breach", label: isAr ? "تسريب بيانات وقواعد بيانات" : "Data Breach & Exfiltration" },
    { id: "cascade", label: isAr ? "انهيار تسلسلي (Cascading Failure)" : "Cascading Microservices Collapse" },
    { id: "cloud", label: isAr ? "تسريب مفاتيح وسحابية (Cloud/IAM)" : "Cloud IAM & Container Injection" },
  ];

  const presetsTopics = [
    isAr ? "هجوم فدية وتشفير قواعد بيانات الإنتاج" : "Ransomware encrypting production databases",
    isAr ? "تسريب مفتاح AWS Root واستغلاله لتعدين العملات" : "Leaked AWS Root key used for crypto mining",
    isAr ? "انتهاء شهادة SSL/TLS على بوابة الدفع في يوم الذروة" : "Payment gateway SSL certificate expired during Black Friday",
    isAr ? "ثغرة Log4j / Zero-Day تؤدي إلى Remote Code Execution" : "Zero-Day Remote Code Execution on internal Kafka workers",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-800/80 text-purple-400">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {isAr ? "محرك توليد حوادث مخصصة بالذكاء الاصطناعي" : "AI Incident Generator"}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {isAr ? "مدعوم بنموذج Gemini 3.8 Flash لمحاكاة واقعية" : "Powered by Gemini 3.8 Flash LLM Engine"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playKeyTick();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
              {isAr ? "تصنيف الحادث الفني:" : "Incident Category:"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => {
                    soundManager.playKeyTick();
                    setCategory(c.id as IncidentCategory);
                  }}
                  className={`p-2 rounded-lg border text-xs font-mono text-left cursor-pointer transition-all ${
                    category === c.id
                      ? "bg-purple-950/60 border-purple-500 text-purple-200"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
              {isAr ? "مستوى الخطورة (Severity):" : "Severity Level:"}
            </label>
            <div className="flex items-center gap-2 font-mono text-xs">
              {(["Sev-1", "Sev-2", "Sev-3"] as const).map((sev) => (
                <button
                  type="button"
                  key={sev}
                  onClick={() => {
                    soundManager.playKeyTick();
                    setSeverity(sev);
                  }}
                  className={`flex-1 py-1.5 rounded-lg border font-bold cursor-pointer transition-all ${
                    severity === sev
                      ? sev === "Sev-1"
                        ? "bg-rose-950/60 border-rose-500 text-rose-300"
                        : sev === "Sev-2"
                        ? "bg-amber-950/60 border-amber-500 text-amber-300"
                        : "bg-blue-950/60 border-blue-500 text-blue-300"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
              {isAr ? "البنية التقنية (Stack):" : "Architecture & Tech Stack:"}
            </label>
            <input
              type="text"
              value={stack}
              onChange={(e) => setStack(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
              placeholder="e.g. Kubernetes, Envoy, PostgreSQL, Kafka, Redis, AWS"
            />
          </div>

          {/* Custom Topic / Idea */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
              {isAr ? "فكرة مخصصة للحادث (اختياري):" : "Custom Scenario Idea / Trigger (Optional):"}
            </label>
            <textarea
              rows={2}
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
              placeholder={
                isAr
                  ? "مثال: هجوم هبوط مفاجئ على خوادم Redis يؤدي إلى قفل مجمع PostgreSQL..."
                  : "e.g. Out of memory spike on Redis causing database connection lockup..."
              }
            />

            {/* Topic Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {presetsTopics.map((pt, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setCustomTopic(pt)}
                  className="text-[10px] font-mono bg-slate-950 border border-slate-800/80 text-slate-400 hover:text-purple-300 hover:border-purple-900 px-2 py-0.5 rounded cursor-pointer transition-colors"
                >
                  + {pt}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-mono rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-5 py-2 text-xs font-mono font-bold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white flex items-center gap-2 shadow-lg shadow-purple-950/50 cursor-pointer transition-all"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>
                {isGenerating
                  ? isAr
                    ? "جاري توليد السيناريو عبر Gemini..."
                    : "Synthesizing Incident..."
                  : isAr
                  ? "توليد السيناريو وبدء المحاكاة"
                  : "Generate & Launch Simulator"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
