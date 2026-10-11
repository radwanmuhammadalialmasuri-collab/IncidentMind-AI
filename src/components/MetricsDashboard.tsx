import React from "react";
import {
  Activity,
  Cpu,
  HardDrive,
  AlertTriangle,
  Zap,
  Database,
  TrendingDown,
  ShieldCheck,
  Users,
} from "lucide-react";
import { SystemMetrics } from "../types/incident";

interface MetricsDashboardProps {
  metrics: SystemMetrics;
  blastRadius: string;
  language: "ar" | "en";
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  metrics,
  blastRadius,
  language,
}) => {
  const isAr = language === "ar";

  // Calculate composite system health score (0 - 100%)
  const healthScore = Math.max(
    5,
    Math.min(
      100,
      Math.round(
        100 -
          (metrics.errorRatePercent * 0.45 +
            Math.max(0, metrics.cpuPercent - 50) * 0.35 +
            Math.min(100, metrics.latencyP99Ms / 100) * 0.2)
      )
    )
  );

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/40 bg-emerald-950/20";
    if (score >= 50) return "text-amber-400 border-amber-500/40 bg-amber-950/20";
    return "text-rose-500 border-rose-500/40 bg-rose-950/30 animate-pulse";
  };

  const getMetricLevelColor = (val: number, warnThresh = 70, critThresh = 85) => {
    if (val >= critThresh) return "text-rose-400 bg-rose-500";
    if (val >= warnThresh) return "text-amber-400 bg-amber-500";
    return "text-emerald-400 bg-emerald-500";
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4 backdrop-blur-sm shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
            {isAr ? "مؤشرات القياس الحية (Live Telemetry & SRE Signals)" : "Live Telemetry & SRE Signals"}
          </h2>
        </div>

        {/* Blast Radius Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/40 border border-rose-800/50 text-rose-300 text-[11px] font-mono">
          <Users className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-semibold text-rose-200">{blastRadius}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {/* 1. Composite System Health */}
        <div
          className={`p-2.5 rounded-lg border flex flex-col justify-between col-span-2 sm:col-span-1 ${getHealthColor(
            healthScore
          )}`}
        >
          <div className="flex items-center justify-between text-[11px] font-mono opacity-80">
            <span>{isAr ? "سلامة النظام" : "System Health"}</span>
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="my-1">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight">{healthScore}%</span>
          </div>
          <div className="w-full bg-slate-950/60 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                healthScore >= 80 ? "bg-emerald-500" : healthScore >= 50 ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        {/* 2. CPU Usage */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>{isAr ? "معالج CPU" : "CPU Load"}</span>
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="my-1">
            <span
              className={`text-xl sm:text-2xl font-bold font-mono ${
                getMetricLevelColor(metrics.cpuPercent).split(" ")[0]
              }`}
            >
              {metrics.cpuPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                getMetricLevelColor(metrics.cpuPercent).split(" ")[1]
              }`}
              style={{ width: `${metrics.cpuPercent}%` }}
            />
          </div>
        </div>

        {/* 3. Memory RAM */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>{isAr ? "الذاكرة RAM" : "Memory"}</span>
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="my-1">
            <span
              className={`text-xl sm:text-2xl font-bold font-mono ${
                getMetricLevelColor(metrics.memoryPercent).split(" ")[0]
              }`}
            >
              {metrics.memoryPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                getMetricLevelColor(metrics.memoryPercent).split(" ")[1]
              }`}
              style={{ width: `${metrics.memoryPercent}%` }}
            />
          </div>
        </div>

        {/* 4. Error Rate (5xx) */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>{isAr ? "معدل الخطأ 5xx" : "5xx Errors"}</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="my-1">
            <span
              className={`text-xl sm:text-2xl font-bold font-mono ${
                metrics.errorRatePercent > 20
                  ? "text-rose-400"
                  : metrics.errorRatePercent > 5
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {metrics.errorRatePercent.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                metrics.errorRatePercent > 20
                  ? "bg-rose-500"
                  : metrics.errorRatePercent > 5
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, metrics.errorRatePercent)}%` }}
            />
          </div>
        </div>

        {/* 5. P99 Latency */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>{isAr ? "زمن الاستجابة p99" : "p99 Latency"}</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="my-1">
            <span
              className={`text-xl sm:text-2xl font-bold font-mono ${
                metrics.latencyP99Ms > 3000
                  ? "text-rose-400"
                  : metrics.latencyP99Ms > 800
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {metrics.latencyP99Ms} <span className="text-xs font-normal text-slate-400">ms</span>
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                metrics.latencyP99Ms > 3000 ? "bg-rose-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, (metrics.latencyP99Ms / 5000) * 100)}%` }}
            />
          </div>
        </div>

        {/* 6. Database Pool */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>{isAr ? "مجمع اتصالات DB" : "DB Pool"}</span>
            <Database className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="my-1">
            <span
              className={`text-xl sm:text-2xl font-bold font-mono ${
                metrics.dbConnectionsActive / metrics.dbConnectionsMax > 0.85
                  ? "text-rose-400"
                  : "text-slate-200"
              }`}
            >
              {metrics.dbConnectionsActive}
              <span className="text-xs text-slate-400">/{metrics.dbConnectionsMax}</span>
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                metrics.dbConnectionsActive / metrics.dbConnectionsMax > 0.85
                  ? "bg-rose-500"
                  : "bg-cyan-500"
              }`}
              style={{
                width: `${Math.min(100, (metrics.dbConnectionsActive / metrics.dbConnectionsMax) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* 7. Financial Burn / Min */}
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>{isAr ? "الخسارة / دقيقة" : "Burn Rate"}</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="my-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
              ${metrics.financialLossPerMinute.toLocaleString()}
              <span className="text-xs text-slate-400">/m</span>
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate">
            {isAr ? `ثقة العملاء: ${metrics.reputationScore}%` : `Reputation: ${metrics.reputationScore}%`}
          </div>
        </div>
      </div>
    </div>
  );
};
