import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bus, Train, Search, MapPin } from "lucide-react";
import { Route } from "@shared/schema";
import { api } from "@/lib/api";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useOperator } from "@/contexts/operator-context";

export default function Routes() {
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedOperator } = useOperator();
  
  const { data: routes, isLoading } = useQuery<Route[]>({
    queryKey: selectedOperator 
      ? [api.operators.getData(selectedOperator)]
      : [api.routes.getAll()],
  });

  const filteredRoutes = routes?.filter(route =>
    route.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.operator?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type?: string) => {
    if (type === 'train') return Train;
    return Bus;
  };

  const getTypeColor = (type?: string) => {
    if (type === 'train') return 'text-chart-2';
    if (type === 'tram') return 'text-chart-4';
    return 'text-primary';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-routes-title">Trasy</h1>
          <p className="text-muted-foreground">Zarządzaj liniami autobusowymi i kolejowymi</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj tras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
              data-testid="input-search-routes"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredRoutes && filteredRoutes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoutes.map((route) => {
            const TypeIcon = getTypeIcon(route.type);
            return (
              <Card key={route.id} className="hover-elevate transition-all" data-testid={`card-route-${route.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn(
                        "w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0",
                        route.type === 'train' ? 'bg-chart-2/10' : 'bg-primary/10'
                      )}>
                        <TypeIcon className={cn("w-6 h-6", getTypeColor(route.type))} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base mb-1 line-clamp-2">{route.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{route.operator}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {route.type && (
                      <Badge variant="outline" className="capitalize text-xs">
                        {route.type}
                      </Badge>
                    )}
                    {route.stops && route.stops.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {route.stops.length} przystanków
                      </Badge>
                    )}
                  </div>
                  {route.destinations && route.destinations.length > 0 && (
                    <div className="text-xs text-muted-foreground mb-3">
                      <span className="font-medium">Kierunki: </span>
                      {route.destinations.slice(0, 2).join(', ')}
                      {route.destinations.length > 2 && ` +${route.destinations.length - 2}`}
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-route-${route.id}`}>
                    Zobacz szczegóły
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Bus className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Brak tras</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? 'Nie znaleziono tras pasujących do zapytania' : 'Brak dostępnych tras'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
