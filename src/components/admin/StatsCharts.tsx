"use client";

import * as React from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { formatDZD } from "@/lib/format";

// Clean modern palette — blues, greens, slates, violets, ambers.
const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
  "#64748b", // slate-500
  "#ef4444", // red-500
];

export function CategoryPieChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e4e4e7",
              borderRadius: 8,
              fontSize: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
            formatter={(v) => formatDZD(Number(v))}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HorizontalBars({
  data,
  formatValue = (v) => v.toLocaleString("fr-DZ"),
  max,
}: {
  data: Array<{ label: string; value: number }>;
  formatValue?: (v: number) => string;
  max?: number;
}) {
  const ceiling = max ?? Math.max(0, ...data.map((d) => d.value));
  return (
    <ul className="space-y-2">
      {data.map((d, i) => {
        const ratio = ceiling === 0 ? 0 : d.value / ceiling;
        return (
          <li key={d.label + i} className="flex items-center gap-3 text-xs">
            <span className="w-32 shrink-0 truncate text-zinc-900">
              {d.label}
            </span>
            <span className="relative h-5 flex-1 overflow-hidden rounded-md bg-zinc-100">
              <span
                className="absolute inset-y-0 left-0 rounded-md bg-blue-500"
                style={{ width: `${ratio * 100}%` }}
              />
            </span>
            <span className="w-20 shrink-0 text-right font-mono tabular-nums text-zinc-700">
              {formatValue(d.value)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function Funnel({
  steps,
}: {
  steps: Array<{ label: string; value: number }>;
}) {
  const max = steps[0]?.value ?? 1;
  return (
    <ul className="space-y-2">
      {steps.map((s, i) => {
        const ratio = max === 0 ? 0 : s.value / max;
        const conversion =
          i === 0 || !steps[i - 1]?.value
            ? null
            : (s.value / steps[i - 1]!.value) * 100;
        return (
          <li key={s.label} className="flex items-center gap-3 text-xs">
            <span className="w-28 shrink-0 text-zinc-900">{s.label}</span>
            <span className="relative h-7 flex-1 overflow-hidden rounded-md bg-zinc-100">
              <span
                className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-blue-600 to-emerald-500"
                style={{ width: `${ratio * 100}%` }}
              />
            </span>
            <span className="w-16 shrink-0 text-right font-mono tabular-nums text-zinc-900">
              {s.value.toLocaleString("fr-DZ")}
            </span>
            <span className="w-12 shrink-0 text-right text-2xs text-zinc-500">
              {conversion === null ? "—" : `${conversion.toFixed(0)}%`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
