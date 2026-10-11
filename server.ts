import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper for calling Gemini safely with multi-model fallback and quota handling
async function callGeminiJson<T>(prompt: string, schema?: any, fallback?: T): Promise<T> {
  if (!apiKey) {
    if (fallback !== undefined) return fallback;
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  // Model fallback chain: try 3.8-flash, then flash-latest, then 3.1-flash-lite
  const modelsToTry = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

  for (const modelName of modelsToTry) {
    try {
      const config: any = {
        temperature: 0.7,
        responseMimeType: "application/json",
        systemInstruction:
          "You are the world's elite Site Reliability Engineering (SRE) & Principal Cybersecurity Incident Commander AI engine. You generate hyper-realistic, high-stakes infrastructure, cybersecurity, and distributed systems incident scenarios with accurate technical logs, metrics, realistic system consequences, and rigorous engineering feedback. Always respond with strict, valid JSON matching the requested structure.",
      };

      if (schema) {
        config.responseSchema = schema;
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config,
      });

      const text = response.text?.trim() || "";
      if (text) {
        return JSON.parse(text) as T;
      }
    } catch (err: any) {
      // If quota exhausted (429) or rate limited, gracefully try next model or fallback
      const isQuota =
        err?.status === "RESOURCE_EXHAUSTED" ||
        err?.message?.includes("quota") ||
        err?.message?.includes("429") ||
        err?.toString()?.includes("429");

      if (isQuota) {
        // Quota reached on this model; continue to next model in chain
        continue;
      }
      // Transient error; continue to next model
      continue;
    }
  }

  // If all models failed or quota is exceeded across models:
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error("Temporary rate limit reached; using built-in simulator engine.");
}

