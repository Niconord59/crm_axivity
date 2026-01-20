"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChartContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  minHeight?: number;
  action?: React.ReactNode;
}

export function ChartContainer({
  title,
  description,
  children,
  isLoading = false,
  className,
  minHeight = 300,
  action,
}: ChartContainerProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </CardHeader>
      <CardContent>
        <div
          className="w-full"
          style={{ minHeight: `${minHeight}px` }}
        >
          {isLoading ? (
            <div className="flex flex-col gap-4 h-full justify-center">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-[200px] w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <div className="w-full h-full">{children}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
