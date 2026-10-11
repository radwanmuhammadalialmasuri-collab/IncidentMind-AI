import { Scenario } from "../types/incident";

export const PRESET_SCENARIOS_AR: Scenario[] = [
  {
    id: "sc-ddos-k8s",
    title: "هجوم حجب الخدمة الموزع (DDoS) وتشبع بوابات Kubernetes Ingress",
    category: "security",
    severity: "Sev-1",
    estimatedBlastRadius: "أكثر من 140,000 مستخدم نشط، تعطل 3 مناطق سحابية",
    summary:
      "تنبيه PagerDuty فوري: ارتفاع طلبات HTTP/2 Flood المجهولة بمعدل 480,000 طلب/ثانية موجهة لنقطة نهاية المصادقة /api/v1/auth/login. بوابات Ingress NGINX وموازن الأحمال AWS ALB وصلا إلى 100% CPU، وتراكم طابور الاتصالات مع ظهور أخطاء 502 Bad Gateway و504 Gateway Timeout للمستخدمين الفعليين.",
    architectureStack: "Kubernetes 1.29 (EKS), NGINX Ingress, AWS ALB, Cloudflare, Node.js API, Redis",
    initialLogs: [
      {
        id: "l1",
        timestamp: "2026-10-11 13:00:12",
        level: "CRIT",
        source: "ingress-controller-01",
        message: "Worker connections exhausted (16384/16384), refusing client connections from AS4134 ASN IP pools.",
      },
      {
        id: "l2",
        timestamp: "2026-10-11 13:00:18",
        level: "ERROR",
        source: "alb-health-check",
        message: "TargetGroup 'api-core-tg' unhealthy count (18/20 targets failed TCP handshake).",
      },
      {
        id: "l3",
        timestamp: "2026-10-11 13:00:25",
        level: "WARN",
        source: "datadog-monitor",
        message: "Anomaly detection: Incoming SYN packet rate increased by +3400% in 90 seconds.",
      },
      {
        id: "l4",
        timestamp: "2026-10-11 13:00:33",
        level: "CRIT",
        source: "k8s-kubelet-worker-4",
        message: "Node memory pressure: cgroup out of memory: Killed process 81220 (ingress-nginx) total-vm:4.2GB.",
      },
    ],
    initialMetrics: {
      cpuPercent: 96,
      memoryPercent: 91,
      errorRatePercent: 68.4,
      latencyP99Ms: 7200,
      dbConnectionsActive: 410,
      dbConnectionsMax: 800,
      financialLossPerMinute: 2400,
      reputationScore: 48,
    },
    topologyNodes: [
      { id: "cdn", name: "Cloudflare Edge WAF", status: "degraded", type: "gateway", metric: "Passed 480k rps" },
      { id: "alb", name: "AWS Application Load Balancer", status: "failing", type: "network", metric: "502 Rate: 71%" },
      { id: "ingress", name: "NGINX Ingress Pods", status: "failing", type: "compute", metric: "OOM CrashLoop" },
      { id: "auth", name: "Auth Microservice", status: "degraded", type: "compute", metric: "Queue: 45k pending" },
      { id: "db", name: "PostgreSQL Primary", status: "healthy", type: "database", metric: "Pool 51%" },
      { id: "redis", name: "Redis Session Store", status: "degraded", type: "cache", metric: "Hit rate: 12%" },
    ],
    phases: [
      {
        phaseIndex: 1,
        phaseName: "المرحلة 1: احتواء الهجوم وتخفيف الضغط الفوري (Triage & Containment)",
        description:
          "الهجوم يغرق بوابات الإدخال بالكامل. المستخدمون الحقيقيون لا يستطيعون تسجيل الدخول والتطبيق في حالة توقف فعلي. ما هو الإجراء التكتيكي الأول الذي تتخذه؟",
        options: [
          {
            id: "opt-1",
            title: "تفعيل Cloudflare 'Under Attack Mode' وتطبيق Rate Limiting على مسار /auth/login",
            description: "فرض تحدي JS Managed Challenge عند الحافة وتحديد 10 طلبات/دقيقة لكل عنوان IP على مسار المصادقة قبل وصولها للبوابات.",
            risk: "Low",
            command: "cloudflare-cli ruleset update --zone prod --mode under_attack --rate-limit '/api/v1/auth/*' 10/min",
            expectedTradeoff: "تخفيف الحمل الفوري بنسبة 85% مع احتمالية إزعاج طفيف لبعض المستخدمين بحل التحقق.",
          },
          {
            id: "opt-2",
            title: "زيادة حجم حاويات Ingress Pods مضاعفاً (Horizontal Pod Autoscaler HPA) إلى 100 كائن",
            description: "محاولة استيعاب سيل الطلبات عن طريق مضاعفة موارد الخوادم وتوسيع عقد Kubernetes فوراً.",
            risk: "High",
            command: "kubectl scale deployment ingress-nginx-controller --replicas=100 -n ingress-nginx",
            expectedTradeoff: "خطر استنزاف موارد العقد السحابية (Worker Nodes) وتضخم الفاتورة دون حل سيل الهجوم المتزايد.",
          },
          {
            id: "opt-3",
            title: "إيقاف مسار تسجيل الدخول تماماً وحظر كامل مجالات IP التابعة لدول آسيا وأوروبا عبر iptables",
            description: "حجب جغرافي صارم وإغلاق مسار الخدمة لوقف الضرر عن بقية النظام.",
            risk: "High",
            command: "iptables -A INPUT -p tcp --dport 443 -j DROP && nginx -s reload",
            expectedTradeoff: "قطع الخدمة عن عملاء شرعيين دوليين وتوقف وظيفة الأعمال الأساسية بالكامل.",
          },
        ],
      },
    ],
  },
  {
    id: "sc-sqli-breach",
    title: "محاولة اختراق قاعدة البيانات عبر حقن SQL وتسريب بيانات العملاء",
    category: "data-breach",
    severity: "Sev-1",
    estimatedBlastRadius: "بيانات 2.4 مليون عميل، جداول بطاقات الدفع وتجزئات كلمات المرور",
    summary:
      "كشف نظام كشف التسلل (IDS / SIEM) عن استعلامات مشبوهة غير اعتيادية تنفذ عبر نقطة النهاية العامة /api/reports/export. الاستعلامات تتضمن أشكال UNION SELECT واستخراج جداول schema_information وسجلات المستخدمين، مع خروج كميات بيانات ضخمة (Data Exfiltration) عبر منفذ خارجي.",
    architectureStack: "PostgreSQL 16, Spring Boot Core, PgBouncer, AWS RDS Multi-AZ, Falco Runtime IDS",
    initialLogs: [
      {
        id: "l1",
        timestamp: "2026-10-11 13:01:04",
        level: "CRIT",
        source: "rds-postgres-audit",
        message: "AUDIT: SELECT * FROM users UNION SELECT id, email, password_hash, salt, ssn FROM vault_users --",
      },
      {
        id: "l2",
        timestamp: "2026-10-11 13:01:10",
        level: "CRIT",
        source: "siem-crowdstrike",
        message: "ALERT: Outbound network flow: 4.8 GB transferred from 10.0.12.44 to unknown external IP 185.220.101.4",
      },
      {
        id: "l3",
        timestamp: "2026-10-11 13:01:21",
        level: "ERROR",
        source: "spring-report-svc",
        message: "SQL Injection filter bypass detected in dynamically constructed query inside CustomReportDao.java:142",
      },
      {
        id: "l4",
        timestamp: "2026-10-11 13:01:35",
        level: "WARN",
        source: "pgbouncer-pool",
        message: "Client pool saturation: 95 persistent connection held by report worker worker-proc-88.",
      },
    ],
    initialMetrics: {
      cpuPercent: 82,
      memoryPercent: 78,
      errorRatePercent: 14.2,
      latencyP99Ms: 3100,
      dbConnectionsActive: 740,
      dbConnectionsMax: 800,
      financialLossPerMinute: 5200,
      reputationScore: 32,
    },
    topologyNodes: [
      { id: "waf", name: "AWS WAF / CloudFront", status: "degraded", type: "gateway", metric: "Rule bypassed" },
      { id: "api", name: "Report Export Service", status: "failing", type: "compute", metric: "Compromised" },
      { id: "db", name: "RDS PostgreSQL Primary", status: "failing", type: "database", metric: "Exfiltration Active" },
      { id: "vault", name: "HashiCorp Vault", status: "healthy", type: "auth", metric: "Tokens active" },
      { id: "s3", name: "Data Lake Export S3", status: "degraded", type: "network", metric: "Egress Spike" },
    ],
    phases: [
      {
        phaseIndex: 1,
        phaseName: "المرحلة 1: عزل التسريب وتجميد قنوات الاتصال المشبوهة",
        description:
          "المهاجم يقوم بتفريغ بيانات حساسة في هذه اللحظة بالذات. كل ثانية إضافية تعني تسريب آلاف السجلات المشفرة وغير المشفرة. ما هو قرارك الفوري؟",
        options: [
          {
            id: "opt-1",
            title: "عزل حاوية Report Service، وتدوير بيانات اتصال قاعدة البيانات فوراً، وحظر IP المهاجم عند جدار الحماية WAF",
            description: "قطع اتصال الحاوية المصابة بشبكة VPC، وإنهاء الجلسات النشطة في PostgreSQL (pg_terminate_backend)، وتحديث كلمة مرور الاتصال.",
            risk: "Medium",
            command: "kubectl cordon & drain pod report-svc-78 && aws wafv2 update-ip-set --name BlockedAttackers && psql -c 'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE query ILIKE \"%vault_users%\";'",
            expectedTradeoff: "توقف مؤقت لخدمة تصدير التقارير، ولكن يوقف تسريب البيانات بنسبة 100% فورياً.",
          },
          {
            id: "opt-2",
            title: "إيقاف خادم قاعدة البيانات الرئيسي بالكامل (Shutdown RDS Instance)",
            description: "إجراء قاطع بإيقاف المحرك الأساسي لحماية البيانات من أي استعلام جديد.",
            risk: "High",
            command: "aws rds stop-db-instance --db-instance-identifier prod-postgres-primary",
            expectedTradeoff: "شلل تام لجميع خدمات الشركة والموقع وتوقف كافة المبيعات والعمليات.",
          },
          {
            id: "opt-3",
            title: "إرسال تصحيح برمجي عاجل (Hotfix) لكود Java لتنظيف المدخلات ثم إعادة النشر عبر CI/CD",
            description: "البدء بتعديل الكود البرمجي وإجراء commit وpush وانتظار اكتمال دورة البناء والنشر.",
            risk: "High",
            command: "git commit -m 'fix: sanitize sql input' && git push origin master",
            expectedTradeoff: "يستغرق من 15 إلى 25 دقيقة، وخلال هذا الوقت سيكون المهاجم قد سحب كامل قاعدة البيانات.",
          },
        ],
      },
    ],
  },
  {
    id: "sc-db-cascade",
    title: "استنزاف مجمع اتصالات قاعدة البيانات (Connection Pool) وتوقف المعاملات",
    category: "infra",
    severity: "Sev-1",
    estimatedBlastRadius: "جميع عمليات الشراء، الدفع، وتأكيد الطلبات متوقفة بالكامل",
    summary:
      "بسبب حملة تخفيضات غير متوقعة، نفدت كافة اتصالات PgBouncer ووصلت اتصالات PostgreSQL إلى الحد الأقصى (1000/1000). بدأ حدوث Deadlocks على جدول المخزون inventory_items، مما تسبب في تراكم آلاف الطلبات في طوابير الانتظار وحدوث انهيار تسلسلي (Cascading Collapse) أوقف الخوادم الخلفية.",
    architectureStack: "PostgreSQL Aurora, PgBouncer, Node.js Fastify, Redis Cluster, AWS SQS",
    initialLogs: [
      {
        id: "l1",
        timestamp: "2026-10-11 13:02:10",
        level: "CRIT",
        source: "pgbouncer-main",
        message: "FATAL: remaining connection slots are reserved for non-replication superuser connections (max_connections=1000)",
      },
      {
        id: "l2",
        timestamp: "2026-10-11 13:02:15",
        level: "ERROR",
        source: "checkout-service-node",
        message: "TimeoutError: Knex: Timeout acquiring a connection. The pool is probably full. pool.max=50, pool.used=50.",
      },
      {
        id: "l3",
        timestamp: "2026-10-11 13:02:22",
        level: "WARN",
        source: "postgres-engine",
        message: "LOG: process 41829 detected deadlock while waiting for ShareLock on transaction 91280381; cancelled by deadlock_timeout.",
      },
      {
        id: "l4",
        timestamp: "2026-10-11 13:02:30",
        level: "CRIT",
        source: "kubernetes-liveness-probe",
        message: "Liveness probe failed for api-checkout-679df (HTTP 500), restarting container...",
      },
    ],
    initialMetrics: {
      cpuPercent: 94,
      memoryPercent: 88,
      errorRatePercent: 89.1,
      latencyP99Ms: 12500,
      dbConnectionsActive: 1000,
      dbConnectionsMax: 1000,
      financialLossPerMinute: 7800,
      reputationScore: 40,
    },
    topologyNodes: [
      { id: "api", name: "Checkout API Pods", status: "failing", type: "compute", metric: "CrashLooping" },
      { id: "pgb", name: "PgBouncer Connection Pool", status: "failing", type: "network", metric: "100% Saturation" },
      { id: "db", name: "PostgreSQL Aurora Primary", status: "failing", type: "database", metric: "Deadlocks x84/sec" },
      { id: "redis", name: "Redis Cache", status: "healthy", type: "cache", metric: "Latency: 2ms" },
      { id: "sqs", name: "Checkout Message Queue", status: "degraded", type: "network", metric: "82k backlog" },
    ],
    phases: [
      {
        phaseIndex: 1,
        phaseName: "المرحلة 1: كسر الاختناق وحل الانسداد المتبادل (Deadlocks Mitigation)",
        description:
          "الخوادم تنهار وتعيد التشغيل باستمرار لأن قاعدة البيانات ترفض كل اتصال جديد، والطلبات القديمة العالقة ترفض التحرير. كيف تعيد الاستقرار الفوري للنظام؟",
        options: [
          {
            id: "opt-1",
            title: "تفعيل Circuit Breaker على واجهة الشراء، وإنهاء الاستعلامات العالقة التي تجاوزت 15 ثانية، وتفعيل طابور SQS غير المتزامن",
            description: "قطع السيل المباشر عن طريق إرجاع رسالة 'طلبك قيد المعالجة'، وإلغاء الاستعلامات المتجمدة (pg_cancel_backend)، وتحويل الكتابة إلى طابور رسائل.",
            risk: "Medium",
            command: "psql -c 'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state != \"idle\" AND query_start < now() - interval \"15 seconds\";' && redis-cli set flag:async_checkout true",
            expectedTradeoff: "تحرير فوري لمجمع الاتصالات واستعادة استجابة السيرفرات مع تأخير بسيط في معالجة إشعارات الشراء للعملاء.",
          },
          {
            id: "opt-2",
            title: "إعادة تشغيل خادم PostgreSQL الأساسي فوراً (Hard Restart)",
            description: "تنفيذ أمر restart لقاعدة البيانات لإنهاء جميع الاتصالات دفعة واحدة.",
            risk: "High",
            command: "systemctl restart postgresql.service",
            expectedTradeoff: "خطر تلف المعاملات غير المكتملة في الذاكرة وموجة Thundering Herd هائلة فور إقلاع السيرفر مجدداً.",
          },
          {
            id: "opt-3",
            title: "رفع حد max_connections في ملف postgresql.conf من 1000 إلى 5000 فوراً",
            description: "السماح لقاعدة البيانات باستقبال المزيد من الاتصالات لتلبية الطلب المرتفع.",
            risk: "High",
            command: "sed -i 's/max_connections = 1000/max_connections = 5000/' /etc/postgresql/postgresql.conf && systemctl reload postgresql",
            expectedTradeoff: "سيؤدي إلى استهلاك هائل للذاكرة (OOM) وسقوط نظام التشغيل بالكامل لأن كل اتصال يستهلك ذاكرة مستقلة.",
          },
        ],
      },
    ],
  },
  {
    id: "sc-iam-crypto",
    title: "تسريب مفاتيح AWS IAM ونشر حاويات تعدين العملات المشفرة",
    category: "cloud",
    severity: "Sev-2",
    estimatedBlastRadius: "حساب السحابة بالكامل، 48 خادم GPU يتم تشغيلها في مناطق غير مصرح بها، فاتورة متصاعدة",
    summary:
      "تنبيه Amazon GuardDuty عالي الخطورة: اكتشاف اتصال بخوادم تعدين Monero (Stratum Mining Protocol) صادر من مجموعة عقد Kubernetes. أظهرت سجلات AWS CloudTrail استخدام مفتاح Access Key تم تسريبه على مستودع GitHub عام لإنشاء خوادم EC2 p4d.24xlarge في مناطق eu-west-1 وap-southeast-1.",
    architectureStack: "AWS CloudTrail, GuardDuty, Kubernetes EKS, IAM, Terraform, GitHub Actions",
    initialLogs: [
      {
        id: "l1",
        timestamp: "2026-10-11 13:03:00",
        level: "CRIT",
        source: "aws-guardduty",
        message: "CryptoCurrency:EC2/BitcoinTool.B!DNS - Instance i-08ab349f querying known mining pool xmr.pool.minergate.com.",
      },
      {
        id: "l2",
        timestamp: "2026-10-11 13:03:12",
        level: "CRIT",
        source: "aws-cloudtrail",
        message: "RunInstances API called by AKIA24XJFK894P from Russian IP 94.142.138.9 - Created 12x p4d.24xlarge instances.",
      },
      {
        id: "l3",
        timestamp: "2026-10-11 13:03:25",
        level: "WARN",
        source: "aws-cost-anomaly",
        message: "Alert: Projected daily AWS spend spiked from $320 to $18,400.",
      },
      {
        id: "l4",
        timestamp: "2026-10-11 13:03:40",
        level: "ERROR",
        source: "falco-k8s-agent",
        message: "Falco rule 'Outbound Connection to Mining Pool' triggered in pod 'monitoring-agent-daemonset-f88a'.",
      },
    ],
    initialMetrics: {
      cpuPercent: 99,
      memoryPercent: 84,
      errorRatePercent: 8.5,
      latencyP99Ms: 1400,
      dbConnectionsActive: 120,
      dbConnectionsMax: 800,
      financialLossPerMinute: 620,
      reputationScore: 75,
    },
    topologyNodes: [
      { id: "iam", name: "AWS IAM Account Root/Keys", status: "failing", type: "auth", metric: "Compromised Key" },
      { id: "ec2", name: "Rogue Mining EC2s (Ireland & Tokyo)", status: "failing", type: "compute", metric: "12x p4d Running" },
      { id: "k8s", name: "Production EKS Cluster", status: "degraded", type: "compute", metric: "Compromised Pod" },
      { id: "trail", name: "CloudTrail & GuardDuty", status: "healthy", type: "network", metric: "Alerts firing" },
    ],
    phases: [
      {
        phaseIndex: 1,
        phaseName: "المرحلة 1: تجريد الصلاحيات ووقف الفاتورة المشتعلة",
        description:
          "المهاجم يمتلك مفاتيح سحابية بصلاحيات واسعة ويقوم بإنشاء موارد باهظة الثمن كل بضع دقائق. ما هو الإجراء الفوري الأول؟",
        options: [
          {
            id: "opt-1",
            title: "إلغاء تنشيط المفتاح المسرب فوراً، وتطبيق سياسة SCP طارئة لحظر تشغيل الحالات غير المصرح بها، وحذف الموارد الدخيلة",
            description: "تعطيل Access Key المسرب (aws iam update-access-key --status Inactive)، ووضع سياسة Deny All على المناطق الخارجية، وإنهاء حالات التعدين فورياً.",
            risk: "Low",
            command: "aws iam update-access-key --access-key-id AKIA24XJFK894P --status Inactive && aws ec2 terminate-instances --instance-ids $(aws ec2 describe-instances --query 'Reservations[*].Instances[*].InstanceId' --filters 'Name=instance-type,Values=p4d.*' --output text)",
            expectedTradeoff: "وقف الفاتورة فوراً وشل حركة المهاجم دون التأثير على البنية التحتية الإنتاجية السليمة.",
          },
          {
            id: "opt-2",
            title: "حظر عنوان IP المهاجم فقط عبر AWS Security Group",
            description: "إضافة IP المهاجم إلى قائمة الرفض في المجموعات الأمنية.",
            risk: "High",
            command: "aws ec2 authorize-security-group-ingress --cidr 94.142.138.9/32 --protocol all",
            expectedTradeoff: "غير فعال؛ فالمهاجم يستطيع تغيير عنوان IP في ثوانٍ أو استخدام بروكسي عبر مفاتيح API السحابية.",
          },
          {
            id: "opt-3",
            title: "حذف حساب AWS بالكامل وإعادة بنائه من البداية عبر Terraform",
            description: "إجراء جذري بحذف البيئة السحابية بالكامل.",
            risk: "High",
            command: "terraform destroy -auto-approve",
            expectedTradeoff: "تدمير كافة خدمات الشركة وقواعد البيانات والملفات والنسخ الاحتياطية بدون مبرر.",
          },
        ],
      },
    ],
  },
  {
    id: "sc-circuit-breaker",
    title: "انهيار قواطع الدوائر (Circuit Breakers) وسقوط الخدمات المصغرة",
    category: "cascade",
    severity: "Sev-1",
    estimatedBlastRadius: "توقف 18 خدمة مصغرة من أصل 22، توقف تدفق الرسائل في Kafka",
    summary:
      "تأخرت استجابة بوابة الدفع الخارجية Stripe، مما أدى لتراكم الطلبات في خدمة الدفع Payment Service. نظراً لعدم ضبط مهلة الانتظار (Timeout) وقاطع الدائرة بالشكل الصحيح، استنفدت خدمة الدفع خيوط المعالجة (Thread Pool)، وتسببت في اختناق خدمة الطلبات Order Service، ثم خدمة سلة التسوق Cart Service، إلى أن سقطت بوابات API بالكامل.",
    architectureStack: "Go Microservices, Envoy Proxy, gRPC, Apache Kafka, Kubernetes",
    initialLogs: [
      {
        id: "l1",
        timestamp: "2026-10-11 13:04:02",
        level: "CRIT",
        source: "envoy-gateway",
        message: "upstream connect error or disconnect/reset before headers. reset reason: connection failure, transport failure reason: delayed_connect_error: Connection timed out",
      },
      {
        id: "l2",
        timestamp: "2026-10-11 13:04:15",
        level: "ERROR",
        source: "payment-svc-go",
        message: "goroutine dump: 104,200 active goroutines waiting on external HTTP client call to api.stripe.com/v1/charges.",
      },
      {
        id: "l3",
        timestamp: "2026-10-11 13:04:22",
        level: "WARN",
        source: "kafka-broker-3",
        message: "Consumer lag on topic 'orders.created' reached 180,000 messages. Partition 2 under-replicated.",
      },
    ],
    initialMetrics: {
      cpuPercent: 91,
      memoryPercent: 89,
      errorRatePercent: 74.6,
      latencyP99Ms: 18000,
      dbConnectionsActive: 620,
      dbConnectionsMax: 800,
      financialLossPerMinute: 3900,
      reputationScore: 52,
    },
    topologyNodes: [
      { id: "gateway", name: "Envoy API Gateway", status: "failing", type: "gateway", metric: "504 Gateway Timeout" },
      { id: "cart", name: "Cart Service", status: "degraded", type: "compute", metric: "High latency" },
      { id: "order", name: "Order Processing Service", status: "failing", type: "compute", metric: "Thread Starvation" },
      { id: "pay", name: "Payment Service", status: "failing", type: "compute", metric: "Stripe Hang 60s" },
      { id: "kafka", name: "Kafka Event Bus", status: "degraded", type: "network", metric: "Lag: 180k msgs" },
    ],
    phases: [
      {
        phaseIndex: 1,
        phaseName: "المرحلة 1: تفعيل نمط التحمل السريع (Fast Failover & Isolation)",
        description:
          "الخدمات تنهار واحدة تلو الأخرى في تأثير الدومينو بسبب استدعاء معلق للطرف الثالث. كيف تقطع هذا التسلسل وتنقذ باقي النظام؟",
        options: [
          {
            id: "opt-1",
            title: "فرض فتح قاطع الدائرة فورياً (Trip Circuit Breaker) مع مهلة 3 ثوانٍ وتفعيل نظام الدفع المؤجل (Fallback Queue)",
            description: "تطبيق تحديث إعدادات Envoy فوراً لقطع الاتصال المباشر مع Stripe بعد 3 ثوان، وقبول الطلبات في طابور غير متزامن لمعالجتها لاحقاً.",
            risk: "Low",
            command: "kubectl apply -f envoy-circuit-breaker-tight.yaml && redis-cli set system:payment_mode fallback_async",
            expectedTradeoff: "استعادة فورية لكافة خدمات الموقع وتصفير أخطاء 504، مع إشعار العملاء بأن الدفع قيد التأكيد.",
          },
          {
            id: "opt-2",
            title: "إعادة تشغيل جميع الخدمات المصغرة دفعة واحدة عبر kubectl rollout restart",
            description: "إعادة تشغيل شاملة لكل البودات في العنقود.",
            risk: "High",
            command: "kubectl rollout restart deployment -n microservices",
            expectedTradeoff: "سيعود الانهيار فور إقلاعها لأن خدمة الدفع ستظل معلقة بانتظار Stripe وستغرق باقي الخدمات مجدداً.",
          },
          {
            id: "opt-3",
            title: "زيادة مهلة الاستجابة Timeout في بوابات Envoy إلى 120 ثانية",
            description: "إعطاء الطلبات مزيداً من الوقت للانتظار حتى تستجيب Stripe.",
            risk: "High",
            command: "kubectl patch virtualservice api-gateway --type merge -p '{\"spec\":{\"http\":[{\"timeout\":\"120s\"}]}}'",
            expectedTradeoff: "كارثة مؤكدة؛ ستتراكم مئات آلاف الخيوط في الذاكرة وتسقط البوابة بأكملها بسبب OOM في دقائق.",
          },
        ],
      },
    ],
  },
  {
    id: "sc-ransomware-vpc",
    title: "هجوم الفدية والتحرك الجانبي (Lateral Movement) في الشبكة الخاصة VPC",
    category: "security",
    severity: "Sev-1",
    estimatedBlastRadius: "نظام الملفات، خوادم قواعد البيانات، وخوادم التخزين السحابي NFS/EFS",
    summary:
      "تم اختراق خادم اختبار عبر منفذ SSH مكشوف وكلمة مرور ضعيفة. قام المهاجم بتنفيذ برنامج فدية وبدأ بالتحرك أفقياً عبر مفاتيح SSH غير المشفرة في الذاكرة لتشفير أنظمة التخزين المشتركة EFS وإنشاء ملفات HOW_TO_RECOVER_FILES.txt.",
    architectureStack: "Ubuntu Linux, AWS VPC, EFS Storage, Ansible, Wazuh SIEM, HashiCorp Vault",
    initialLogs: [
      {
        id: "l1",
        timestamp: "2026-10-11 13:05:10",
        level: "CRIT",
        source: "wazuh-agent-nfs",
        message: "High frequency file renaming detected: 4,200 files renamed to .locked in /mnt/shared_storage/ in 30 seconds.",
      },
      {
        id: "l2",
        timestamp: "2026-10-11 13:05:19",
        level: "CRIT",
        source: "sshd-staging-bastion",
        message: "Failed password attempts (1,290) followed by accepted publickey for ubuntu from Tor Exit Node 185.220.101.5",
      },
      {
        id: "l3",
        timestamp: "2026-10-11 13:05:32",
        level: "ERROR",
        source: "backup-daemon",
        message: "AWS Backup API request 'DeleteRecoveryPoint' attempted and denied by Vault WORM Lock (Compliance Mode).",
      },
    ],
    initialMetrics: {
      cpuPercent: 88,
      memoryPercent: 82,
      errorRatePercent: 45.0,
      latencyP99Ms: 4200,
      dbConnectionsActive: 280,
      dbConnectionsMax: 800,
      financialLossPerMinute: 4500,
      reputationScore: 25,
    },
    topologyNodes: [
      { id: "bastion", name: "Staging Bastion Host", status: "failing", type: "compute", metric: "Compromised Source" },
      { id: "efs", name: "AWS EFS Shared Storage", status: "failing", type: "database", metric: "Mass Encryption" },
      { id: "prod-vpc", name: "Production VPC Peering", status: "degraded", type: "network", metric: "Lateral Scan" },
      { id: "backup", name: "Immutable Backup Vault", status: "healthy", type: "network", metric: "WORM Protected" },
    ],
    phases: [
      {
        phaseIndex: 1,
        phaseName: "المرحلة 1: عزل الشبكة وتجميد مسار التحرك الجانبي (Air-gapping & Containment)",
        description:
          "المهاجم يتحرك عبر خوادم الشبكة السحابية ويقوم بتشفير البيانات في الزمن الفعلي. ما هو قرارك الاحترازي الأهم الآن؟",
        options: [
          {
            id: "opt-1",
            title: "عزل خادم Bastion عبر تعديل Security Group لـ 0.0.0.0/0، وتجميد مشاركة EFS، وفصل VPC Peering بين Staging و Production",
            description: "قطع كافة الروابط الشبكية بين بيئة الاختبار والإنتاج فوراً، وفصل نقاط تثبيت EFS لمنع استمرار التشفير.",
            risk: "Low",
            command: "aws ec2 modify-instance-attribute --instance-id i-bastion --groups sg-quarantine && aws ec2 delete-vpc-peering-connection --vpc-peering-connection-id pcx-staging-prod && aws efs put-file-system-policy --file-system-id fs-efs --policy file://readonly-policy.json",
            expectedTradeoff: "احتواء كامل للهجوم وحماية بيانات الإنتاج والنسخ الاحتياطية من التشفير فورياً.",
          },
          {
            id: "opt-2",
            title: "دفع الفدية فوراً للعنوان المذكور في ملف التشفير لاستعادة المفاتيح",
            description: "التواصل مع المهاجم عبر رابط Tor وتحويل عملات مشفرة لفك التشفير.",
            risk: "High",
            command: "curl -X POST https://ransom-payment-portal/pay",
            expectedTradeoff: "انتهاك قانوني صارم، لا ضمان لاستعادة المفاتيح، وتشجيع المهاجمين على استهداف المؤسسة مجدداً.",
          },
          {
            id: "opt-3",
            title: "محاولة تشغيل برنامج فك التشفير Antivirus على الخادم المخترق بينما هو متصل بالشبكة",
            description: "تثبيت ClamAV وتشغيل فحص كامل للقرص.",
            risk: "High",
            command: "apt-get install -y clamav && freshclam && clamscan -r /mnt",
            expectedTradeoff: "سيستمر برنامج الفدية في تشفير الملفات والتحرك للإنتاج أثناء عمل الفحص البطيء.",
          },
        ],
      },
    ],
  },
];

