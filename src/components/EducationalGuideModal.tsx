import React from "react";
import { X, BookOpen, ShieldCheck, Zap, Activity, Users, FileText, CheckCircle2 } from "lucide-react";
import { soundManager } from "../utils/audio";

interface EducationalGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: "ar" | "en";
}

export const EducationalGuideModal: React.FC<EducationalGuideModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const isAr = language === "ar";
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {isAr ? "دليل قيادة الحوادث وأفضل ممارسات SRE" : "Incident Commander Handbook & SRE Standards"}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {isAr ? "معايير موثوقية الأنظمة من Google SRE و NIST و PagerDuty" : "Industry standards from Google SRE, NIST SP 800-61, and PagerDuty"}
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

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-300 font-sans text-xs sm:text-sm leading-relaxed">
          {/* Section 1: The Lifecycle */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-mono font-bold text-cyan-400 flex items-center gap-2 text-sm uppercase">
              <Activity className="w-4 h-4" />
              <span>{isAr ? "1. دورة حياة إدارة الحادث (Incident Lifecycle)" : "1. Incident Lifecycle"}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-rose-400 block mb-1">{isAr ? "1. التنبيه والفرز" : "1. Triage"}</strong>
                <p className="text-slate-400 font-sans text-[11px]">
                  {isAr ? "تحديد نطاق التأثير، درجة الخطورة، وتشكيل غرفة العمليات." : "Identify blast radius, assign severity, assemble war room."}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-amber-400 block mb-1">{isAr ? "2. الاحتواء السريع" : "2. Containment"}</strong>
                <p className="text-slate-400 font-sans text-[11px]">
                  {isAr ? "وقف النزيف (Stop bleeding) وتخفيف الحمل وعزل المكون المصاب." : "Mitigate symptoms, shed load, isolate affected nodes."}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-cyan-400 block mb-1">{isAr ? "3. استئصال العطل" : "3. Remediation"}</strong>
                <p className="text-slate-400 font-sans text-[11px]">
                  {isAr ? "معالجة الخلل الفعلي واستعادة الخدمات والتحقق من الاستقرار." : "Fix root flaw, roll back/forward, verify system health."}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <strong className="text-emerald-400 block mb-1">{isAr ? "4. تحليل RCA" : "4. Post-Mortem"}</strong>
                <p className="text-slate-400 font-sans text-[11px]">
                  {isAr ? "توثيق الدروس المستفادة والأسئلة الخمسة لمنع تكرار الحادث." : "Blameless 5 Whys, action items, and engineering guardrails."}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: The Golden Signals */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-mono font-bold text-amber-400 flex items-center gap-2 text-sm uppercase">
              <Zap className="w-4 h-4" />
              <span>{isAr ? "2. إشارات المراقبة الذهبية الأربعة (The 4 Golden Signals)" : "2. The 4 Golden Signals (Google SRE)"}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 font-mono">{isAr ? "زمن الاستجابة (Latency): " : "Latency: "}</strong>
                  <span>{isAr ? "الوقت المستغرق لتلبية الطلب، مع التركيز على مقياس p99 و p95." : "Time taken to serve a request. Focus on tail p99 latency."}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 font-mono">{isAr ? "معدل الأخطاء (Errors): " : "Errors: "}</strong>
                  <span>{isAr ? "نسبة الطلبات الفاشلة (5xx) أو الاستجابات غير الصحيحة." : "Rate of requests that fail explicitly (HTTP 500s or timeouts)."}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 font-mono">{isAr ? "حجم الحركة (Traffic): " : "Traffic: "}</strong>
                  <span>{isAr ? "الطلب الفعلي على النظام مقاساً بـ Requests/sec أو Network I/O." : "Demand placed on your system (req/sec or network bandwidth)."}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 font-mono">{isAr ? "التشبع (Saturation): " : "Saturation: "}</strong>
                  <span>{isAr ? "مدى امتلاء الموارد الأكثر تقييداً (مثل DB connection pool, CPU, RAM)." : "How full the most constrained system resources are."}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Blameless Post-Mortem */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <h4 className="font-mono font-bold text-emerald-400 flex items-center gap-2 text-sm uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>{isAr ? "3. ثقافة التحليل دون لوم (Blameless Post-Mortem)" : "3. Blameless Culture"}</span>
            </h4>
            <p className="text-slate-300">
              {isAr
                ? "في بيئات الهندسة البرمجية المتقدمة، يُفترض أن كل مهندس كان يتصرف بنية طيبة بناءً على المعلومات المتاحة له في تلك اللحظة. الفشل ليس خطأ الفرد، بل هو عجز النظام في توفير حواجز حماية (Guardrails) واختبارات مؤتمتة وتراجع آلي (Canary rollback)."
                : "Assume every engineer acted in good faith with the information available. If a human makes a mistake, the true failure is system design: lack of guardrails, insufficient automation, or fragile architectures."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
