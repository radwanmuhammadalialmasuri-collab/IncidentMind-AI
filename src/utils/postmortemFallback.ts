import { PostMortemData, Scenario, ActionHistoryItem, SystemMetrics } from "../types/incident";

export function generateFallbackPostMortem(
  scenario: Scenario,
  history: ActionHistoryItem[],
  finalMetrics: SystemMetrics,
  totalMinutes: number,
  language: "ar" | "en"
): PostMortemData {
  const isAr = language === "ar";
  const duration = Math.max(3, totalMinutes || 14);

  // Calculate score based on history or metrics
  const actionsCount = history.length;
  const optimalCount = history.filter((h) => h.verdict === "optimal").length;
  const catastrophicCount = history.filter((h) => h.verdict === "catastrophic").length;

  let gradeScore = 82;
  if (actionsCount > 0) {
    gradeScore = Math.min(
      98,
      Math.max(45, 75 + optimalCount * 8 - catastrophicCount * 18)
    );
  } else {
    gradeScore = 88;
  }

  let grade: PostMortemData["grade"] = "B";
  if (gradeScore >= 92) grade = "A+";
  else if (gradeScore >= 85) grade = "A";
  else if (gradeScore >= 75) grade = "B";
  else if (gradeScore >= 60) grade = "C";
  else grade = "D";

  const totalCost = (duration * (finalMetrics.financialLossPerMinute || 2400)).toLocaleString();

  if (isAr) {
    const defaultExecutive = `في تاريخ ${new Date().toLocaleDateString("ar-EG")}، رصدت أنظمة المراقبة والإنذار المبكر حادثاً عالي الخطورة (${scenario.severity}) بعنوان "${scenario.title}". أدى الحادث إلى اضطراب فوري في بوابات الخدمة وارتفاع زمن الاستجابة ومعدل الأخطاء. باشر قائد الحادث (Incident Commander) وفريق SRE إجراءات الفرز والاحتواء التكتيكي، حيث تم تقليص نطاق الضرر (Blast Radius) واستعادة استقرار البنية التحتية خلال ${duration} دقيقة دون فقدان دائم للبيانات.`;

    const defaultRootCause =
      scenario.category === "security" || scenario.category === "data-breach"
        ? "استغلال ثغرة أمنية أو تسريب صلاحيات حساسة في ظل غياب سياسات الحجر التلقائي والجدران النارية التكيفية (Adaptive WAF)."
        : "تشبع الموارد الحساسة المشتركة (Connection Pool / CPU) وغياب قواطع الدوائر (Circuit Breakers) وتأخر تفعيل سياسات تفريغ الحمل (Load Shedding).";

    const defaultWhys = [
      {
        why: "لماذا بدأت بوابات الخدمة برفض طلبات المستخدمين وظهور أخطاء 502/504؟",
        answer: "بسبب استنزاف خيوط المعالجة في الحاويات وتشبع طوابير الانتظار عند البوابات الرئيسية.",
      },
      {
        why: "لماذا استُنزفت الموارد بهذه السرعة الفائقة؟",
        answer: "لأن النظام تعرض لسيل غير اعتيادي من الطلبات أو استعلامات بطيئة علقت داخل مجمع الاتصالات.",
      },
      {
        why: "لماذا لم تمنع جدران الحماية أو آليات التوسع التلقائي هذا الانهيار؟",
        answer: "كانت قواعد التوسع (Autoscaling) بطيئة الاستجابة مقارنة بحدة الهجوم/الضغط، مع غياب عزل الحزم المشبوهة عند الحافة.",
      },
      {
        why: "لماذا لم تكتشف بيئات الاختبار والفحص هذه الثغرة قبل النشر في الإنتاج؟",
        answer: "لم تكن اختبارات الفوضى (Chaos Engineering) واختبارات الإجهاد الأمني تغطي سيناريو الانهيار التسلسلي المتزامن.",
      },
      {
        why: "ما هو السبب الجذري الأساسي (Root Cause) الكامن في التصميم؟",
        answer: "الاعتماد على بنية معمارية تفتقر إلى حواجز الأمان المتدرجة (Defense in Depth) وغياب قواطع الدوائر الآلية الصارمة.",
      },
    ];

    const strengths = [
      "سرعة إعلان حالة الطوارئ وتشكيل غرفة العمليات (Incident Bridge) في أقل من دقيقتين.",
      "عزل نطاق الضرر وحماية قواعد البيانات الرئيسية من التلف أو الفقدان الدائم.",
      "التزام الفريق بمنهجية التحليل المبني على مقاييس القياس الحية (SRE Golden Signals) أثناء اتخاذ القرارات.",
    ];

    const mistakes = [
      "الاعتماد على بعض الإجراءات اليدوية التي استغرقت وقتاً كان يمكن اختصاره عبر نصوص الأتمتة (Runbooks Automation).",
      "تأخر تفعيل قواطع الدوائر في الثواني الأولى مما سمح بتراكم آلاف الطلبات في الذاكرة.",
      "الحاجة إلى تحسين إنذارات التنبؤ المبكر (Anomaly Detection) قبل وصول الموارد إلى 95% تشبع.",
    ];

    const actionItems = [
      {
        priority: "P0" as const,
        task: `تفعيل قواطع الدوائر (Circuit Breakers) وRate Limiting صارم على كافة نقاط النهاية المعنية بـ ${scenario.title}.`,
        owner: "فريق البنية التحتية و SRE",
      },
      {
        priority: "P1" as const,
        task: "أتمتة سيناريوهات الفرز والعزل (Automated Quarantine Runbooks) للتعامل الفوري مع أي هجمات مماثلة.",
        owner: "فريق الأمن السيبراني (SecOps)",
      },
      {
        priority: "P2" as const,
        task: "إجراء تمرين محاكاة كارثية فصلي (Quarterly Disaster Recovery GameDay) لاختبار استجابة الفريق.",
        owner: "فريق هندسة الموثوقية الأساسي",
      },
    ];

    const lessons = [
      "المرونة المعمارية (Resilience) لا تعني منع الأخطاء بالكامل، بل تعني القدرة على الفشل الآمن والسريع (Fail-Safe) دون إسقاط كامل النظام.",
      "كل مورد مشترك (مثل مجمع اتصالات قاعدة البيانات) يجب أن تحميه مهل زمنية صارمة (Timeouts) وتفريغ آلي للحمل الزائد.",
      "ثقافة التحليل دون لوم (Blameless Culture) تمنح المهندسين الشجاعة لاتخاذ قرارات حاسمة وسريعة أثناء الأزمات.",
    ];

    const markdown = `# تقرير ما بعد الحادث الرسمي (Incident Post-Mortem & RCA)
**الحادث:** ${scenario.title}  
**مستوى الخطورة:** ${scenario.severity} | **المدة:** ${duration} دقيقة | **التقييم:** ${grade} (${gradeScore}/100)  
**التاريخ:** ${new Date().toISOString()}  

---

## 1. الملخص التنفيذي (Executive Summary)
${defaultExecutive}

---

## 2. مصفوفة مقاييس SRE (Incident Scorecard)
- **زمن الاكتشاف (MTTD):** 1m 45s
- **زمن الإقرار (MTTA):** 40s
- **زمن التعافي (MTTR):** ${duration}m 15s
- **انتهاك SLA:** ${scenario.severity === "Sev-1" ? "نعم (ضمن هامش الأزمة)" : "لا"}
- **الخسارة التقديرية:** $${totalCost}
- **سلامة البيانات:** سليمة بالكامل (100% Intact)

---

## 3. تحليل السبب الجذري (Root Cause Analysis - 5 Whys)
**السبب الجذري الأساسي:** ${defaultRootCause}

${defaultWhys.map((w, i) => `### لماذا #${i + 1}: ${w.why}\n${w.answer}\n`).join("\n")}

---

## 4. نقاط القوة والأنماط المضادة
### نقاط القوة:
${strengths.map((s) => `- ${s}`).join("\n")}

### الأخطاء والأنماط المضادة:
${mistakes.map((m) => `- ${m}`).join("\n")}

---

## 5. خطة العمل الوقائية (Action Items)
| الأولوية | المهمة | المسؤول |
|---|---|---|
${actionItems.map((a) => `| ${a.priority} | ${a.task} | ${a.owner} |`).join("\n")}

---
*تم إنشاء هذا التقرير تلقائياً بواسطة محرك محاكاة الحوادث والأمن السيبراني SRE Incident Simulator.*
`;

    return {
      executiveSummary: defaultExecutive,
      rootCauseAnalysis: {
        primaryRootCause: defaultRootCause,
        fiveWhys: defaultWhys,
      },
      grade,
      gradeScore,
      incidentScorecard: {
        mttd: "1m 45s",
        mtta: "40s",
        mttr: `${duration}m 15s`,
        slaBreach: scenario.severity === "Sev-1",
        estimatedDowntimeCost: `$${totalCost}`,
        dataIntegrityStatus: "سليمة بالكامل (100% Intact)",
      },
      keyStrengths: strengths,
      criticalMistakesAndAntiPatterns: mistakes,
      actionItems,
      lessonsLearned: lessons,
      markdownReport: markdown,
    };
  } else {
    // English version
    const defaultExecutive = `On ${new Date().toLocaleDateString("en-US")}, production telemetry triggered a critical ${scenario.severity} incident: "${scenario.title}". The event caused gateway degradation and elevated error rates affecting customer traffic. The Incident Commander and SRE war room executed triage and containment directives, stabilizing system latency and error rates within ${duration} minutes with zero persistent data corruption.`;

    const defaultRootCause =
      "Lack of granular load shedding, cascading thread exhaustion in shared connection pools, and insufficient adaptive edge defense.";

    const defaultWhys = [
      {
        why: "Why did edge gateways start dropping requests with HTTP 502/504 errors?",
        answer: "Worker thread starvation caused connection queue overflow at ingress layers.",
      },
      {
        why: "Why were threads starved so rapidly?",
        answer: "Sudden anomalous request volume or stuck queries held open persistent database slots.",
      },
      {
        why: "Why didn't edge autoscaling mitigate the surge?",
        answer: "HPA scale-up latency was too slow to absorb the instant spike without edge rate limiting.",
      },
      {
        why: "Why wasn't this vulnerability caught in staging?",
        answer: "Staging environments lacked realistic chaos testing and cascading failure simulations.",
      },
      {
        why: "What is the underlying foundational root cause?",
        answer: "Architecture lacked multi-layered defense in depth and automated fail-fast circuit breakers.",
      },
    ];

    const strengths = [
      "Rapid war room assembly and pager acknowledgment in under 2 minutes.",
      "Effective blast radius containment preventing persistent database corruption.",
      "Decisions grounded in real-time telemetry and SRE Golden Signals.",
    ];

    const mistakes = [
      "Manual intervention was relied on where runbook automation should have executed.",
      "Circuit breakers were tripped late after queues had already formed.",
      "Anomaly detection thresholds should alert prior to 95% resource saturation.",
    ];

    const actionItems = [
      {
        priority: "P0" as const,
        task: `Enforce automated circuit breakers and strict rate limiting on endpoints related to ${scenario.title}.`,
        owner: "Infrastructure & SRE Team",
      },
      {
        priority: "P1" as const,
        task: "Automate incident quarantine runbooks via CloudWatch / Falco event bus.",
        owner: "SecOps Team",
      },
      {
        priority: "P2" as const,
        task: "Conduct quarterly disaster recovery chaos GameDays.",
        owner: "Reliability Engineering",
      },
    ];

    const lessons = [
      "Resilience is not merely adding more servers; it is the ability to fail gracefully without bringing down downstream services.",
      "Shared resource pools must always be protected with aggressive timeouts and bulkheads.",
      "A blameless post-mortem culture fosters rapid, transparent decision making under pressure.",
    ];

    const markdown = `# Official Incident Post-Mortem & RCA
**Incident:** ${scenario.title}  
**Severity:** ${scenario.severity} | **Duration:** ${duration} min | **Score:** ${grade} (${gradeScore}/100)  
**Date:** ${new Date().toISOString()}  

---

## 1. Executive Summary
${defaultExecutive}

---

## 2. SRE Scorecard
- **MTTD:** 1m 45s
- **MTTA:** 40s
- **MTTR:** ${duration}m 15s
- **SLA Breached:** ${scenario.severity === "Sev-1" ? "Yes" : "No"}
- **Estimated Downtime Cost:** $${totalCost}
- **Data Integrity:** Intact (100%)

---

## 3. Root Cause Analysis (5 Whys)
**Primary Root Cause:** ${defaultRootCause}

${defaultWhys.map((w, i) => `### Why #${i + 1}: ${w.why}\n${w.answer}\n`).join("\n")}

---

## 4. Key Strengths & Anti-Patterns
### Key Strengths:
${strengths.map((s) => `- ${s}`).join("\n")}

### Anti-Patterns Identified:
${mistakes.map((m) => `- ${m}`).join("\n")}

---

## 5. Preventative Action Items
| Priority | Task | Owner |
|---|---|---|
${actionItems.map((a) => `| ${a.priority} | ${a.task} | ${a.owner} |`).join("\n")}

---
*Generated by Interactive SRE Incident Response Simulator.*
`;

    return {
      executiveSummary: defaultExecutive,
      rootCauseAnalysis: {
        primaryRootCause: defaultRootCause,
        fiveWhys: defaultWhys,
      },
      grade,
      gradeScore,
      incidentScorecard: {
        mttd: "1m 45s",
        mtta: "40s",
        mttr: `${duration}m 15s`,
        slaBreach: scenario.severity === "Sev-1",
        estimatedDowntimeCost: `$${totalCost}`,
        dataIntegrityStatus: "Intact (100%)",
      },
      keyStrengths: strengths,
      criticalMistakesAndAntiPatterns: mistakes,
      actionItems,
      lessonsLearned: lessons,
      markdownReport: markdown,
    };
  }
}
