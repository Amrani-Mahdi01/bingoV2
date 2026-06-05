"use client";

import * as React from "react";
import { Mono, Small } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { wilayas } from "@/lib/mock/wilayas";
import { formatDZD } from "@/lib/format";
import type { WilayaRevenue } from "@/lib/types";

interface Props {
  data: WilayaRevenue[];
  /** Highlight the wilaya hovered/selected, if any. */
  selectedCode?: string;
  onSelect?: (code: string) => void;
}

const REGION_ROWS: Array<{ region: string; codes: string[] }> = [
  { region: "Nord littoral", codes: ["02", "06", "09", "15", "16", "18", "21", "23", "35", "36", "42"] },
  { region: "Hauts plateaux Est", codes: ["04", "05", "19", "25", "34", "40", "41", "43"] },
  { region: "Hauts plateaux Ouest", codes: ["13", "14", "22", "29", "31", "20", "27", "38", "44", "46", "48"] },
  { region: "Centre", codes: ["10", "17", "24", "26", "28"] },
  { region: "Sud-Est", codes: ["07", "12", "30", "39", "55", "57"] },
  { region: "Sud-Ouest", codes: ["03", "08", "32", "45", "47", "51", "52", "58"] },
  { region: "Grand Sud", codes: ["01", "11", "33", "37", "49", "50", "53", "54", "56"] },
];

// Blue scale — neutral page bg → deep blue. Matches the admin palette.
const HEAT_SCALE = [
  "#f4f4f5", // zinc-100 (no orders)
  "#dbeafe", // blue-100
  "#bfdbfe", // blue-200
  "#93c5fd", // blue-300
  "#60a5fa", // blue-400
  "#3b82f6", // blue-500
  "#1d4ed8", // blue-700
];

function colourFor(revenue: number, max: number): string {
  if (max === 0 || revenue === 0) return HEAT_SCALE[0]!;
  const ratio = revenue / max;
  if (ratio < 0.1) return HEAT_SCALE[1]!;
  if (ratio < 0.25) return HEAT_SCALE[2]!;
  if (ratio < 0.45) return HEAT_SCALE[3]!;
  if (ratio < 0.65) return HEAT_SCALE[4]!;
  if (ratio < 0.85) return HEAT_SCALE[5]!;
  return HEAT_SCALE[6]!;
}

export function AlgeriaGeoGrid({ data, selectedCode, onSelect }: Props) {
  const byCode = React.useMemo(() => {
    const map = new Map<string, WilayaRevenue>();
    data.forEach((d) => map.set(d.wilayaCode, d));
    return map;
  }, [data]);
  const max = Math.max(0, ...data.map((d) => d.revenue));

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="flex items-baseline justify-between">
        <Mono className="text-zinc-500">Géographie</Mono>
        <Small className="text-zinc-500">
          {data.filter((d) => d.revenue > 0).length} wilayas actives
        </Small>
      </div>
      <h2 className="mt-1 font-sans text-lg font-semibold text-zinc-900">
        Chiffre d&apos;affaires par wilaya
      </h2>

      <div className="mt-5 space-y-3">
        {REGION_ROWS.map((row) => (
          <div key={row.region}>
            <Mono className="text-zinc-600">{row.region}</Mono>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {row.codes.map((code) => {
                const w = wilayas.find((x) => x.code === code);
                const r = byCode.get(code);
                const revenue = r?.revenue ?? 0;
                const bg = colourFor(revenue, max);
                const isSelected = selectedCode === code;
                return (
                  <li key={code}>
                    <button
                      type="button"
                      onClick={() => onSelect?.(code)}
                      aria-label={`${w?.name ?? code}, ${formatDZD(revenue)} CA`}
                      style={{
                        backgroundColor: bg,
                        color: revenue / max > 0.5 ? "#ffffff" : "#18181b",
                      }}
                      className={cn(
                        // Auto-width tile — name length dictates the
                        // width up to a max of 9rem so "Bordj Bou
                        // Arreridj" (18 chars) doesn't blow up the
                        // row. Min-w keeps short names like "Adrar"
                        // from looking lonely.
                        "flex h-14 min-w-[4.5rem] max-w-[9rem] flex-col items-start justify-between rounded-md border px-2 py-1.5 text-left transition-shadow",
                        isSelected
                          ? "border-zinc-900 shadow-md"
                          : "border-transparent hover:shadow-sm"
                      )}
                    >
                      <span className="line-clamp-2 text-[10px] font-medium leading-tight">
                        {w?.name ?? code}
                      </span>
                      <span className="font-mono text-2xs tabular-nums">
                        {revenue > 0 ? `${Math.round(revenue / 1000)}k` : "—"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-3">
        <Small className="text-zinc-500">Aucune commande</Small>
        <div className="flex h-3 flex-1 max-w-xs overflow-hidden rounded">
          {HEAT_SCALE.map((c) => (
            <span
              key={c}
              className="flex-1"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <Small className="text-zinc-500">CA élevé</Small>
      </div>
    </div>
  );
}