// 1. Generate Scenario Endpoint
app.post("/api/generate-scenario", async (req, res) => {
  try {
    const { category, severity, stack, language, customTopic } = req.body;
    const isArabic = language === "ar";

    const prompt = `
Create a deeply realistic and high-stakes Incident Response simulation scenario.
Details:
- Category: ${category || "Cybersecurity & Infrastructure Outage"}
- Severity: ${severity || "Sev-1"}
- Tech Stack: ${stack || "Kubernetes, PostgreSQL, Redis, Envoy Proxy, AWS EKS"}
- Custom Topic / Focus: ${customTopic || "Standard critical incident"}
- Output Language: ${isArabic ? "Arabic (اللغة العربية التقنية الاحترافية، مع مصطلحات تقنية دقيقة)" : "English"}

Required JSON fields:
{
  "id": "inc-" + random string,
  "title": "Short punchy incident title",
  "category": "${category}",
  "severity": "${severity}",
  "estimatedBlastRadius": "e.g. 85,000 active users affected, 4 regions degraded",
  "summary": "Detailed technical brief of what triggered the alert, pager symptoms, and system status",
  "initialLogs": [
    {"timestamp": "2026-10-11T13:00:01Z", "level": "CRIT|ERROR|WARN|INFO", "source": "e.g. nginx-ingress / k8s-worker-02 / pgbouncer", "message": "authentic log line"}
  ],
  "initialMetrics": {
    "cpuPercent": 88,
    "memoryPercent": 92,
    "errorRatePercent": 42.5,
    "latencyP99Ms": 4800,
    "dbConnectionsActive": 980,
    "dbConnectionsMax": 1000,
    "financialLossPerMinute": 1450,
    "reputationScore": 65
  },
  "topologyNodes": [
    {"id": "cdn", "name": "Cloudflare Edge CDN", "status": "degraded|healthy|failing", "type": "gateway", "metric": "502 Rate: 41%"},
    {"id": "ingress", "name": "Ingress Controller (Envoy)", "status": "failing", "type": "network", "metric": "CPU 94%"},
    {"id": "api", "name": "Core API Pods (k8s)", "status": "degraded", "type": "compute", "metric": "OOMKilled x14"},
    {"id": "auth", "name": "Auth Service", "status": "healthy", "type": "auth", "metric": "Lat: 45ms"},
    {"id": "db", "name": "Primary PostgreSQL Cluster", "status": "failing", "type": "database", "metric": "Pool Maxed 99%"},
    {"id": "redis", "name": "Redis Cache Cluster", "status": "degraded", "type": "cache", "metric": "Eviction Spike"}
  ],
  "phases": [
    {
      "phaseIndex": 1,
      "phaseName": "${isArabic ? "المرحلة 1: الفرز والتشخيص الأولي (Triage)" : "Phase 1: Triage & Initial Assessment"}",
      "description": "Situation description at this phase with immediate choices",
      "options": [
        {
          "id": "opt-1",
          "title": "Action title",
          "description": "Concrete technical action to execute",
          "risk": "Low | Medium | High",
          "command": "terminal command example"
        },
        {
          "id": "opt-2",
          "title": "Action title",
          "description": "Concrete technical action to execute",
          "risk": "Low | Medium | High",
          "command": "terminal command example"
        },
        {
          "id": "opt-3",
          "title": "Action title",
          "description": "Concrete technical action to execute",
          "risk": "Low | Medium | High",
          "command": "terminal command example"
        }
      ]
    }
  ]
}
Return only JSON.`;

    const fallbackScenario = {
      id: "inc-" + Date.now().toString(36),
      title: customTopic || (isArabic ? `حادث طوارئ: ${category}` : `Incident: ${category}`),
      category: category || "security",
      severity: severity || "Sev-1",
      estimatedBlastRadius: isArabic ? "أكثر من 85,000 مستخدم نشط" : "85,000+ active users impacted",
      summary: isArabic
        ? `تنبيه عالي الخطورة: رصد اضطراب فوري في خوادم ${stack || "Kubernetes"} وارتفاع استهلاك الموارد إلى مستويات حرجة وتزايد أخطاء الخادم 5xx.`
        : `High-priority alert: Service degradation detected on ${stack || "Kubernetes"} cluster with elevated 5xx error rate and resource saturation.`,
      initialLogs: [
        {
          timestamp: new Date().toISOString(),
          level: "CRIT",
          source: "cluster-controller",
          message: "Worker pool saturation: connections throttling, request latency breached p99 SLA.",
        },
        {
          timestamp: new Date().toISOString(),
          level: "ERROR",
          source: "ingress-gateway",
          message: "Upstream connect failure: 502 Bad Gateway rate surged by +420%.",
        },
      ],
      initialMetrics: {
        cpuPercent: 88,
        memoryPercent: 84,
        errorRatePercent: 44.2,
        latencyP99Ms: 4600,
        dbConnectionsActive: 780,
        dbConnectionsMax: 800,
        financialLossPerMinute: 2200,
        reputationScore: 58,
      },
      topologyNodes: [
        { id: "cdn", name: "Edge CDN & WAF", status: "degraded", type: "gateway", metric: "Traffic surge" },
        { id: "ingress", name: "Ingress Controller", status: "failing", type: "network", metric: "502 Errors" },
        { id: "api", name: "Core API Pods", status: "failing", type: "compute", metric: "OOM Alerts" },
        { id: "db", name: "Database Cluster", status: "degraded", type: "database", metric: "Pool 97%" },
      ],
      phases: [
        {
          phaseIndex: 1,
          phaseName: isArabic ? "المرحلة 1: الفرز والاحتواء التكتيكي" : "Phase 1: Triage & Tactical Containment",
          description: isArabic
            ? "الخدمات تواجه ضغطاً هائلاً وتراكم طوابير الانتظار. ما هو قرارك الاحترازي الفوري لعزل الضرر؟"
            : "Traffic backlog is overwhelming core services. What is your immediate containment decision?",
          options: [
            {
              id: "opt-1",
              title: isArabic ? "تفعيل قواطع الدوائر (Circuit Breakers) وتحديد معدل الطلبات Rate Limiting" : "Trip Circuit Breakers & tighten edge rate limiting",
              description: isArabic ? "فرض حدود فورية على الحافة لمنع سقوط خوادم الخلفية واستقرار الموارد." : "Enforce strict edge rate limiting to shed excess load.",
              risk: "Low",
              command: "kubectl apply -f rate-limit-tight.yaml",
              expectedTradeoff: isArabic ? "تخفيف الحمل الفوري بنسبة 80%." : "Mitigates 80% of excess load immediately.",
            },
            {
              id: "opt-2",
              title: isArabic ? "توسيع عدد الحاويات (Horizontal Pod Autoscaler HPA) فوراً" : "Scale out pod replicas across cluster",
              description: isArabic ? "محاولة استيعاب الضغط بزيادة الموارد والحاويات." : "Attempt to absorb load by scaling replicas.",
              risk: "Medium",
              command: "kubectl scale deployment core-api --replicas=50",
              expectedTradeoff: isArabic ? "قد يستنزف الذاكرة ومجمع اتصالات قاعدة البيانات." : "May exhaust database connection pool.",
            },
          ],
        },
      ],
    };

    try {
      const result = await Promise.race([
        callGeminiJson(prompt, undefined, fallbackScenario),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000)),
      ]);
      res.json(result || fallbackScenario);
    } catch {
      res.json(fallbackScenario);
    }
  } catch (error: any) {
    console.error("Scenario generation error:", error);
    res.json({
      id: "inc-fallback",
      title: "Production Emergency Incident",
      category: "security",
      severity: "Sev-1",
      estimatedBlastRadius: "85,000+ users affected",
      summary: "System degradation detected on core services.",
      initialLogs: [],
      initialMetrics: {
        cpuPercent: 85,
        memoryPercent: 80,
        errorRatePercent: 40,
        latencyP99Ms: 4000,
        dbConnectionsActive: 700,
        dbConnectionsMax: 800,
        financialLossPerMinute: 2000,
        reputationScore: 60,
      },
      topologyNodes: [],
      phases: [],
    });
  }
});

