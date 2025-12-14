"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { ChartContainer } from "@/components/shared/ChartContainer";
import { useOpportunites } from "@/hooks/use-opportunites";
import { formatCurrency } from "@/lib/utils";
import type { OpportunityStatus } from "@/types";

interface PipelineChartProps {
  className?: string;
  showLegend?: boolean;
}

const STATUT_COLORS: Record<string, string> = {
  Lead: "hsl(210, 100%, 50%)",        // Blue
  "Qualifié": "hsl(190, 100%, 40%)",  // Cyan
  Proposition: "hsl(45, 100%, 50%)",   // Yellow
  "Négociation": "hsl(25, 100%, 50%)", // Orange
  "Gagné": "hsl(142, 76%, 36%)",       // Green
  Perdu: "hsl(0, 84%, 60%)",           // Red
};

const STATUT_ORDER: OpportunityStatus[] = [
  "Lead",
  "Qualifié",
  "Proposition",
  "Négociation",
  "Gagné",
  "Perdu",
];

export function PipelineChart({ className, showLegend = true }: PipelineChartProps) {
  const { data: opportunites, isLoading } = useOpportunites();

  const chartData = useMemo(() => {
    if (!opportunites) return [];

    // Group by status
    const grouped = opportunites.reduce((acc, opp) => {
      const statut = opp.statut || "Lead";
      if (!acc[statut]) {
        acc[statut] = { count: 0, value: 0 };
      }
      acc[statut].count += 1;
      acc[statut].value += opp.valeurPonderee || opp.valeurEstimee || 0;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    // Convert to array and sort by statut order
    return STATUT_ORDER
      .filter((statut) => grouped[statut]?.count > 0)
      .map((statut) => ({
        name: statut,
        value: grouped[statut].count,
        montant: grouped[statut].value,
        color: STATUT_COLORS[statut],
      }));
  }, [opportunites]);

  const totalOpportunites = chartData.reduce((sum, item) => sum + item.value, 0);
  const totalMontant = chartData.reduce((sum, item) => sum + item.montant, 0);

  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{
      payload: { name: string; value: number; montant: number };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} opportunité{data.value > 1 ? "s" : ""}
          </p>
          <p className="text-primary font-semibold">
            {formatCurrency(data.montant)}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props: { payload?: Array<{ value: string; color?: string }> }) => {
    const { payload } = props;
    if (!payload) return null;

    return (
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {payload.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color || "hsl(var(--primary))" }}
            />
            <span className="text-xs text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ChartContainer
      title="Pipeline par Statut"
      description={`${totalOpportunites} opportunités - ${formatCurrency(totalMontant)}`}
      isLoading={isLoading}
      className={className}
      minHeight={300}
    >
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) =>
              `${name} (${(percent * 100).toFixed(0)}%)`
            }
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend content={renderLegend} />}
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