export const PRESET_SCENARIOS_EN: Scenario[] = PRESET_SCENARIOS_AR.map((s) => {
  if (s.id === "sc-ddos-k8s") {
    return {
      ...s,
      title: "Distributed Denial of Service (DDoS) & Kubernetes Ingress Saturation",
      estimatedBlastRadius: "140,000+ active users affected, 3 cloud regions degraded",
      summary:
        "Instant PagerDuty Sev-1: Sudden spike of 480,000 req/sec HTTP/2 flood targeting /api/v1/auth/login. NGINX Ingress and AWS ALB reached 100% CPU, connection backlog overflowing with 502/504 errors across global clients.",
      phases: [
        {
          phaseIndex: 1,
          phaseName: "Phase 1: Attack Containment & Immediate Load Shedding",
          description:
            "Incoming flood is overwhelming ingress gateways. Legitimate users are locked out and production is down. What is your first tactical decision?",
          options: [
            {
              id: "opt-1",
              title: "Enable Cloudflare 'Under Attack Mode' & Tighten Rate Limiting on /auth/login",
              description: "Enforce edge JS challenge and cap IP rate at 10 req/min for auth endpoints before traffic touches ingress controllers.",
              risk: "Low",
              command: "cloudflare-cli ruleset update --zone prod --mode under_attack --rate-limit '/api/v1/auth/*' 10/min",
              expectedTradeoff: "Mitigates 85% of attack volume at the edge with slight UX friction of brief captcha check.",
            },
            {
              id: "opt-2",
              title: "Scale Ingress Pods via HPA to 100 replicas immediately",
              description: "Attempt to absorb the flood by allocating more compute and expanding Kubernetes nodes.",
              risk: "High",
              command: "kubectl scale deployment ingress-nginx-controller --replicas=100 -n ingress-nginx",
              expectedTradeoff: "Risk of exhausting worker node memory and ballooning cloud bill without stopping the growing flood.",
            },
            {
              id: "opt-3",
              title: "Shut down auth endpoint and drop all incoming traffic on port 443 via iptables",
              description: "Total blackout firewall drop to prevent backend server damage.",
              risk: "High",
              command: "iptables -A INPUT -p tcp --dport 443 -j DROP",
              expectedTradeoff: "Takes down 100% of business operations for legitimate users.",
            },
          ],
        },
      ],
    };
  }
  if (s.id === "sc-sqli-breach") {
    return {
      ...s,
      title: "SQL Injection Attack & Production Data Exfiltration Attempt",
      estimatedBlastRadius: "2.4 million customer records, payment vaults, and password hashes at risk",
      summary:
        "SIEM / IDS Alert: Anomalous UNION SELECT queries executed against /api/reports/export. Attackers querying schema tables and user records with 4.8 GB outbound egress detected towards an unknown foreign IP.",
      phases: [
        {
          phaseIndex: 1,
          phaseName: "Phase 1: Breach Containment & Traffic Freezing",
          description:
            "Active data exfiltration is underway right now. Every second leaks sensitive customer records. What is your immediate containment decision?",
          options: [
            {
              id: "opt-1",
              title: "Quarantine Report Service pod, rotate DB credentials, and terminate active leak sessions",
              description: "Drain compromised pod, block attacker IP on WAF, and invoke pg_terminate_backend on unauthorized connections.",
              risk: "Medium",
              command: "kubectl cordon pod report-svc-78 && aws wafv2 update-ip-set --name BlockedAttackers && psql -c 'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE query ILIKE \"%vault_users%\";'",
              expectedTradeoff: "Temporarily disables reporting while halting data exfiltration immediately.",
            },
            {
              id: "opt-2",
              title: "Shutdown primary RDS instance completely",
              description: "Drastic kill-switch to stop all database queries instantly.",
              risk: "High",
              command: "aws rds stop-db-instance --db-instance-identifier prod-postgres-primary",
              expectedTradeoff: "Crashes the entire platform and all user transactions company-wide.",
            },
            {
              id: "opt-3",
              title: "Write a code hotfix, commit, and wait for CI/CD pipeline deployment",
              description: "Fix input sanitization in source code and wait for standard deployment cycle.",
              risk: "High",
              command: "git commit -m 'fix: sql sanitize' && git push origin master",
              expectedTradeoff: "Takes 15-25 minutes, during which the full database will be exfiltrated.",
            },
          ],
        },
      ],
    };
  }
  if (s.id === "sc-db-cascade") {
    return {
      ...s,
      title: "Database Connection Pool Exhaustion & Cascading Lock Outage",
      estimatedBlastRadius: "Checkout, payment authorization, and inventory reservation completely halted",
      summary:
        "Traffic surge exhausted all PgBouncer connections (1000/1000). Deadlocks on inventory tables triggered cascading thread starvation across checkout pods, leading to CrashLoopBackOff across microservices.",
      phases: [
        {
          phaseIndex: 1,
          phaseName: "Phase 1: Deadlock Mitigation & Pool Recovery",
          description:
            "Services are crashing because PostgreSQL rejects all new connections and old transactions are stuck. How do you restore stability?",
          options: [
            {
              id: "opt-1",
              title: "Trip Circuit Breaker on checkout, cancel stuck queries >15s, and switch to async SQS queue",
              description: "Cancel stuck transactions (pg_cancel_backend), enable asynchronous message queues, and return graceful accepted responses.",
              risk: "Medium",
              command: "psql -c 'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state != \"idle\" AND query_start < now() - interval \"15 seconds\";' && redis-cli set flag:async_checkout true",
              expectedTradeoff: "Instantly frees connection slots with slight delay in order processing notifications.",
            },
            {
              id: "opt-2",
              title: "Hard restart the primary PostgreSQL Aurora instance",
              description: "Reboot database engine to flush all sessions at once.",
              risk: "High",
              command: "systemctl restart postgresql.service",
              expectedTradeoff: "Risk of in-memory transaction loss and massive thundering herd upon boot.",
            },
            {
              id: "opt-3",
              title: "Increase max_connections to 5000 in postgresql.conf immediately",
              description: "Allow database to accept 5x more concurrent connections.",
              risk: "High",
              command: "sed -i 's/max_connections = 1000/max_connections = 5000/' /etc/postgresql/postgresql.conf && systemctl reload postgresql",
              expectedTradeoff: "Will trigger severe Out-Of-Memory (OOM) kernel panic as each connection consumes dedicated RAM.",
            },
          ],
        },
      ],
    };
  }
  if (s.id === "sc-iam-crypto") {
    return {
      ...s,
      title: "Compromised AWS IAM Credentials & Rogue Cryptomining Pods",
      estimatedBlastRadius: "Full cloud account, 48 GPU instances launched in unauthorized regions, ballooning bill",
      summary:
        "Amazon GuardDuty alert: Monero Stratum protocol communication detected from Kubernetes cluster. Leaked access keys found in public repository used to launch p4d.24xlarge GPU instances across Ireland and Tokyo.",
      phases: [
        {
          phaseIndex: 1,
          phaseName: "Phase 1: Revoke IAM Credentials & Terminate Rogue Workloads",
          description:
            "Attacker holds administrative credentials and is provisioning expensive instances every few minutes. What is your immediate action?",
          options: [
            {
              id: "opt-1",
              title: "Deactivate leaked IAM key immediately, attach emergency SCP quarantine policy, and terminate rogue instances",
              description: "Deactivate access key (aws iam update-access-key --status Inactive) and terminate mining instances.",
              risk: "Low",
              command: "aws iam update-access-key --access-key-id AKIA24XJFK894P --status Inactive && aws ec2 terminate-instances --instance-ids $(aws ec2 describe-instances --query 'Reservations[*].Instances[*].InstanceId' --filters 'Name=instance-type,Values=p4d.*' --output text)",
              expectedTradeoff: "Halts cost bleeding instantly and revokes attacker access without disrupting legitimate workloads.",
            },
            {
              id: "opt-2",
              title: "Block attacker IP address via AWS Security Group only",
              description: "Add attacker IP to inbound blacklist.",
              risk: "High",
              command: "aws ec2 authorize-security-group-ingress --cidr 94.142.138.9/32 --protocol all",
              expectedTradeoff: "Ineffective; attackers switch IPs within seconds or proxy calls via cloud APIs.",
            },
            {
              id: "opt-3",
              title: "Nuke AWS account and rebuild entire infrastructure via Terraform",
              description: "Complete destruction of cloud infrastructure.",
              risk: "High",
              command: "terraform destroy -auto-approve",
              expectedTradeoff: "Destroys all business data, databases, and production services without cause.",
            },
          ],
        },
      ],
    };
  }
  if (s.id === "sc-circuit-breaker") {
    return {
      ...s,
      title: "Cascading Circuit Breaker Collapse Across Core Microservices",
      estimatedBlastRadius: "18 out of 22 microservices failing, Kafka consumer backlog exceeding 180k messages",
      summary:
        "External payment gateway (Stripe) latency degraded to 60s timeout. Payment Service exhausted thread pools, causing cascading blockage in Order Service, Cart Service, and API Ingress.",
      phases: [
        {
          phaseIndex: 1,
          phaseName: "Phase 1: Fast Failover & Upstream Isolation",
          description:
            "Services are falling like dominoes due to a hanging third-party call. How do you sever the cascading failure?",
          options: [
            {
              id: "opt-1",
              title: "Trip Circuit Breaker with 3s timeout and route payments to asynchronous fallback queue",
              description: "Update Envoy configuration to fail fast after 3s and enqueue orders for background processing.",
              risk: "Low",
              command: "kubectl apply -f envoy-circuit-breaker-tight.yaml && redis-cli set system:payment_mode fallback_async",
              expectedTradeoff: "Restores platform responsiveness immediately with customers notified of asynchronous payment confirmation.",
            },
            {
              id: "opt-2",
              title: "Execute rolling restart across all microservices simultaneously",
              description: "Reboot all pods in microservices namespace.",
              risk: "High",
              command: "kubectl rollout restart deployment -n microservices",
              expectedTradeoff: "Collapse will immediately recur upon reboot as the underlying Stripe hang persists.",
            },
            {
              id: "opt-3",
              title: "Increase Envoy Gateway timeouts to 120 seconds",
              description: "Give requests more time to wait for Stripe responses.",
              risk: "High",
              command: "kubectl patch virtualservice api-gateway --type merge -p '{\"spec\":{\"http\":[{\"timeout\":\"120s\"}]}}'",
              expectedTradeoff: "Certain catastrophe; hundreds of thousands of threads will pool in memory causing total OOM crash.",
            },
          ],
        },
      ],
    };
  }
  if (s.id === "sc-ransomware-vpc") {
    return {
      ...s,
      title: "Ransomware Lateral Movement in VPC & Shared Storage Encryption",
      estimatedBlastRadius: "Shared EFS storage, staging databases, and internal NFS file clusters",
      summary:
        "Staging bastion compromised via exposed SSH port. Attacker deployed ransomware moving laterally across internal VPC, renaming files to .locked on AWS EFS shared volumes.",
      phases: [
        {
          phaseIndex: 1,
          phaseName: "Phase 1: Network Air-gapping & Lateral Containment",
          description:
            "Ransomware is encrypting network files in real time. What is your immediate containment decision?",
          options: [
            {
              id: "opt-1",
              title: "Quarantine Bastion host, switch EFS to read-only policy, and sever VPC peering to production",
              description: "Cut all network links between staging and production and lock shared file systems immediately.",
              risk: "Low",
              command: "aws ec2 modify-instance-attribute --instance-id i-bastion --groups sg-quarantine && aws ec2 delete-vpc-peering-connection --vpc-peering-connection-id pcx-staging-prod && aws efs put-file-system-policy --file-system-id fs-efs --policy file://readonly-policy.json",
              expectedTradeoff: "Complete containment protecting production data and backups from encryption.",
            },
            {
              id: "opt-2",
              title: "Pay ransom via Tor portal immediately to acquire decryption key",
              description: "Send cryptocurrency to attacker address.",
              risk: "High",
              command: "curl -X POST https://ransom-payment-portal/pay",
              expectedTradeoff: "Severe legal and compliance violations with no guarantee of key recovery.",
            },
            {
              id: "opt-3",
              title: "Run antivirus scan on compromised host while leaving it attached to VPC",
              description: "Install ClamAV and scan drive.",
              risk: "High",
              command: "apt-get install -y clamav && freshclam && clamscan -r /mnt",
              expectedTradeoff: "Ransomware will continue spreading into production while the slow scan runs.",
            },
          ],
        },
      ],
    };
  }
  return s;
});