// 2. Evaluate Decision Endpoint
app.post("/api/evaluate-decision", async (req, res) => {
  try {
    const {
      scenarioTitle,
      category,
      severity,
      phaseIndex,
      actionTaken,
      currentMetrics,
      actionHistory,
      language,
    } = req.body;
    const isArabic = language === "ar";

    const prompt = `
You are the Incident Commander reviewing a live action taken during an ongoing production emergency.
Context:
- Incident: ${scenarioTitle} (${category}, ${severity})
- Phase: ${phaseIndex}
- Action Performed by Engineer: "${actionTaken}"
- Current Metrics: ${JSON.stringify(currentMetrics || {})}
- Prior Actions Taken: ${JSON.stringify(actionHistory || [])}
- Language: ${isArabic ? "Arabic (اللغة العربية مع الحفاظ على مصطلحات التقنية الإنجليزية عند الحاجة)" : "English"}

Analyze the technical soundness of this action.
Did it fix the problem, mitigate symptoms, cause dangerous side effects, or make the outage worse?
Provide realistic simulated consequences, updated metrics, and terminal logs.

Respond with valid JSON:
{
  "verdict": "optimal" | "acceptable" | "suboptimal" | "catastrophic",
  "scoreDelta": number between -30 and +35,
  "analysis": "2-3 paragraphs of rigorous SRE/Security analysis of why this was good/bad, what actually happened under the hood, and real-world implications",
  "immediateOutcome": "Short 1-sentence tactical outcome",
  "updatedMetrics": {
    "cpuPercent": number (0-100),
    "memoryPercent": number (0-100),
    "errorRatePercent": number (0-100),
    "latencyP99Ms": number,
    "dbConnectionsActive": number,
    "financialLossPerMinute": number,
    "reputationScore": number (0-100)
  },
  "newLogs": [
    {"timestamp": "2026-10-11T13:05:00Z", "level": "INFO|WARN|ERROR|CRIT", "source": "component", "message": "log line"}
  ],
  "teamReactions": [
    {"author": "Sarah (SRE Lead)", "role": "sre", "message": "team feedback"},
    {"author": "Alex (SecOps)", "role": "secops", "message": "security comment"}
  ],
  "isIncidentResolved": boolean,
  "nextPhase": {
    "phaseIndex": ${phaseIndex + 1},
    "phaseName": "Name of next phase (e.g. Containment / Recovery / Verification)",
    "description": "What new complications arose or what needs to be solved next",
    "options": [
      {
        "id": "opt-a",
        "title": "Option title",
        "description": "Action description",
        "risk": "Low | Medium | High",
        "command": "cmd"
      },
      {
        "id": "opt-b",
        "title": "Option title",
        "description": "Action description",
        "risk": "Low | Medium | High",
        "command": "cmd"
      },
      {
        "id": "opt-c",
        "title": "Option title",
        "description": "Action description",
        "risk": "Low | Medium | High",
        "command": "cmd"
      }
    ]
  } // if isIncidentResolved is false; if true, nextPhase can be null
}
`;

    const fallbackEvaluation = {
      verdict: "acceptable",
      scoreDelta: 16,
      analysis: isArabic
        ? "أظهرت التحليلات التكتيكية أن هذا الإجراء ساهم في كبح انتشار الحادث وعزل المكونات المتأثرة. انخفضت معدلات أخطاء 5xx وبدأت طوابير المعالجة بالتحسن تدريجياً."
        : "Tactical analysis indicates this decision helped contain the blast radius and isolate degraded components. Error rates decreased and processing latency is stabilizing.",
      immediateOutcome: isArabic
        ? "تم تقليل الضغط على السيرفرات بنسبة 55% وانخفاض معدل الأخطاء."
        : "Reduced load by 55%, error rates stabilizing.",
      updatedMetrics: {
        cpuPercent: Math.max(25, (currentMetrics?.cpuPercent || 85) - 20),
        memoryPercent: Math.max(30, (currentMetrics?.memoryPercent || 80) - 15),
        errorRatePercent: Math.max(2, (currentMetrics?.errorRatePercent || 40) - 30),
        latencyP99Ms: Math.max(400, (currentMetrics?.latencyP99Ms || 4000) - 2500),
        dbConnectionsActive: Math.max(150, (currentMetrics?.dbConnectionsActive || 700) - 200),
        financialLossPerMinute: Math.max(100, (currentMetrics?.financialLossPerMinute || 2000) - 1200),
        reputationScore: Math.min(95, (currentMetrics?.reputationScore || 50) + 12),
      },
      newLogs: [
        {
          timestamp: new Date().toISOString(),
          level: "INFO",
          source: "incident-commander",
          message: `Directive executed successfully: ${actionTaken.substring(0, 50)}...`,
        },
      ],
      teamReactions: [
        {
          author: "Sarah (SRE Lead)",
          role: "sre",
          message: isArabic
            ? "المؤشرات استجابت بشكل ممتاز! بدأ انخفاض أخطاء البوابات."
            : "Telemetry responded positively! Ingress error rate dropped.",
        },
      ],
      isIncidentResolved: phaseIndex >= 2,
    };

    try {
      const result = await Promise.race([
        callGeminiJson(prompt, undefined, fallbackEvaluation),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000)),
      ]);
      res.json(result || fallbackEvaluation);
    } catch {
      res.json(fallbackEvaluation);
    }
  } catch (error: any) {
    console.error("Decision evaluation error:", error);
    res.json({
      verdict: "acceptable",
      scoreDelta: 10,
      analysis: "Decision applied on cluster.",
      immediateOutcome: "System metrics updated.",
      updatedMetrics: {},
      newLogs: [],
      teamReactions: [],
      isIncidentResolved: true,
    });
  }
});

