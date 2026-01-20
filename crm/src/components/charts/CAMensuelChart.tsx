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
import { useFactures } from "@/hooks/use-factures";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

interface CAMensuelChartProps {
  className?: string;
  months?: number;
}

export function CAMensuelChart({ className, months = 6 }: CAMensuelChartProps) {
  const { data: factures, isLoading } = useFactures({ statut: "Payé" });

  const chartData = useMemo(() => {
    if (!factures) return [];

    // Generate last N months
    const monthsData: { month: Date; label: string; ca: number }[] = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = startOfMonth(subMonths(today, i));
      monthsData.push({
        month: monthDate,
        label: format(monthDate, "MMM yyyy", { locale: fr }),
        ca: 0,
      });
    }

    // Sum factures by month
    factures.forEach((facture) => {
      if (facture.datePaiement) {
        const paiementDate = parseISO(facture.datePaiement);
        const paiementMonth = startOfMonth(paiementDate);

        const monthEntry = monthsData.find(
          (m) => m.month.getTime() === paiementMonth.getTime()
        );

        if (monthEntry) {
          monthEntry.ca += facture.montantTTC || 0;
        }
      }
    });

    return monthsData.map((m) => ({
      name: m.label,
      ca: m.ca,
    }));
  }, [factures, months]);

  const totalCA = chartData.reduce((sum, item) => sum + item.ca, 0);
  const maxCA = Math.max(...chartData.map((d) => d.ca), 1);

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          <p className="text-primary font-semibold">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartContainer
      title="Chiffre d'Affaires Mensuel"
      description={`Total: ${formatCurrency(totalCA)} sur ${months} mois`}
      isLoading={isLoading}
      className={className}
      minHeight={300}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <YAxis
            tickFormatter={(value) =>
              value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()
            }
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="ca" radius={[4, 4, 0, 0]} maxBarSize={60}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.ca >= maxCA * 0.8 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.6)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
