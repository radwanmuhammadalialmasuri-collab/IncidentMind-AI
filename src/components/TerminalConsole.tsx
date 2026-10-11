import React, { useState, useRef, useEffect } from "react";
import {
  Terminal as TerminalIcon,
  Search,
  Filter,
  Copy,
  Check,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { LogEntry, LogLevel } from "../types/incident";
import { soundManager } from "../utils/audio";

interface TerminalConsoleProps {
  logs: LogEntry[];
  scenarioTitle: string;
  language: "ar" | "en";
  onExecuteCommand?: (cmd: string) => Promise<string>;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = ({
  logs,
  scenarioTitle,
  language,
  onExecuteCommand,
}) => {
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<"logs" | "cli">("logs");
  const [filterLevel, setFilterLevel] = useState<"ALL" | LogLevel>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  // Interactive CLI state
  const [cliInput, setCliInput] = useState("");
  const [cliHistory, setCliHistory] = useState<
    { command: string; output: string; exitCode: number; time: string }[]
  >([
    {
      command: "kubectl get pods -n production",
      output:
        "NAME                                   READY   STATUS             RESTARTS   AGE\n" +
        "ingress-nginx-controller-6b459c-q4m2   0/1     CrashLoopBackOff   14         32m\n" +
        "api-core-deployment-78f9cd-w8v1        1/1     Running            0          4h\n" +
        "api-core-deployment-78f9cd-z5k9        0/1     OOMKilled          3          18m\n" +
        "auth-service-5c6978-mn92               1/1     Running            0          12h\n" +
        "worker-processor-8b4d8-px21            0/1     Error              6          45m",
      exitCode: 1,
      time: "13:00:10",
    },
  ]);
  const [isExecuting, setIsExecuting] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const cliEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === "logs") {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      cliEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, cliHistory, activeTab]);

  const handleCopyLogs = () => {
    soundManager.playKeyTick();
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.source}] ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunCli = async (cmdToRun?: string) => {
    const cmd = (cmdToRun || cliInput).trim();
    if (!cmd || isExecuting) return;

    soundManager.playKeyTick();
    setIsExecuting(true);
    setCliInput("");

    try {
      let output = "";
      let exitCode = 0;

      if (cmd === "clear") {
        setCliHistory([]);
        setIsExecuting(false);
        return;
      }

      if (onExecuteCommand) {
        output = await onExecuteCommand(cmd);
      } else {
        const res = await fetch("/api/simulate-terminal-command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: cmd,
            scenarioTitle,
          }),
        });
        const data = await res.json();
        output = data.output || "Done.";
        exitCode = data.exitCode ?? 0;
      }

      setCliHistory((prev) => [
        ...prev,
        {
          command: cmd,
          output,
          exitCode,
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (err: any) {
      setCliHistory((prev) => [
        ...prev,
        {
          command: cmd,
          output: `Execution error: ${err.message}`,
          exitCode: 127,
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== "ALL" && log.level !== filterLevel) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.source.toLowerCase().includes(q) ||
        log.level.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getLogLevelStyle = (lvl: LogLevel) => {
    switch (lvl) {
      case "CRIT":
        return "text-rose-400 bg-rose-950/60 border-rose-800/80 font-bold";
      case "ERROR":
        return "text-red-400 bg-red-950/40 border-red-800/60";
      case "WARN":
        return "text-amber-400 bg-amber-950/40 border-amber-800/60";
      case "INFO":
        return "text-cyan-400 bg-cyan-950/40 border-cyan-800/60";
    }
  };

  const quickCommands = [
    "kubectl top pods -A",
    "netstat -tulpn | grep LISTEN",
    "tail -n 20 /var/log/nginx/error.log",
    "dmesg -T | grep -i oom",
    "curl -Iv https://localhost/healthz",
  ];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[380px] sm:h-[440px]">
      {/* Terminal Title Bar */}
      <div className="bg-slate-900/90 px-3 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* OS Terminal Dots */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          {/* Tab buttons */}
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-2.5 py-1 text-xs font-mono rounded-md font-semibold transition-all cursor-pointer ${
              activeTab === "logs"
                ? "bg-slate-800 text-cyan-300 border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {isAr ? "سجل الأحداث المباشر (Syslogs)" : "Live Syslog Stream"}
          </button>
          <button
            onClick={() => setActiveTab("cli")}
            className={`px-2.5 py-1 text-xs font-mono rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "cli"
                ? "bg-slate-800 text-emerald-300 border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>{isAr ? "الطرفية التفاعلية (Bastion CLI)" : "Bastion CLI"}</span>
          </button>
        </div>

        {/* Controls based on active tab */}
        {activeTab === "logs" ? (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
              <input
                type="text"
                placeholder={isAr ? "بحث في السجلات..." : "Filter logs..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-md pl-7 pr-2 py-1 text-[11px] font-mono focus:outline-none focus:border-cyan-500 w-28 sm:w-36"
              />
            </div>

            {/* Level filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-md border border-slate-800">
              {(["ALL", "CRIT", "ERROR", "WARN"] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded cursor-pointer ${
                    filterLevel === lvl
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopyLogs}
              className="p-1 rounded text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 cursor-pointer"
              title={isAr ? "نسخ السجلات" : "Copy logs"}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-emerald-400/80">root@k8s-bastion:~#</span>
          </div>
        )}
      </div>

      {/* Body: Logs or Interactive CLI */}
      {activeTab === "logs" ? (
        <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1.5 select-text">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              {isAr ? "لا توجد سجلات مطابقة للبحث" : "No logs match criteria"}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2 hover:bg-slate-900/40 p-1 rounded transition-colors"
              >
                <span className="text-slate-500 shrink-0 select-none text-[10px] pt-0.5">
                  {log.timestamp.split(" ")[1] || log.timestamp}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded border uppercase shrink-0 font-bold ${getLogLevelStyle(
                    log.level
                  )}`}
                >
                  {log.level}
                </span>
                <span className="text-cyan-400/90 font-medium shrink-0">[{log.source}]</span>
                <span className="text-slate-300 break-all leading-relaxed">{log.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* CLI Output history */}
          <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-3 select-text bg-slate-950">
            {cliHistory.map((item, idx) => (
              <div key={idx} className="space-y-1 border-b border-slate-900 pb-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span className="text-slate-600 select-none">{item.time}</span>
                  <span className="text-cyan-400">root@bastion:~$</span>
                  <span className="text-slate-100">{item.command}</span>
                  {item.exitCode !== 0 && (
                    <span className="text-[10px] text-rose-400 bg-rose-950/40 px-1 rounded">
                      exit: {item.exitCode}
                    </span>
                  )}
                </div>
                <pre className="text-slate-300 text-[11px] whitespace-pre-wrap leading-relaxed pl-4 border-l-2 border-slate-800">
                  {item.output}
                </pre>
              </div>
            ))}
            <div ref={cliEndRef} />
          </div>

          {/* Quick command buttons */}
          <div className="bg-slate-900/60 px-3 py-1.5 border-t border-slate-900 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-mono text-slate-500 shrink-0">
              {isAr ? "أوامر سريعة:" : "Quick:"}
            </span>
            {quickCommands.map((qCmd) => (
              <button
                key={qCmd}
                onClick={() => handleRunCli(qCmd)}
                className="text-[10px] font-mono bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white px-2 py-0.5 rounded border border-slate-800 shrink-0 transition-colors cursor-pointer"
              >
                {qCmd}
              </button>
            ))}
          </div>

          {/* CLI Input Prompt */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunCli();
            }}
            className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
          >
            <span className="text-emerald-400 font-mono text-xs shrink-0 select-none font-bold">
              root@bastion:~$
            </span>
            <input
              type="text"
              value={cliInput}
              onChange={(e) => setCliInput(e.target.value)}
              placeholder={
                isAr
                  ? "اكتب أمراً للتشخيص (مثل: kubectl get pods, netstat, tail -f, psql)..."
                  : "Type bash/k8s/cloud command to diagnose or mitigate..."
              }
              disabled={isExecuting}
              className="flex-1 bg-transparent text-slate-100 font-mono text-xs focus:outline-none placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={isExecuting || !cliInput.trim()}
              className="px-2.5 py-1 text-xs font-mono bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isExecuting ? "..." : isAr ? "تنفيذ" : "Run"}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
