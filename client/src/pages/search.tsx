import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search as SearchIcon, Navigation2, ArrowRight, Clock, Bus, Info } from "lucide-react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from "@tanstack/react-query";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Point {
  latitude: number;
  longitude: number;
  label: string;
}

interface JourneyOption {
  routes: Array<{
    id: number;
    name: string;
    operator: string;
    type: string;
  }>;
  totalDistance: number;
  transfers: number;
}

export default function Search() {
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [selectingPoint, setSelectingPoint] = useState<'start' | 'end' | null>('start');
  const [searchRadius, setSearchRadius] = useState(1000);
  const [shouldSearch, setShouldSearch] = useState(false);
  
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([50.5, 18.0], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (selectingPoint === 'start') {
        setStartPoint({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
          label: 'Punkt startowy'
        });
        setSelectingPoint('end');
      } else if (selectingPoint === 'end') {
        setEndPoint({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
          label: 'Punkt docelowy'
        });
        setSelectingPoint(null);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [selectingPoint]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (startMarkerRef.current) {
      startMarkerRef.current.remove();
      startMarkerRef.current = null;
    }

    if (startPoint) {
      startMarkerRef.current = L.marker([startPoint.latitude, startPoint.longitude], {
        icon: L.divIcon({
          className: 'custom-start-marker',
          html: `<div style="background: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      }).addTo(mapRef.current);

      startMarkerRef.current.bindPopup('<b>Start</b>');
    }
  }, [startPoint]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (endMarkerRef.current) {
      endMarkerRef.current.remove();
      endMarkerRef.current = null;
    }

    if (endPoint) {
      endMarkerRef.current = L.marker([endPoint.latitude, endPoint.longitude], {
        icon: L.divIcon({
          className: 'custom-end-marker',
          html: `<div style="background: #ef4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      }).addTo(mapRef.current);

      endMarkerRef.current.bindPopup('<b>Cel</b>');

      if (startPoint && mapRef.current) {
        const bounds = L.latLngBounds(
          [startPoint.latitude, startPoint.longitude],
          [endPoint.latitude, endPoint.longitude]
        );
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [endPoint, startPoint]);

  const { data: routes, isLoading, refetch } = useQuery<JourneyOption[]>({
    queryKey: ['/api/v1/routes', startPoint, endPoint, searchRadius],
    queryFn: async () => {
      if (!startPoint || !endPoint) return [];
      
      const url = `/api/v1/routes?fromLatitude=${startPoint.latitude}&fromLongitude=${startPoint.longitude}&toLatitude=${endPoint.latitude}&toLongitude=${endPoint.longitude}&radius=${searchRadius}`;
      
      const response = await fetch(url);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data || [];
    },
    enabled: shouldSearch && !!startPoint && !!endPoint,
  });

  useEffect(() => {
    if (shouldSearch && routes !== undefined && routes.length === 0 && searchRadius < 5000) {
      const newRadius = searchRadius + 500;
      setSearchRadius(newRadius);
      setTimeout(() => refetch(), 100);
    }
  }, [routes, shouldSearch, searchRadius, refetch]);

  const handleSearch = () => {
    if (startPoint && endPoint) {
      setSearchRadius(1000);
      setShouldSearch(true);
    }
  };

  const handleReset = () => {
    setStartPoint(null);
    setEndPoint(null);
    setSelectingPoint('start');
    setShouldSearch(false);
    setSearchRadius(1000);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-search-title">Wyszukaj Połączenie</h1>
        <p className="text-muted-foreground">Wybierz punkt startowy i docelowy na mapie aby znaleźć połączenia</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b border-card-border">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Mapa - Wybierz punkty
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div
                ref={containerRef}
                className="w-full h-full"
                data-testid="map-container"
                style={{ minHeight: '500px' }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation2 className="w-5 h-5 text-primary" />
                Punkty trasy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Punkt startowy</label>
                {startPoint ? (
                  <div className="p-3 border border-card-border rounded-md bg-card" data-testid="start-point-display">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-chart-3" />
                      <span className="text-sm font-medium text-foreground">Start</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {startPoint.latitude.toFixed(6)}, {startPoint.longitude.toFixed(6)}
                    </p>
                  </div>
                ) : (
                  <Button
                    variant={selectingPoint === 'start' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setSelectingPoint('start')}
                    data-testid="button-select-start"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {selectingPoint === 'start' ? 'Kliknij na mapie...' : 'Wybierz punkt'}
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Punkt docelowy</label>
                {endPoint ? (
                  <div className="p-3 border border-card-border rounded-md bg-card" data-testid="end-point-display">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-destructive" />
                      <span className="text-sm font-medium text-foreground">Cel</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {endPoint.latitude.toFixed(6)}, {endPoint.longitude.toFixed(6)}
                    </p>
                  </div>
                ) : (
                  <Button
                    variant={selectingPoint === 'end' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setSelectingPoint('end')}
                    disabled={!startPoint}
                    data-testid="button-select-end"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {selectingPoint === 'end' ? 'Kliknij na mapie...' : 'Wybierz punkt'}
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSearch}
                  disabled={!startPoint || !endPoint || isLoading}
                  data-testid="button-search"
                >
                  <SearchIcon className="w-4 h-4 mr-2" />
                  {isLoading ? 'Szukam...' : 'Szukaj'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  data-testid="button-reset"
                >
                  Wyczyść
                </Button>
              </div>

              {shouldSearch && (
                <div className="pt-2 border-t border-card-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Info className="w-3 h-3" />
                    <span>Promień wyszukiwania: {searchRadius}m</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {shouldSearch && routes && routes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SearchIcon className="w-5 h-5 text-primary" />
              Znalezione połączenia ({routes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {routes.map((option, index) => (
                <div
                  key={index}
                  className="p-4 border border-card-border rounded-md bg-card hover-elevate"
                  data-testid={`journey-option-${index}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bus className="w-5 h-5 text-primary" />
                      <span className="text-sm font-semibold text-foreground">
                        Opcja {index + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {option.transfers} {option.transfers === 1 ? 'przesiadka' : 'przesiadek'}
                      </Badge>
                      {option.totalDistance !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {(option.totalDistance / 1000).toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {option.routes.map((route, routeIndex) => (
                      <div key={routeIndex} className="flex items-center gap-2">
                        {routeIndex > 0 && (
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <div className="p-2 bg-primary/10 border border-primary/20 rounded-md">
                          <p className="text-xs font-semibold text-foreground">{route.name}</p>
                          <p className="text-xs text-muted-foreground">{route.operator}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {shouldSearch && routes && routes.length === 0 && !isLoading && searchRadius >= 5000 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nie znaleziono połączeń</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Nie udało się znaleźć żadnych połączeń między wybranymi punktami. Spróbuj wybrać inne lokalizacje.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
