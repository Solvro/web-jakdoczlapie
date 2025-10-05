import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock, Bus, Activity } from "lucide-react";
import { Route } from "@shared/schema";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";

export default function Tracking() {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  
  const { data: routes, isLoading } = useQuery<Route[]>({
    queryKey: [api.routes.getAll()],
  });

  const { data: trackingData, refetch: refetchTracking } = useQuery({
    queryKey: ['/api/v1/tracking', selectedRoute?.id],
    queryFn: async () => {
      if (!selectedRoute?.id) return null;
      try {
        const response = await fetch(`/api/v1/routes/${selectedRoute.id}/tracks`);
        if (!response.ok) return null;
        return await response.json();
      } catch {
        return null;
      }
    },
    enabled: !!selectedRoute?.id,
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (routes && routes.length > 0 && !selectedRoute) {
      setSelectedRoute(routes[0]);
    }
  }, [routes, selectedRoute]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-tracking-title">Śledzenie na Żywo</h1>
        <p className="text-muted-foreground">Monitoruj pozycje pojazdów w czasie rzeczywistym</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b border-card-border">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Widok Mapy
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="w-full h-full bg-muted rounded-b-lg flex items-center justify-center relative">
                <div className="text-center p-6">
                  <Activity className="w-16 h-16 text-primary mx-auto mb-4 opacity-70 animate-pulse" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Śledzenie w Czasie Rzeczywistym</h3>
                  <p className="text-sm text-muted-foreground max-w-md mb-4">
                    Mapa śledzeń wyświetli pozycje pojazdów na trasach. Przygotowywana jest integracja z danymi GPS.
                  </p>
                  {selectedRoute && (
                    <div className="mt-6 p-4 bg-card border border-card-border rounded-md inline-block">
                      <div className="flex items-center gap-3 mb-3">
                        <Bus className="w-8 h-8 text-primary" />
                        <div className="text-left">
                          <p className="font-semibold text-foreground">{selectedRoute.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedRoute.operator}</p>
                          {selectedRoute.run && (
                            <p className="text-xs text-muted-foreground font-mono mt-1">Run #{selectedRoute.run}</p>
                          )}
                        </div>
                      </div>
                      {trackingData && (
                        <div className="text-xs text-muted-foreground border-t border-card-border pt-3 mt-3">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-chart-3" />
                            <span>Dane śledzenia dostępne - odświeżanie co 15s</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-primary" />
                Aktywne Pojazdy
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 bg-muted animate-pulse rounded-md" />
                  ))}
                </div>
              ) : routes && routes.length > 0 ? (
                <div className="space-y-3">
                  {routes.slice(0, 8).map((route) => (
                    <div
                      key={route.id}
                      onClick={() => setSelectedRoute(route)}
                      className={`p-3 border rounded-md hover-elevate transition-all cursor-pointer ${
                        selectedRoute?.id === route.id 
                          ? 'bg-primary/10 border-primary' 
                          : 'bg-card border-card-border'
                      }`}
                      data-testid={`card-active-vehicle-${route.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${
                          selectedRoute?.id === route.id 
                            ? 'bg-primary/20' 
                            : 'bg-primary/10'
                        }`}>
                          <Bus className={`w-5 h-5 ${
                            selectedRoute?.id === route.id 
                              ? 'text-primary' 
                              : 'text-primary'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-foreground text-sm line-clamp-1">{route.name}</p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {route.type || 'bus'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{route.operator}</p>
                          {route.run && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span className="font-mono">Run #{route.run}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-chart-3 rounded-full animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bus className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">Brak aktywnych pojazdów</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
