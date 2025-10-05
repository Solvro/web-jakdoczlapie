import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  isLoading?: boolean;
}

export function StatCard({ title, value, icon: Icon, trend, className, isLoading }: StatCardProps) {
  return (
    <Card className={cn("hover-elevate transition-all", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2" data-testid={`text-stat-${title.toLowerCase().replace(/\s+/g, '-')}-label`}>
              {title}
            </p>
            {isLoading ? (
              <div className="h-9 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-3xl font-bold text-foreground mb-1" data-testid={`text-stat-${title.toLowerCase().replace(/\s+/g, '-')}-value`}>
                {value}
              </p>
            )}
            {trend && !isLoading && (
              <p className={cn(
                "text-xs font-medium flex items-center gap-1",
                trend.isPositive ? "text-chart-3" : "text-destructive"
              )}>
                <span>{trend.isPositive ? "↑" : "↓"}</span>
                <span>{Math.abs(trend.value)}%</span>
              </p>
            )}
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
