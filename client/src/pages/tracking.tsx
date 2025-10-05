import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Clock, Bus, Activity, AlertCircle, Info } from "lucide-react";
import { Route, Track, Report } from "@shared/schema";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import { useOperator } from "@/contexts/operator-context";
import { RouteMap } from "@/components/route-map";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

export default function Tracking() {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedRun, setSelectedRun] = useState<number | null>(null);
  const { selectedOperator } = useOperator();
  
  const { data: routes, isLoading } = useQuery<Route[]>({
    queryKey: [api.operators.getData(selectedOperator!)],
    enabled: !!selectedOperator,
  });

  const { data: allTracks = [] } = useQuery<Track[]>({
    queryKey: ['/api/v1/all-tracks', selectedRoute?.id],
    queryFn: async () => {
      if (!selectedRoute?.id) return [];
      try {
        const response = await fetch(`/api/v1/routes/${selectedRoute.id}/tracks`);
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    },
    enabled: !!selectedRoute?.id,
    refetchInterval: 15000,
  });

  const availableRuns = Array.from(
    new Set(allTracks.map(track => track.run).filter(run => run !== undefined))
  ).sort((a, b) => a - b);

  const tracks = selectedRun 
    ? allTracks.filter(track => track.run === selectedRun)
    : allTracks;

  const latestTrack = tracks.length > 0 
    ? tracks.reduce((latest, track) => 
        new Date(track.created_at) > new Date(latest.created_at) ? track : latest
      )
    : null;

  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: ['/api/v1/reports', selectedRoute?.id, selectedRun],
    queryFn: async () => {
      if (!selectedRoute?.id) return [];
      try {
        const url = selectedRun 
          ? `/api/v1/routes/${selectedRoute.id}/reports?run=${selectedRun}`
          : `/api/v1/routes/${selectedRoute.id}/reports`;
        const response = await fetch(url);
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    },
    enabled: !!selectedRoute?.id,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (routes && routes.length > 0 && !selectedRoute) {
      setSelectedRoute(routes[0]);
    }
  }, [routes, selectedRoute]);

  useEffect(() => {
    if (availableRuns.length > 0 && !selectedRun) {
      setSelectedRun(availableRuns[availableRuns.length - 1]);
    }
  }, [availableRuns, selectedRun]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-tracking-title">Śledzenie na Żywo</h1>
        <p className="text-muted-foreground">Monitoruj pozycje pojazdów w czasie rzeczywistym</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {selectedRoute && availableRuns.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Bus className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">{selectedRoute.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedRoute.operator}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <label className="text-sm text-muted-foreground">Przebieg:</label>
                  <Select 
                    value={selectedRun?.toString() || ""} 
                    onValueChange={(value) => setSelectedRun(Number(value))}
                  >
                    <SelectTrigger className="w-32" data-testid="select-run">
                      <SelectValue placeholder="Wybierz..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRuns.map((run) => (
                        <SelectItem key={run} value={run.toString()}>
                          Kurs #{run}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {latestTrack && latestTrack.coordinates && (
                <div className="mt-3 pt-3 border-t border-card-border">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-chart-3 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-1">Ostatnia lokalizacja</p>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-mono">
                          {latestTrack.coordinates.latitude.toFixed(6)}, {latestTrack.coordinates.longitude.toFixed(6)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatDistanceToNow(new Date(latestTrack.created_at), { addSuffix: true, locale: pl })}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {tracks.length} śladów - odświeżanie co 15s
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}
          
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b border-card-border">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Mapa Śledzenia
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {selectedRoute ? (
                <RouteMap
                  stops={selectedRoute.stops || []}
                  tracks={tracks}
                  reports={reports}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-b-lg flex items-center justify-center">
                  <div className="text-center p-6">
                    <Activity className="w-16 h-16 text-primary mx-auto mb-4 opacity-70" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Wybierz Trasę</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Wybierz trasę z listy po prawej stronie, aby zobaczyć mapę
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-primary" />
                Trasy
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 overflow-auto">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
                  ))}
                </div>
              ) : routes && routes.length > 0 ? (
                <div className="space-y-2">
                  {routes.slice(0, 5).map((route) => (
                    <div
                      key={route.id}
                      onClick={() => {
                        setSelectedRoute(route);
                        setSelectedRun(null);
                      }}
                      className={`p-2 border rounded-md hover-elevate transition-all cursor-pointer ${
                        selectedRoute?.id === route.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'bg-card border-card-border'
                      }`}
                      data-testid={`card-route-${route.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Bus className="w-4 h-4 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm line-clamp-1">{route.name}</p>
                          <p className="text-xs text-muted-foreground">{route.operator}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Bus className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">Brak tras</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
