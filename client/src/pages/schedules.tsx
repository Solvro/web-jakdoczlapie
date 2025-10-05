import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Search, Clock, MapPin } from "lucide-react";
import { Stop, Route, Schedule, Condition } from "@shared/schema";
import { api } from "@/lib/api";
import { useState } from "react";
import { useOperator } from "@/contexts/operator-context";

export default function Schedules() {
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedOperator } = useOperator();
  
  const { data: routesData, isLoading: isLoadingRoutes } = useQuery<Route[]>({
    queryKey: [api.operators.getData(selectedOperator!)],
    enabled: !!selectedOperator,
  });

  const stops = routesData?.flatMap(route => route.stops || []) || [];
  const isLoading = isLoadingRoutes;

  const filteredStops = stops?.filter(stop =>
    stop.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-schedules-title">Rozkłady Jazdy</h1>
          <p className="text-muted-foreground">Przeglądaj rozkłady dla przystanków</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj przystanków..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64"
            data-testid="input-search-schedules"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredStops && filteredStops.length > 0 ? (
        <div className="space-y-4">
          {filteredStops.slice(0, 10).map((stop) => (
            <Card key={stop.id} className="hover-elevate transition-all" data-testid={`card-stop-${stop.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{stop.name}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        {stop.type && (
                          <Badge variant="outline" className="capitalize text-xs">
                            {stop.type}
                          </Badge>
                        )}
                        {stop.coordinates && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {stop.coordinates.latitude.toFixed(4)}, {stop.coordinates.longitude.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {stop.schedules && stop.schedules.length > 0 ? (
                <CardContent className="pt-0">
                  <div className="border border-card-border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">Godzina</TableHead>
                          <TableHead>Kierunek</TableHead>
                          <TableHead>Warunki</TableHead>
                          <TableHead className="w-24">Run</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stop.schedules.slice(0, 5).map((schedule: Schedule) => (
                          <TableRow key={schedule.id}>
                            <TableCell className="font-mono font-medium">
                              {schedule.time}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {schedule.destination || '-'}
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
                            <TableCell className="text-muted-foreground font-mono text-sm">
                              #{schedule.run || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {stop.schedules.length > 5 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      +{stop.schedules.length - 5} więcej kursów
                    </p>
                  )}
                </CardContent>
              ) : (
                <CardContent className="pt-0">
                  <div className="text-center py-6 bg-muted/50 rounded-md">
                    <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">Brak rozkładów dla tego przystanku</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Brak rozkładów</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Nie znaleziono przystanków pasujących do zapytania' : 'Brak dostępnych rozkładów'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
