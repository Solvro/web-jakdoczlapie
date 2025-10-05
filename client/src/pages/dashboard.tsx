import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { Route, Report } from "@shared/schema";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { useOperator } from "@/contexts/operator-context";

export default function Dashboard() {
  const { selectedOperator } = useOperator();

  const { data: routesData, isLoading: routesLoading } = useQuery<Route[]>({
    queryKey: [api.operators.getData(selectedOperator!)],
    enabled: !!selectedOperator,
  });

  const routes = routesData || [];
  const reports = routes.flatMap(route => route.reports || []);

  const totalRoutes = routes.length || 0;
  const activeRoutes = routes.filter(r => r.type === 'bus' || r.type === 'train').length || 0;

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      delay: 'Opóźnienie',
      accident: 'Wypadek',
      failure: 'Awaria',
      did_not_arrive: 'Nie przyjechał',
      change: 'Zmiana',
      other: 'Inne',
      press: 'Tłok',
      diffrent_stop_location: 'Inna lokalizacja',
      request_stop: 'Przystanek na żądanie',
    };
    return labels[type] || type;
  };

  const getReportTypeVariant = (type: string): "default" | "destructive" | "secondary" => {
    if (['accident', 'failure', 'did_not_arrive'].includes(type)) return 'destructive';
    if (['delay', 'press'].includes(type)) return 'secondary';
    return 'default';
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-dashboard-title">Przegląd</h1>
        <p className="text-muted-foreground">Witaj w panelu administratora JakDoczłapię</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Wszystkie Trasy"
          value={totalRoutes}
          icon={Bus}
          isLoading={routesLoading}
        />
        <StatCard
          title="Aktywne Linie"
          value={activeRoutes}
          icon={TrendingUp}
          isLoading={routesLoading}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Raporty Dziś"
          value={reports.length || 0}
          icon={AlertTriangle}
          isLoading={routesLoading}
        />
        <StatCard
          title="Średnie Opóźnienie"
          value="3 min"
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              Ostatnie Raporty
            </CardTitle>
          </CardHeader>
          <CardContent>
            {routesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
                ))}
              </div>
            ) : reports && reports.length > 0 ? (
              <div className="space-y-3">
                {reports.slice(0, 5).map((report) => (
                  <div
                    key={report.id}
                    className="p-3 bg-card border border-card-border rounded-md hover-elevate"
                    data-testid={`card-report-${report.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {report.type && (
                            <Badge variant={getReportTypeVariant(report.type)} className="text-xs">
                              {getReportTypeLabel(report.type)}
                            </Badge>
                          )}
                          {report.route_id && (
                            <span className="text-xs text-muted-foreground">Trasa #{report.route_id}</span>
                          )}
                        </div>
                        <p className="text-sm text-foreground line-clamp-1">
                          {report.description || 'Brak opisu'}
                        </p>
                      </div>
                      {report.created_at && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: pl })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">Brak raportów</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="w-5 h-5 text-primary" />
              Popularne Trasy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {routesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
                ))}
              </div>
            ) : routes && routes.length > 0 ? (
              <div className="space-y-3">
                {routes.slice(0, 5).map((route) => (
                  <div
                    key={route.id}
                    className="p-3 bg-card border border-card-border rounded-md hover-elevate"
                    data-testid={`card-route-${route.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center">
                          <Bus className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{route.name}</p>
                          <p className="text-xs text-muted-foreground">{route.operator}</p>
                        </div>
                      </div>
                      {route.type && (
                        <Badge variant="outline" className="capitalize">
                          {route.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bus className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">Brak tras</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