// 3. Generate Post-Mortem Endpoint
app.post("/api/generate-postmortem", async (req, res) => {
  const { scenario, history, finalMetrics, totalMinutes, language } = req.body;
  const isArabic = language === "ar";
  const duration = Math.max(3, totalMinutes || 12);
  const title = scenario?.title || (isArabic ? "حادث إنتاجي عالي الخطورة" : "Production Incident");
  const sev = scenario?.severity || "Sev-1";
  const lossRate = finalMetrics?.financialLossPerMinute || 2400;
  const totalCost = `$${(duration * lossRate).toLocaleString()}`;

  // Server-side baseline fallback data tailored to the scenario
  const fallbackPostMortem = {
    executiveSummary: isArabic
      ? `في تاريخ ${new Date().toLocaleDateString("ar-EG")}، رصدت أنظمة المراقبة (Datadog/PagerDuty) حادثاً عالي الخطورة (${sev}) بعنوان "${title}". أدى الحادث لاضطراب فوري في بوابات الخدمة وارتفاع معدل الأخطاء. باشر فريق SRE وقائد الحادث إجراءات الفرز والاحتواء التكتيكي، حيث تم تقليص نطاق الضرر واستعادة استقرار البنية التحتية خلال ${duration} دقيقة دون فقدان دائم للبيانات.`
      : `On ${new Date().toLocaleDateString("en-US")}, production telemetry alerted on a critical ${sev} incident: "${title}". The event caused gateway degradation and elevated error rates. The Incident Commander and SRE team executed rapid triage and containment, successfully stabilizing latency and services within ${duration} minutes.`,
    rootCauseAnalysis: {
      primaryRootCause: isArabic
        ? "تشبع الموارد الحساسة المشتركة (Connection Pool / CPU) وغياب قواطع الدوائر (Circuit Breakers) وتأخر تفعيل سياسات تفريغ الحمل (Load Shedding)."
        : "Thread starvation across shared resources and missing automated circuit breaker fail-safes.",
      fiveWhys: isArabic
        ? [
            {
              why: "لماذا بدأت بوابات الخدمة برفض طلبات المستخدمين وظهور أخطاء 502/504؟",
              answer: "بسبب استنزاف خيوط المعالجة وتشبع طوابير الانتظار عند البوابات الرئيسية.",
            },
            {
              why: "لماذا استُنزفت الموارد بهذه السرعة الفائقة؟",
              answer: "لأن النظام تعرض لسيل غير اعتيادي من الطلبات أو استعلامات بطيئة علقت داخل مجمع الاتصالات.",
            },
            {
              why: "لماذا لم تمنع جدران الحماية أو آليات التوسع التلقائي هذا الانهيار؟",
              answer: "كانت قواعد التوسع (Autoscaling) بطيئة مقارنة بحدة الضغط، مع غياب عزل الحزم المشبوهة عند الحافة.",
            },
            {
              why: "لماذا لم تكتشف بيئات الاختبار هذه الثغرة قبل النشر في الإنتاج؟",
              answer: "عدم تغطية اختبارات الفوضى (Chaos Engineering) لسيناريو الانهيار المتزامن تحت الحمل الأقصى.",
            },
            {
              why: "ما هو السبب الجذري الأساسي في التصميم؟",
              answer: "الاعتماد على بنية معمارية تفتقر إلى حواجز الأمان المتدرجة (Defense in Depth) وغياب قواطع الدوائر الآلية الصارمة.",
            },
          ]
        : [
            {
              why: "Why did edge gateways begin returning HTTP 502/504 errors?",
              answer: "Worker thread exhaustion caused queue overflow at ingress layers.",
            },
            {
              why: "Why were resources exhausted so quickly?",
              answer: "Sudden anomalous request flood or stuck queries held open persistent connection slots.",
            },
            {
              why: "Why didn't edge autoscaling mitigate the surge?",
              answer: "Scale-up latency was too slow to absorb the instant spike without edge rate limiting.",
            },
            {
              why: "Why wasn't this caught in staging?",
              answer: "Staging lacked chaos testing for cascading failure under maximum concurrency.",
            },
            {
              why: "What is the foundational root cause?",
              answer: "Architecture lacked multi-layered defense in depth and automated fail-fast circuit breakers.",
            },
          ],
    },
    grade: "A-",
    gradeScore: 88,
    incidentScorecard: {
      mttd: "1m 45s",
      mtta: "40s",
      mttr: `${duration}m 20s`,
      slaBreach: sev === "Sev-1",
      estimatedDowntimeCost: totalCost,
      dataIntegrityStatus: isArabic ? "سليمة بالكامل (100% Intact)" : "Intact (100%)",
    },
    keyStrengths: isArabic
      ? [
          "سرعة إعلان حالة الطوارئ وتشكيل غرفة العمليات (Incident Bridge) في أقل من دقيقتين.",
          "عزل نطاق الضرر وحماية قواعد البيانات الرئيسية من التلف أو الفقدان الدائم.",
          "التزام الفريق بمنهجية التحليل المبني على مقاييس القياس الحية (SRE Golden Signals) أثناء اتخاذ القرارات.",
        ]
      : [
          "Rapid war room assembly and pager acknowledgment in under 2 minutes.",
          "Effective blast radius containment preventing persistent data corruption.",
          "Decisions grounded in real-time telemetry and SRE Golden Signals.",
        ],
    criticalMistakesAndAntiPatterns: isArabic
      ? [
          "الاعتماد على بعض الإجراءات اليدوية التي استغرقت وقتاً كان يمكن اختصاره عبر نصوص الأتمتة (Runbooks Automation).",
          "تأخر تفعيل قواطع الدوائر في الثواني الأولى مما سمح بتراكم آلاف الطلبات في الذاكرة.",
          "الحاجة إلى تحسين إنذارات التنبؤ المبكر (Anomaly Detection) قبل وصول الموارد إلى 95% تشبع.",
        ]
      : [
          "Manual intervention was relied on where runbook automation should have executed.",
          "Circuit breakers were tripped late after queues had already formed.",
          "Anomaly detection thresholds should alert prior to 95% resource saturation.",
        ],
    actionItems: isArabic
      ? [
          {
            priority: "P0",
            task: `تفعيل قواطع الدوائر (Circuit Breakers) وRate Limiting صارم على نقاط النهاية المرتبطة بـ ${title}.`,
            owner: "فريق البنية التحتية و SRE",
          },
          {
            priority: "P1",
            task: "أتمتة سيناريوهات الفرز والعزل (Automated Quarantine Runbooks) للتعامل الفوري مع أي هجمات مماثلة.",
            owner: "فريق الأمن السيبراني (SecOps)",
          },
          {
            priority: "P2",
            task: "إجراء تمرين محاكاة كارثية فصلي (Quarterly Disaster Recovery GameDay) لاختبار استجابة الفريق.",
            owner: "فريق هندسة الموثوقية الأساسي",
          },
        ]
      : [
          {
            priority: "P0",
            task: `Enforce automated circuit breakers and strict rate limiting on endpoints related to ${title}.`,
            owner: "Infrastructure & SRE Team",
          },
          {
            priority: "P1",
            task: "Automate incident quarantine runbooks via CloudWatch / Falco event bus.",
            owner: "SecOps Team",
          },
          {
            priority: "P2",
            task: "Conduct quarterly disaster recovery chaos GameDays.",
            owner: "Reliability Engineering",
          },
        ],
    lessonsLearned: isArabic
      ? [
          "المرونة المعمارية (Resilience) لا تعني منع الأخطاء بالكامل، بل تعني القدرة على الفشل الآمن والسريع (Fail-Safe) دون إسقاط كامل النظام.",
          "كل مورد مشترك (مثل مجمع اتصالات قاعدة البيانات) يجب أن تحميه مهل زمنية صارمة (Timeouts) وتفريغ آلي للحمل الزائد.",
          "ثقافة التحليل دون لوم (Blameless Culture) تمنح المهندسين الشجاعة لاتخاذ قرارات حاسمة وسريعة أثناء الأزمات.",
        ]
      : [
          "Resilience is not merely adding more servers; it is the ability to fail gracefully without bringing down downstream services.",
          "Shared resource pools must always be protected with aggressive timeouts and bulkheads.",
          "A blameless post-mortem culture fosters rapid, transparent decision making under pressure.",
        ],
    markdownReport: isArabic
      ? `# تقرير ما بعد الحادث الرسمي (Incident Post-Mortem & RCA)\n**الحادث:** ${title}  \n**مستوى الخطورة:** ${sev} | **المدة:** ${duration} دقيقة  \n**الخسارة التقديرية:** ${totalCost}  \n\n## الملخص التنفيذي\nفي تاريخ ${new Date().toLocaleDateString("ar-EG")}، رصدت أنظمة المراقبة حادثاً عالي الخطورة (${sev}) بعنوان "${title}". تم احتواء الحادث بنجاح وتفعيل إجراءات العزل والتعافي دون فقدان دائم لبيانات الإنتاج.`
      : `# Official Incident Post-Mortem & RCA\n**Incident:** ${title}  \n**Severity:** ${sev} | **Duration:** ${duration} min  \n**Estimated Cost:** ${totalCost}\n\n## Executive Summary\nProduction telemetry alerted on a critical incident: "${title}". Successfully stabilized within ${duration} minutes.`,
  };

  try {
    const prompt = `
Generate a formal, publication-ready Root Cause Analysis (RCA) / Incident Post-Mortem.
Incident:
- Title: ${title}
- Severity: ${sev}
- Category: ${scenario?.category || "Infrastructure"}
- Duration: ${duration} minutes
- Final Metrics: ${JSON.stringify(finalMetrics || {})}
- Full Action Timeline: ${JSON.stringify(history || [])}
- Language: ${isArabic ? "Arabic (اللغة العربية الرسمية والتقنية للهندسة)" : "English"}

Return structured JSON matching standard post-mortem format with executiveSummary, rootCauseAnalysis (primaryRootCause, fiveWhys), grade, gradeScore, incidentScorecard (mttd, mtta, mttr, slaBreach, estimatedDowntimeCost, dataIntegrityStatus), keyStrengths, criticalMistakesAndAntiPatterns, actionItems, lessonsLearned, markdownReport.
`;

    // Try Gemini with timeout
    const result = await Promise.race([
      callGeminiJson(prompt, undefined, fallbackPostMortem),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000)),
    ]);

    res.json(result || fallbackPostMortem);
  } catch (error: any) {
    console.warn("Using fallback post-mortem due to:", error?.message || error);
    res.json(fallbackPostMortem);
  }
});

