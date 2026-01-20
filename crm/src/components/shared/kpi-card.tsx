"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingDown, TrendingUp, HelpCircle } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
  variant?: "default" | "destructive";
  tooltip?: string;
}

export function KPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  variant = "default",
  tooltip,
}: KPICardProps) {
  const isPositiveTrend = trend && trend.value >= 0;
  const isDestructive = variant === "destructive";

  return (
    <Card className={cn(isDestructive && "border-destructive", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        {tooltip ? (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <CardTitle className={cn(
                  "text-sm font-medium cursor-help flex items-center gap-1",
                  isDestructive ? "text-destructive" : "text-muted-foreground"
                )}>
                  {title}
                  <HelpCircle className="h-3 w-3" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px]">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <CardTitle className={cn(
            "text-sm font-medium",
            isDestructive ? "text-destructive" : "text-muted-foreground"
          )}>
            {title}
          </CardTitle>
        )}
        {Icon && (
          <Icon className={cn(
            "h-4 w-4",
            isDestructive ? "text-destructive" : "text-muted-foreground"
          )} />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span
                className={cn(
                  "flex items-center text-xs font-medium",
                  isPositiveTrend ? "text-green-600" : "text-red-600"
                )}
              >
                {isPositiveTrend ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                {Math.abs(trend.value)}%
              </span>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
