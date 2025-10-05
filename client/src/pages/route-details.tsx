import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bus, Train, MapPin, ArrowLeft, Clock } from "lucide-react";
import { Route, Schedule, Stop } from "@shared/schema";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface ScheduleMatrix {
  runs: number[];
  stopSchedules: Map<number, Map<number, Schedule>>;
}

export default function RouteDetails() {
  const [, params] = useRoute("/routes/:id");
  const [, setLocation] = useLocation();
  const routeId = params?.id ? parseInt(params.id) : null;

  const { data: route, isLoading } = useQuery<Route>({
    queryKey: [api.routes.getById(routeId!)],
    enabled: routeId !== null,
  });

  const scheduleMatrix = useMemo((): ScheduleMatrix | null => {
    if (!route?.stops) return null;

    const runSet = new Set<number>();
    const stopSchedules = new Map<number, Map<number, Schedule>>();

    route.stops.forEach(stop => {
      const schedulesByRun = new Map<number, Schedule>();
      
      (stop.schedules || []).forEach(schedule => {
        if (schedule.run) {
          runSet.add(schedule.run);
          schedulesByRun.set(schedule.run, schedule);
        }
      });
      
      stopSchedules.set(stop.id, schedulesByRun);
    });

    const runs = Array.from(runSet).sort((a, b) => a - b);

    return { runs, stopSchedules };
  }, [route?.stops]);

  const getTypeIcon = (type?: string) => {
    if (type === 'train') return Train;
    return Bus;
  };

  const getTypeColor = (type?: string) => {
    if (type === 'train') return 'text-chart-2';
    if (type === 'tram') return 'text-chart-4';
    return 'text-primary';
  };

  const formatTime = (time: string) => {
    // Convert HH:MM:SS to HH:MM for compact display
    return time.substring(0, 5);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-12 bg-muted animate-pulse rounded-md w-64" />
        <div className="h-96 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Bus className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nie znaleziono trasy</h3>
              <p className="text-sm text-muted-foreground mb-4">Trasa o podanym ID nie istnieje</p>
              <Button onClick={() => setLocation("/routes")} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Powrót do listy tras
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const TypeIcon = getTypeIcon(route.type);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setLocation("/routes")}
          data-testid="button-back-to-routes"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-route-title">
            {route.name}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-muted-foreground">{route.operator}</p>
            {route.type && (
              <Badge variant="outline" className="capitalize">
                {route.type}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-14 h-14 rounded-md flex items-center justify-center flex-shrink-0",
                route.type === 'train' ? 'bg-chart-2/10' : 'bg-primary/10'
              )}>
                <TypeIcon className={cn("w-7 h-7", getTypeColor(route.type))} />
              </div>
              <div>
                <CardTitle className="text-xl mb-2">Informacje o trasie</CardTitle>
                {route.destinations && route.destinations.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Kierunki: </span>
                    {route.destinations.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Przystanki i rozkład jazdy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {route.stops && route.stops.length > 0 && scheduleMatrix ? (
            <ScrollArea className="w-full">
              <div className="border border-card-border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 z-10 bg-card min-w-[250px] border-r border-card-border">
                        Przystanek
                      </TableHead>
                      {scheduleMatrix.runs.map(run => (
                        <TableHead 
                          key={run} 
                          className="text-center min-w-[120px]"
                          data-testid={`header-run-${run}`}
                        >
                          <div className="font-semibold">Kurs #{run}</div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {route.stops.map((stop: Stop, stopIndex: number) => {
                      const stopScheduleMap = scheduleMatrix.stopSchedules.get(stop.id);
                      
                      return (
                        <TableRow key={stop.id} data-testid={`row-stop-${stop.id}`}>
                          <TableCell className="sticky left-0 z-10 bg-card border-r border-card-border">
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground font-mono text-sm flex-shrink-0 mt-0.5">
                                {stopIndex + 1}.
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm leading-tight mb-1">
                                  {stop.name}
                                </div>
                                {stop.type && (
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {stop.type}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          {scheduleMatrix.runs.map(run => {
                            const schedule = stopScheduleMap?.get(run);
                            
                            return (
                              <TableCell 
                                key={run} 
                                className="text-center align-top"
                                data-testid={`cell-stop-${stop.id}-run-${run}`}
                              >
                                {schedule ? (
                                  <div className="py-1">
                                    <div className="font-mono font-semibold text-sm mb-1">
                                      {formatTime(schedule.time)}
                                    </div>
                                    {schedule.destination && (
                                      <div className="text-xs text-muted-foreground mb-1">
                                        → {schedule.destination}
                                      </div>
                                    )}
                                    {schedule.conditions && schedule.conditions.length > 0 && (
                                      <div className="flex gap-1 flex-wrap justify-center">
                                        {schedule.conditions.map(condition => (
                                          <Badge 
                                            key={condition.id} 
                                            variant="secondary" 
                                            className="text-xs px-1 py-0"
                                          >
                                            {condition.name}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">—</span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {scheduleMatrix.runs.length > 5 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Przewiń w prawo aby zobaczyć więcej kursów →
                </p>
              )}
            </ScrollArea>
          ) : (
            <div className="text-center py-8 bg-muted/50 rounded-md">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">Brak przystanków dla tej trasy</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
