import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bus, Train, MapPin, ArrowLeft, Clock } from "lucide-react";
import { Route, Schedule, Condition } from "@shared/schema";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function RouteDetails() {
  const [, params] = useRoute("/routes/:id");
  const [, setLocation] = useLocation();
  const routeId = params?.id ? parseInt(params.id) : null;

  const { data: route, isLoading } = useQuery<Route>({
    queryKey: [api.routes.getById(routeId!)],
    enabled: routeId !== null,
  });

  const getTypeIcon = (type?: string) => {
    if (type === 'train') return Train;
    return Bus;
  };

  const getTypeColor = (type?: string) => {
    if (type === 'train') return 'text-chart-2';
    if (type === 'tram') return 'text-chart-4';
    return 'text-primary';
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
          {route.stops && route.stops.length > 0 ? (
            <div className="border border-card-border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Przystanek</TableHead>
                    <TableHead className="w-32">Godzina</TableHead>
                    <TableHead>Kierunek</TableHead>
                    <TableHead>Run</TableHead>
                    <TableHead>Warunki</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {route.stops.map((stop, stopIndex) => {
                    const schedules = stop.schedules || [];
                    
                    if (schedules.length === 0) {
                      return (
                        <TableRow key={stop.id} data-testid={`row-stop-${stop.id}`}>
                          <TableCell className="text-muted-foreground font-mono text-sm">
                            {stopIndex + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <div>{stop.name}</div>
                                {stop.type && (
                                  <Badge variant="outline" className="capitalize text-xs mt-1">
                                    {stop.type}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell colSpan={4} className="text-muted-foreground text-sm">
                            Brak rozkładów
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return schedules.map((schedule: Schedule, idx: number) => (
                      <TableRow key={`${stop.id}-${schedule.id}`} data-testid={`row-schedule-${schedule.id}`}>
                        {idx === 0 && (
                          <>
                            <TableCell rowSpan={schedules.length} className="text-muted-foreground font-mono text-sm align-top">
                              {stopIndex + 1}
                            </TableCell>
                            <TableCell rowSpan={schedules.length} className="font-medium align-top">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div>{stop.name}</div>
                                  {stop.type && (
                                    <Badge variant="outline" className="capitalize text-xs mt-1">
                                      {stop.type}
                                    </Badge>
                                  )}
                                  {stop.coordinates && (
                                    <div className="text-xs text-muted-foreground font-mono mt-1">
                                      {stop.coordinates.latitude.toFixed(4)}, {stop.coordinates.longitude.toFixed(4)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </>
                        )}
                        <TableCell className="font-mono font-medium">
                          {schedule.time}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {schedule.destination || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-sm">
                          #{schedule.run || '-'}
                        </TableCell>
                        <TableCell>
                          {schedule.conditions && schedule.conditions.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {schedule.conditions.map((condition: Condition) => (
                                <Badge key={condition.id} variant="secondary" className="text-xs">
                                  {condition.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
            </div>
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
