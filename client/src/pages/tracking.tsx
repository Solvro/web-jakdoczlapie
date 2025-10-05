import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Navigation, Clock, Bus, Activity, X } from "lucide-react";
import { Route, Track } from "@shared/schema";
import { api } from "@/lib/api";
import { useState, useEffect, useMemo } from "react";
import { useOperator } from "@/contexts/operator-context";
import { RouteMap } from "@/components/route-map";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { MultiOperatorSelector } from "@/components/multi-operator-selector";
import { Button } from "@/components/ui/button";

export default function Tracking() {
  const [selectedRoutes, setSelectedRoutes] = useState<Route[]>([]);
  const { selectedOperators } = useOperator();

  const routeQueries = selectedOperators.map(operator => ({
    operator,
    query: useQuery<Route[]>({
      queryKey: [api.operators.getData(operator)],
      enabled: !!operator,
    })
  }));

  const allRoutes = useMemo(() => {
    return routeQueries.flatMap(q => q.query.data || []);
  }, [routeQueries]);

  const isLoading = routeQueries.some(q => q.query.isLoading);

  const trackQueries = selectedRoutes.map(route => ({
    route,
    query: useQuery<Track[]>({
      queryKey: ['/api/v1/tracks', route.id],
      queryFn: async () => {
        if (!route.id) return [];
        try {
          const response = await fetch(`/api/v1/routes/${route.id}/tracks`);
          if (!response.ok) return [];
          return await response.json();
        } catch {
          return [];
        }
      },
      enabled: !!route.id,
      refetchInterval: 15000,
    })
  }));

  const allTracks = useMemo(() => {
    return trackQueries.flatMap(tq => 
      (tq.query.data || []).map(track => ({ ...track, routeId: tq.route.id, routeName: tq.route.name }))
    );
  }, [trackQueries]);

  const allStops = useMemo(() => {
    return selectedRoutes.flatMap(route => route.stops || []);
  }, [selectedRoutes]);

  const toggleRoute = (route: Route) => {
    setSelectedRoutes(prev => {
      const exists = prev.find(r => r.id === route.id);
      if (exists) {
        return prev.filter(r => r.id !== route.id);
      } else {
        return [...prev, route];
      }
    });
  };

  const removeRoute = (routeId: number) => {
    setSelectedRoutes(prev => prev.filter(r => r.id !== routeId));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-tracking-title">Śledzenie na Żywo</h1>
        <p className="text-muted-foreground">Monitoruj pozycje pojazdów w czasie rzeczywistym i porównuj wiele tras</p>
      </div>

      <div className="flex items-center gap-4">
        <MultiOperatorSelector />
        {selectedRoutes.length > 0 && (
          <Badge variant="secondary">
            {selectedRoutes.length} {selectedRoutes.length === 1 ? 'trasa' : selectedRoutes.length < 5 ? 'trasy' : 'tras'} do porównania
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {selectedRoutes.length > 0 && (
            <Card className="p-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Wybrane trasy do porównania:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRoutes.map(route => (
                    <Badge 
                      key={route.id} 
                      variant="outline" 
                      className="flex items-center gap-1 pr-1"
                      data-testid={`selected-route-${route.id}`}
                    >
                      <Bus className="w-3 h-3" />
                      <span>{route.name}</span>
                      <span className="text-muted-foreground">({route.operator})</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1"
                        onClick={() => removeRoute(route.id)}
                        data-testid={`button-remove-route-${route.id}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          )}
          
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b border-card-border">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Mapa Porównania Tras
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {selectedRoutes.length > 0 ? (
                <RouteMap
                  stops={allStops}
                  tracks={allTracks}
                  reports={[]}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-b-lg flex items-center justify-center">
                  <div className="text-center p-6">
                    <Activity className="w-16 h-16 text-primary mx-auto mb-4 opacity-70" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Wybierz Trasy</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Zaznacz trasy z listy po prawej stronie, aby porównać je na mapie
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
                Dostępne Trasy
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-auto">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
                  ))}
                </div>
              ) : allRoutes.length > 0 ? (
                <div className="space-y-2">
                  {allRoutes.map((route) => {
                    const isSelected = selectedRoutes.some(r => r.id === route.id);
                    return (
                      <div
                        key={route.id}
                        onClick={() => toggleRoute(route)}
                        className={`p-2 border rounded-md hover-elevate transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-card border-card-border'
                        }`}
                        data-testid={`card-route-${route.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleRoute(route)}
                            data-testid={`checkbox-route-${route.id}`}
                          />
                          <Bus className="w-4 h-4 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm line-clamp-1">{route.name}</p>
                            <p className="text-xs text-muted-foreground">{route.operator}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Bus className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">Brak tras - wybierz operatorów</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {allTracks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Historia Śladów GPS - Wszystkie Trasy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-tracks">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Trasa</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Kurs</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Szerokość geograficzna</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Długość geograficzna</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Data i czas</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Czas względny</th>
                  </tr>
                </thead>
                <tbody>
                  {allTracks
                    .filter(track => track.coordinates)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((track: any, index) => (
                    <tr 
                      key={`${track.id}-${index}`} 
                      className="border-b border-card-border last:border-0 hover-elevate"
                      data-testid={`track-row-${index}`}
                    >
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="text-xs">
                          {track.routeName}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="font-mono">
                          #{track.run}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                        {track.coordinates.latitude.toFixed(6)}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                        {track.coordinates.longitude.toFixed(6)}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(track.created_at).toLocaleString('pl-PL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(track.created_at), { addSuffix: true, locale: pl })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
