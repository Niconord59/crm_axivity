"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer } from "@/components/shared/ChartContainer";
import { useProjetsActifs } from "@/hooks/use-projets";
import { format, parseISO, startOfWeek, subWeeks, isAfter, isBefore, addDays } from "date-fns";
import { fr } from "date-fns/locale";

interface ProgressionChartProps {
  className?: string;
  weeks?: number;
}

export function ProgressionChart({ className, weeks = 8 }: ProgressionChartProps) {
  const { data: projets, isLoading } = useProjetsActifs();

  const chartData = useMemo(() => {
    if (!projets || projets.length === 0) return [];

    // Generate last N weeks
    const weeksData: { week: Date; label: string; projets: number; completion: number }[] = [];
    const today = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekDate = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
      weeksData.push({
        week: weekDate,
        label: format(weekDate, "dd MMM", { locale: fr }),
        projets: 0,
        completion: 0,
      });
    }

    // Calculate average completion per week based on project dates
    weeksData.forEach((weekEntry) => {
      const weekEnd = addDays(weekEntry.week, 7);

      // Count projects active during this week
      const activeProjets = projets.filter((projet) => {
        const startDate = projet.dateDebut
          ? parseISO(projet.dateDebut)
          : null;
        const endDate = projet.dateFinPrevue
          ? parseISO(projet.dateFinPrevue)
          : null;

        // Project is active if it started before week end and hasn't ended before week start
        const startedBeforeWeekEnd = !startDate || isBefore(startDate, weekEnd);
        const notEndedBeforeWeekStart = !endDate || isAfter(endDate, weekEntry.week);

        return startedBeforeWeekEnd && notEndedBeforeWeekStart;
      });

      weekEntry.projets = activeProjets.length;

      if (activeProjets.length > 0) {
        const totalCompletion = activeProjets.reduce(
          (sum, p) => sum + (p.pourcentageTachesTerminees || 0) * 100,
          0
        );
        weekEntry.completion = Math.round(totalCompletion / activeProjets.length);
      }
    });

    return weeksData.map((w) => ({
      name: w.label,
      projets: w.projets,
      completion: w.completion,
    }));
  }, [projets, weeks]);

  const avgCompletion =
    chartData.length > 0
      ? Math.round(
          chartData.reduce((sum, d) => sum + d.completion, 0) / chartData.length
        )
      : 0;

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">Semaine du {label}</p>
          <p className="text-sm text-muted-foreground">
            {payload.find((p) => p.dataKey === "projets")?.value || 0} projets actifs
          </p>
          <p className="text-primary font-semibold">
            {payload.find((p) => p.dataKey === "completion")?.value || 0}% de complétion moyenne
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartContainer
      title="Progression des Projets"
      description={`Moyenne de complétion: ${avgCompletion}%`}
      isLoading={isLoading}
      className={className}
      minHeight={300}
    >
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="completionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="completion"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#completionGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
