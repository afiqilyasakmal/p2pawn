"use client";

import type { ConnectionStatus, PlayerRole } from "@/hooks/usePeerConnection";

interface ConnectionStatusBarProps {
  status: ConnectionStatus;
  role: PlayerRole;
  opponentName?: string;
}

export function ConnectionStatusBar({ status, role, opponentName }: ConnectionStatusBarProps) {
  const statusConfig: Record<
    ConnectionStatus,
    { label: string; dotColor: string; bgColor: string; textColor: string }
  > = {
    idle: {
      label: "Idle",
      dotColor: "bg-stone-400",
      bgColor: "bg-stone-100",
      textColor: "text-stone-600",
    },
    connecting: {
      label: role === "host" ? "Waiting for opponent..." : "Connecting...",
      dotColor: "bg-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
    },
    connected: {
      label: `Connected — ${role === "host" ? "White" : "Black"}`,
      dotColor: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
    disconnected: {
      label: "Disconnected",
      dotColor: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
    },
    error: {
      label: "Connection Error",
      dotColor: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
      <span>{config.label}</span>
    </div>
  );
}
