"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartContainer } from "@/components/shared/ChartContainer";
import { useLifecycleFunnel } from "@/hooks/use-lifecycle-funnel";
import {
  LIFECYCLE_STAGE_LABELS,
  LIFECYCLE_STAGE_COLORS,
} from "@/types/constants";
import type { LifecycleStage } from "@/types";
import { useRouter } from "next/navigation";

interface LifecycleFunnelChartProps {
  className?: string;
  showChurned?: boolean;
  onStageClick?: (stage: LifecycleStage) => void;
}

// Map Tailwind bg classes to hex colors for Recharts
const STAGE_HEX_COLORS: Record<LifecycleStage, string> = {
  Lead: "#6b7280", // gray-500
  MQL: "#3b82f6", // blue-500
  SQL: "#6366f1", // indigo-500
  Opportunity: "#a855f7", // purple-500
  Customer: "#22c55e", // green-500
  Evangelist: "#f59e0b", // amber-500
  Churned: "#ef4444", // red-500
};

// Funnel stages order (main progression)
const DISPLAY_ORDER: LifecycleStage[] = [
  "Lead",
  "MQL",
  "SQL",
  "Opportunity",
  "Customer",
  "Evangelist",
];

export function LifecycleFunnelChart({
  className,
  showChurned = false,
  onStageClick,
}: LifecycleFunnelChartProps) {
  const router = useRouter();
  const { data, isLoading } = useLifecycleFunnel();

  const chartData = useMemo(() => {
    if (!data) return [];

    const stagesToDisplay = showChurned
      ? [...DISPLAY_ORDER, "Churned" as LifecycleStage]
      : DISPLAY_ORDER;

    return stagesToDisplay.map((stage) => {
      const stageData = data.stages.find((s) => s.stage === stage);
      return {
        stage,
        name: LIFECYCLE_STAGE_LABELS[stage],
        count: stageData?.count || 0,
        percentage: stageData?.percentage || 0,
        color: STAGE_HEX_COLORS[stage],
      };
    });
  }, [data, showChurned]);

  const handleBarClick = (entry: { stage: LifecycleStage }) => {
    if (onStageClick) {
      onStageClick(entry.stage);
    } else {
      // Default: navigate to prospection with filter
      router.push(`/prospection?lifecycleStage=${entry.stage}`);
    }
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      payload: {
        stage: LifecycleStage;
        name: string;
        count: number;
        percentage: number;
      };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;

      // Find conversion rate for this stage
      const conversionRate = data?.conversionRates.find(
        (cr) => cr.fromStage === entry.stage
      );

      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{entry.name}</p>
          <p className="text-sm text-muted-foreground">
            {entry.count} contact{entry.count !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            {entry.percentage.toFixed(1)}% du total
          </p>
          {conversionRate && (
            <p className="text-xs text-primary mt-1">
              Conversion: {conversionRate.rate}%
            </p>
          )}
          <p className="text-xs text-blue-500 mt-2 cursor-pointer">
            Cliquer pour filtrer
          </p>
        </div>
      );
    }
    return null;
  };

  const totalContacts = data?.totalContacts || 0;
  const avgCycle = data?.avgLeadToCustomerDays;

  const description = [
    `${totalContacts} contacts`,
    avgCycle !== null ? `Cycle moyen: ${avgCycle}j` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <ChartContainer
      title="Funnel Lifecycle"
      description={description}
      isLoading={isLoading}
      className={className}
      minHeight={320}
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 80, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            maxBarSize={40}
            cursor="pointer"
            onClick={(data) => handleBarClick(data)}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