// 4. Interactive Terminal Command Execution (Simulated CLI)
app.post("/api/simulate-terminal-command", async (req, res) => {
  try {
    const { command, currentContext, scenarioTitle } = req.body;
    const cmd = (command || "").trim();

    // Fast deterministic responses for standard CLI commands
    const lowerCmd = cmd.toLowerCase();

    if (cmd === "clear") {
      return res.json({ output: "" });
    }
    if (cmd === "whoami") {
      return res.json({ output: "root@incident-war-room-bastion:~# (Privileged Incident Commander)" });
    }
    if (cmd === "uname -a") {
      return res.json({ output: "Linux prod-k8s-master-01 5.15.0-89-generic #99-Ubuntu SMP x86_64 GNU/Linux" });
    }
    if (cmd === "date") {
      return res.json({ output: new Date().toUTCString() });
    }
    if (lowerCmd.includes("kubectl get pods")) {
      return res.json({
        output:
          "NAMESPACE     NAME                                   READY   STATUS             RESTARTS   AGE\n" +
          "ingress-nginx ingress-nginx-controller-6b459c-q4m2   0/1     CrashLoopBackOff   18         42m\n" +
          "production    api-core-deployment-78f9cd-w8v1        1/1     Running            0          4h\n" +
          "production    api-core-deployment-78f9cd-z5k9        0/1     OOMKilled          4          22m\n" +
          "production    auth-service-5c6978-mn92               1/1     Running            0          14h\n" +
          "production    payment-worker-8b4d8-px21              0/1     Error              8          50m\n" +
          "cache         redis-cluster-shard-0                  1/1     Running            0          3d",
        exitCode: 1,
        insight: "Multiple pods in CrashLoopBackOff and OOMKilled due to resource pressure.",
      });
    }
    if (lowerCmd.includes("kubectl top pods")) {
      return res.json({
        output:
          "NAME                                   CPU(cores)   MEMORY(bytes)\n" +
          "ingress-nginx-controller-6b459c-q4m2   3840m        1890Mi (94%)\n" +
          "api-core-deployment-78f9cd-w8v1        1920m        1420Mi (88%)\n" +
          "auth-service-5c6978-mn92               420m         320Mi (24%)\n" +
          "payment-worker-8b4d8-px21              1850m        2048Mi (100% OOM)",
        exitCode: 0,
        insight: "Worker nodes are suffering high CPU throttle and payment-worker hit OOM threshold.",
      });
    }
    if (lowerCmd.includes("netstat") || lowerCmd.includes("ss -tulpn")) {
      return res.json({
        output:
          "Active Internet connections (only servers)\n" +
          "Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name\n" +
          "tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN      1420/nginx: worker\n" +
          "tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      1420/nginx: worker\n" +
          "tcp    16384      0 127.0.0.1:5432          0.0.0.0:*               LISTEN      2819/postmaster (QUEUE FULL)\n" +
          "tcp        0      0 127.0.0.1:6379          0.0.0.0:*               LISTEN      910/redis-server",
        exitCode: 0,
        insight: "Port 5432 (PostgreSQL) has a saturated Recv-Q backlog.",
      });
    }
    if (lowerCmd.includes("tail") && lowerCmd.includes("nginx")) {
      return res.json({
        output:
          "2026/10/11 13:10:04 [error] 1422#1422: *491024 recv() failed (104: Connection reset by peer) while reading response header from upstream, client: 198.51.100.22, server: api.production.internal\n" +
          "2026/10/11 13:10:05 [error] 1422#1422: *491029 upstream timed out (110: Connection timed out) while connecting to upstream\n" +
          "2026/10/11 13:10:07 [alert] 1422#1422: 1024 worker_connections are not enough",
        exitCode: 0,
        insight: "Upstream timeouts and worker_connections exhaustion detected.",
      });
    }
    if (lowerCmd.includes("dmesg")) {
      return res.json({
        output:
          "[ 1482.910291] oom-kill:constraint=CONSTRAINT_MEMCG,nodemask=(null),cpuset=/,mems_allowed=0,oom_memcg=/kubepods/burstable/podapi,task_memcg=/kubepods/burstable/podapi,task=node,pid=8122\n" +
          "[ 1482.910340] Memory cgroup out of memory: Killed process 8122 (node) total-vm:2451000kB, anon-rss:2048000kB, file-rss:1200kB",
        exitCode: 0,
        insight: "Kernel Memory CGROUP invoked OOM-Killer on worker pod processes.",
      });
    }
    if (lowerCmd.includes("curl")) {
      return res.json({
        output:
          "* Connected to localhost (127.0.0.1) port 443\n" +
          "< HTTP/2 502 Bad Gateway\n" +
          "< content-type: text/html\n" +
          "< date: Sun, 11 Oct 2026 13:12:00 GMT\n" +
          "< server: envoy-proxy\n" +
          "<html><body><h1>502 Bad Gateway</h1><p>Upstream server failed to respond.</p></body></html>",
        exitCode: 0,
        insight: "Service endpoint returns HTTP 502 Bad Gateway.",
      });
    }
    if (lowerCmd.includes("ps aux") || lowerCmd.includes("top")) {
      return res.json({
        output:
          "USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\n" +
          "root         1  0.2  0.1 168924 12400 ?        Ss   11:00   0:04 /sbin/init\n" +
          "node      8122 96.4 88.2 4192000 3610000 ?     Rl   13:00   8:14 node /app/dist/server.js\n" +
          "postgres  2819 78.2 64.0 2891000 2410000 ?     Rs   12:30   6:50 postgres: prod db worker lock\n" +
          "nginx     1420 42.1 12.0  340000  120000 ?     S    11:00   2:10 nginx: worker process",
        exitCode: 0,
        insight: "Node and PostgreSQL worker processes dominating CPU at >75%.",
      });
    }
    if (lowerCmd.includes("free -m") || lowerCmd.includes("free")) {
      return res.json({
        output:
          "               total        used        free      shared  buff/cache   available\n" +
          "Mem:           16384       14920         312         240        1152         720\n" +
          "Swap:           4096        3980         116",
        exitCode: 0,
        insight: "Memory is critically saturated with only 720MB available; swap exhausted.",
      });
    }

    // Call Gemini for custom unique commands with resilient fallback
    const prompt = `
You are the Linux bash / Kubernetes / Cloud shell emulator on the bastion host during an incident:
Incident context: ${scenarioTitle || "Active outage"}
System State: ${JSON.stringify(currentContext || {})}
User entered command: "${cmd}"

Return the EXACT authentic command terminal output (stdout and/or stderr) that a Linux terminal, kubectl, AWS CLI, psql, or Docker CLI would produce in this real-world scenario.
Include ANSI color cues or realistic formatting if useful.
Keep it strictly technical and authentic.

Return JSON:
{
  "output": "Exact raw text terminal output",
  "exitCode": 0 or non-zero,
  "insight": "Short 1-sentence tip on what this revealed"
}
`;

    const result = await callGeminiJson(prompt, undefined, {
      output: `Executed on bastion: ${cmd}\nStatus: Command executed with return code 0.\n[Output captured in session buffer]`,
      exitCode: 0,
      insight: `Executed command '${cmd}'. Check system metrics and logs.`,
    });

    res.json(result);
  } catch (error: any) {
    console.error("Terminal simulation failed:", error);
    res.json({
      output: `bash: ${req.body.command || ""}: simulated command failed to execute.`,
      exitCode: 1,
    });
  }
});

// Mount Vite middleware in development or static in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = __dirname.endsWith("dist") ? __dirname : path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distDir, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Incident Response Simulator server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
