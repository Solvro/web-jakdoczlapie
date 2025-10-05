import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar, Search, Clock, MapPin, Upload, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { Stop, Route, Schedule, Condition } from "@shared/schema";
import { api } from "@/lib/api";
import { useState } from "react";
import { useOperator } from "@/contexts/operator-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Schedules() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<any>(null);
  const { selectedOperator } = useOperator();
  const { toast } = useToast();
  
  const { data: routesData, isLoading: isLoadingRoutes } = useQuery<Route[]>({
    queryKey: [api.operators.getData(selectedOperator!)],
    enabled: !!selectedOperator,
  });

  const stops = routesData?.flatMap(route => route.stops || []) || [];
  const isLoading = isLoadingRoutes;

  const filteredStops = stops?.filter(stop =>
    stop.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const importScheduleMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/schedules/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import schedule');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setImportedData(data);
      toast({
        title: "Rozkład zaimportowany",
        description: "Pomyślnie wyodrębniono dane z pliku",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Błąd importu",
        description: error.message,
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportedData(null);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      importScheduleMutation.mutate(selectedFile);
    }
  };

  const handleSaveSchedules = async () => {
    if (!importedData?.data) return;
    
    try {
      for (const routeData of importedData.data) {
        const response = await fetch('/api/v1/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: routeData.route,
            operator: routeData.operator,
            type: routeData.type,
            destinations: Array.from(new Set(routeData.stops.map((s: any) => s.direction))),
          }),
        });
        
        if (response.ok) {
          const route = await response.json();
          
          const stopsByName = new Map<string, any>();
          for (const stopData of routeData.stops) {
            if (!stopsByName.has(stopData.name)) {
              stopsByName.set(stopData.name, {
                name: stopData.name,
                type: routeData.type,
                schedules: []
              });
            }
            
            stopsByName.get(stopData.name).schedules.push({
              time: stopData.time,
              destination: stopData.direction,
              run: stopData.run,
              conditions: stopData.conditions.map((c: string) => ({ name: c }))
            });
          }
          
          for (const stop of Array.from(stopsByName.values())) {
            await fetch(`/api/v1/routes/${route.id}/stops`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(stop),
            });
          }
        }
      }
      
      queryClient.invalidateQueries({ queryKey: [api.operators.getData(selectedOperator!)] });
      
      toast({
        title: "Sukces",
        description: "Rozkłady zostały zapisane",
      });
      
      setIsImportDialogOpen(false);
      setSelectedFile(null);
      setImportedData(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: "Nie udało się zapisać rozkładów",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-schedules-title">Rozkłady Jazdy</h1>
          <p className="text-muted-foreground">Przeglądaj rozkłady dla przystanków</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-import-schedule">
                <Upload className="w-4 h-4 mr-2" />
                Importuj z pliku
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Importuj rozkład z obrazu lub PDF</DialogTitle>
                <DialogDescription>
                  Prześlij zdjęcie rozkładu jazdy lub plik PDF. AI automatycznie wyodrębni dane.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-card-border rounded-lg p-6">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    data-testid="input-file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    {selectedFile ? (
                      <div className="flex items-center gap-3">
                        {selectedFile.type.startsWith('image/') ? (
                          <ImageIcon className="w-8 h-8 text-primary" />
                        ) : (
                          <FileText className="w-8 h-8 text-primary" />
                        )}
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Kliknij aby wybrać plik (obraz lub PDF)
                        </p>
                      </>
                    )}
                  </label>
                </div>

                {selectedFile && !importedData && (
                  <Button 
                    onClick={handleImport} 
                    disabled={importScheduleMutation.isPending}
                    className="w-full"
                    data-testid="button-process-file"
                  >
                    {importScheduleMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Przetwarzanie...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Wyodrębnij dane
                      </>
                    )}
                  </Button>
                )}

                {importedData?.data && (
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-md p-4">
                      <h3 className="font-semibold mb-2">Znalezione dane:</h3>
                      <div className="space-y-2 text-sm">
                        {importedData.data.map((route: any, idx: number) => (
                          <div key={idx} className="border-l-2 border-primary pl-3">
                            <p className="font-medium">{route.route}</p>
                            <p className="text-muted-foreground">{route.operator}</p>
                            <p className="text-xs text-muted-foreground">
                              {route.stops.length} przystanków
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSaveSchedules}
                        className="flex-1"
                        data-testid="button-save-schedules"
                      >
                        Zapisz rozkłady
                      </Button>
                      <Button 
                        onClick={() => {
                          setSelectedFile(null);
                          setImportedData(null);
                        }}
                        variant="outline"
                      >
                        Anuluj
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
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
                    <ScrollArea className="max-h-96 w-full">
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
                      <ScrollBar orientation="horizontal" />
                      <ScrollBar orientation="vertical" />
                    </ScrollArea>
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
