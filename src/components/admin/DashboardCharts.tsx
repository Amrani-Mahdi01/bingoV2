"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDZD } from "@/lib/format";
import { cn } from "@/lib/utils";

// Neutral palette anchors — keep in sync with [data-admin] tokens.
const COLORS = {
  ink: "#18181b", // zinc-900
  axis: "#71717a", // zinc-500
  grid: "#e4e4e7", // zinc-200
  tooltipBg: "#ffffff",
  blue: "#3b82f6", // chart-1
  emerald: "#10b981", // chart-2
} as const;

const tickStyle = {
  fill: COLORS.axis,
  fontSize: 11,
  fontFamily: "var(--font-mono)",
} as const;

const tooltipStyle = {
  background: COLORS.tooltipBg,
  border: `1px solid ${COLORS.grid}`,
  borderRadius: 8,
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
};

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-DZ", {
    day: "2-digit",
    month: "short",
  });
}

export function RevenueAreaChart({
  data,
  className,
}: {
  data: Array<{ date: string; revenue: number }>;
  className?: string;
}) {
  const formatted = React.useMemo(
    () => data.map((d) => ({ ...d, label: dayLabel(d.date) })),
    [data]
  );
  return (
    <div className={cn("h-72 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formatted}
          margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.blue} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke={COLORS.grid}
            strokeDasharray="2 4"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            stroke={COLORS.axis}
            tick={tickStyle as never}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={COLORS.axis}
            tick={tickStyle as never}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            width={48}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: COLORS.ink }}
            formatter={(v) => [formatDZD(Number(v)), "CA"]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={COLORS.blue}
            strokeWidth={2}
            fill="url(#rev-fill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OrdersBarChart({
  data,
  className,
}: {
  data: Array<{ date: string; orders: number }>;
  className?: string;
}) {
  const formatted = React.useMemo(
    () => data.map((d) => ({ ...d, label: dayLabel(d.date) })),
    [data]
  );
  return (
    <div className={cn("h-72 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={formatted}
          margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
        >
          <CartesianGrid
            stroke={COLORS.grid}
            strokeDasharray="2 4"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            stroke={COLORS.axis}
            tick={tickStyle as never}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={COLORS.axis}
            tick={tickStyle as never}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={32}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: COLORS.ink }}
            formatter={(v) => [v, "commandes"]}
          />
          <Bar dataKey="orders" fill={COLORS.emerald} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Sparkline({
  data,
  color = COLORS.blue,
  height = 36,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const formatted = data.map((v, i) => ({ i, v }));
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#spark-${color})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
