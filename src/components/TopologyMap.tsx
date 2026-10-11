import React, { useState } from "react";
import {
  Server,
  Database,
  Globe,
  Shield,
  Layers,
  Cpu,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { TopologyNode } from "../types/incident";
import { soundManager } from "../utils/audio";

interface TopologyMapProps {
  nodes: TopologyNode[];
  language: "ar" | "en";
  onInspectNode?: (nodeName: string) => void;
}

export const TopologyMap: React.FC<TopologyMapProps> = ({
  nodes,
  language,
  onInspectNode,
}) => {
  const isAr = language === "ar";
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);

  const getNodeIcon = (type: TopologyNode["type"]) => {
    switch (type) {
      case "gateway":
        return <Globe className="w-4 h-4" />;
      case "network":
        return <Shield className="w-4 h-4" />;
      case "compute":
        return <Cpu className="w-4 h-4" />;
      case "auth":
        return <Layers className="w-4 h-4" />;
      case "database":
        return <Database className="w-4 h-4" />;
      case "cache":
        return <Server className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: TopologyNode["status"]) => {
    switch (status) {
      case "healthy":
        return {
          border: "border-emerald-500/40 bg-emerald-950/30 text-emerald-400",
          ping: null,
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          label: isAr ? "مستقر" : "HEALTHY",
        };
      case "degraded":
        return {
          border: "border-amber-500/50 bg-amber-950/40 text-amber-300",
          ping: "bg-amber-400",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
          label: isAr ? "متأثر" : "DEGRADED",
        };
      case "failing":
        return {
          border: "border-rose-500 bg-rose-950/50 text-rose-300 ring-1 ring-rose-500/50",
          ping: "bg-rose-500 animate-ping",
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400 animate-bounce" />,
          label: isAr ? "منهار" : "FAILING",
        };
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4 backdrop-blur-sm shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
            {isAr ? "مخطط البنية التحتية والخدمات (Architecture Topology)" : "Architecture Topology Map"}
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {nodes.filter((n) => n.status === "failing").length > 0 ? (
            <span className="text-rose-400 font-semibold flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              {nodes.filter((n) => n.status === "failing").length}{" "}
              {isAr ? "عقدة في حالة فشل" : "Nodes Failing"}
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {isAr ? "جميع العقد مستقرة" : "All Nodes Normal"}
            </span>
          )}
        </span>
      </div>

      {/* Nodes visual flow */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 relative">
        {nodes.map((node) => {
          const badge = getStatusBadge(node.status);
          const isSelected = selectedNode?.id === node.id;

          return (
            <div
              key={node.id}
              onClick={() => {
                soundManager.playKeyTick();
                setSelectedNode(node);
                if (onInspectNode) onInspectNode(node.name);
              }}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all duration-200 relative group flex flex-col justify-between ${
                badge.border
              } ${isSelected ? "ring-2 ring-cyan-400" : "hover:border-slate-600"}`}
            >
              {badge.ping && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${badge.ping}`}
                  />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${badge.ping}`} />
                </span>
              )}

              <div className="flex items-center justify-between mb-1.5">
                <span className="p-1 rounded bg-slate-950/60 text-slate-300">
                  {getNodeIcon(node.type)}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase">{badge.label}</span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-100 truncate group-hover:text-cyan-300">
                  {node.name}
                </h4>
                <div className="text-[11px] font-mono text-slate-400 mt-1 truncate bg-slate-950/40 px-1.5 py-0.5 rounded">
                  {node.metric}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <div className="mt-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-slate-300">
              <strong className="text-white">{selectedNode.name}</strong>: {selectedNode.metric} (Status:{" "}
              <span className="uppercase text-cyan-300 font-bold">{selectedNode.status}</span>)
            </span>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 cursor-pointer"
          >
            {isAr ? "إغلاق" : "Dismiss"}
          </button>
        </div>
      )}
    </div>
  );
};
