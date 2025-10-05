import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Plus, MapPin, Clock, Info, Trash2 } from "lucide-react";
import { Report, Route, CreateReportInput, createReportSchema, reportTypes } from "@shared/schema";
import { api } from "@/lib/api";
import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { useOperator } from "@/contexts/operator-context";
import { RouteMap } from "@/components/route-map";

export default function Reports() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const { toast } = useToast();
  const { selectedOperator } = useOperator();
  
  const { data: routesData, isLoading: isLoadingRoutes } = useQuery<Route[]>({
    queryKey: [api.operators.getData(selectedOperator!)],
    enabled: !!selectedOperator,
  });

  const { data: selectedRouteDetails } = useQuery<Route>({
    queryKey: [api.routes.getById(selectedRouteId!)],
    enabled: selectedRouteId !== null,
  });

  const reports = useMemo(() => {
    if (!routesData) return [];
    return routesData.flatMap(route => 
      (route.reports || []).map(report => ({
        ...report,
        route_id: report.route_id || route.id,
      }))
    );
  }, [routesData]);
  
  const isLoading = isLoadingRoutes;

  const runs = useMemo(() => {
    if (!selectedRouteDetails?.stops) return [];
    
    const runSet = new Set<number>();
    selectedRouteDetails.stops.forEach(stop => {
      (stop.schedules || []).forEach(schedule => {
        if (schedule.run) {
          runSet.add(schedule.run);
        }
      });
    });
    
    return Array.from(runSet).sort((a, b) => a - b);
  }, [selectedRouteDetails]);

  const createReportMutation = useMutation({
    mutationFn: async (data: CreateReportInput & { routeId: number }) => {
      const { routeId, ...reportData } = data;
      return apiRequest('POST', api.routes.createReport(routeId), reportData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.routes.getAll()] });
      if (selectedOperator) {
        queryClient.invalidateQueries({ queryKey: [api.operators.getData(selectedOperator)] });
      }
      setIsDialogOpen(false);
      setSelectedRouteId(null);
      toast({
        title: "Raport dodany",
        description: "Raport został pomyślnie utworzony",
      });
      form.reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: "Nie udało się utworzyć raportu",
      });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async ({ reportId }: { reportId: number }) => {
      return apiRequest('DELETE', `/api/v1/reports/${reportId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.routes.getAll()] });
      if (selectedOperator) {
        queryClient.invalidateQueries({ queryKey: [api.operators.getData(selectedOperator)] });
      }
      setReportToDelete(null);
      toast({
        title: "Raport usunięty",
        description: "Raport został pomyślnie usunięty",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Błąd",
        description: "Nie udało się usunąć raportu",
      });
    },
  });

  const formSchema = createReportSchema.extend({
    routeId: z.number().int().positive(),
    run: z.number().int().optional(),
  });

  const form = useForm<CreateReportInput & { routeId: number; run?: number }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      routeId: 0,
      type: 'delay',
      description: '',
      run: undefined,
      coordinates: {
        latitude: 50.5,
        longitude: 18.0,
      },
    },
  });

  const watchedRouteId = form.watch('routeId');
  const watchedCoordinates = form.watch('coordinates');

  useEffect(() => {
    if (watchedRouteId) {
      setSelectedRouteId(watchedRouteId);
    }
  }, [watchedRouteId]);

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      delay: 'Opóźnienie',
      accident: 'Wypadek',
      failure: 'Awaria',
      did_not_arrive: 'Nie przyjechał',
      change: 'Zmiana',
      other: 'Inne',
      press: 'Tłok',
      diffrent_stop_location: 'Inna lokalizacja przystanku',
      request_stop: 'Przystanek na żądanie',
    };
    return labels[type] || type;
  };

  const getReportTypeVariant = (type: string): "default" | "destructive" | "secondary" => {
    if (['accident', 'failure', 'did_not_arrive'].includes(type)) return 'destructive';
    if (['delay', 'press'].includes(type)) return 'secondary';
    return 'default';
  };

  const onSubmit = (data: CreateReportInput & { routeId: number; run?: number }) => {
    const { run, ...reportData } = data;
    
    const payload: any = {
      ...reportData,
    };
    
    if (run) {
      payload.run = run;
    }
    
    createReportMutation.mutate(payload);
  };

  const handleMapClick = (lat: number, lng: number) => {
    form.setValue('coordinates.latitude', lat);
    form.setValue('coordinates.longitude', lng);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-reports-title">Raporty</h1>
          <p className="text-muted-foreground">Zarządzaj zgłoszeniami i incydentami</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setSelectedRouteId(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-report">
              <Plus className="w-4 h-4 mr-2" />
              Dodaj Raport
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nowy Raport</DialogTitle>
              <DialogDescription>
                Zgłoś problem lub incydent dla wybranej trasy
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="routeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trasa</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(Number(value));
                          form.setValue('run', undefined);
                        }}
                        value={field.value ? String(field.value) : undefined}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-route">
                            <SelectValue placeholder="Wybierz trasę" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {routesData && routesData.length > 0 ? (
                            routesData.map((route) => (
                              <SelectItem key={route.id} value={String(route.id)}>
                                {route.name} - {route.operator}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              Brak tras
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedRouteId && runs.length > 0 && (
                  <FormField
                    control={form.control}
                    name="run"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kurs (opcjonalnie)</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            if (value === "none") {
                              field.onChange(undefined);
                            } else {
                              field.onChange(Number(value));
                            }
                          }}
                          value={field.value ? String(field.value) : "none"}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-run">
                              <SelectValue placeholder="Wybierz kurs (opcjonalnie)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Brak - dotyczy całej trasy</SelectItem>
                            {runs.map((run) => (
                              <SelectItem key={run} value={String(run)}>
                                Kurs #{run}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Jeśli problem dotyczy konkretnego kursu, wybierz go z listy
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typ Raportu</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-report-type">
                            <SelectValue placeholder="Wybierz typ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {reportTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {getReportTypeLabel(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opis</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Opisz szczegóły incydentu..." 
                          className="resize-none"
                          rows={3}
                          {...field}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Lokalizacja incydentu
                  </FormLabel>
                  <div className="text-xs text-muted-foreground mb-2 flex items-start gap-2">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Kliknij na mapę aby wybrać miejsce incydentu. 
                      {selectedRouteId && ' Trasa jest oznaczona niebieską linią.'}
                    </span>
                  </div>
                  <div className="border border-card-border rounded-md overflow-hidden h-[350px]">
                    <RouteMap
                      stops={selectedRouteDetails?.stops || []}
                      selectedCoordinates={watchedCoordinates}
                      onLocationSelect={handleMapClick}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    Wybrane współrzędne: {watchedCoordinates.latitude.toFixed(6)}, {watchedCoordinates.longitude.toFixed(6)}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setSelectedRouteId(null);
                      form.reset();
                    }}
                    className="flex-1"
                    data-testid="button-cancel"
                  >
                    Anuluj
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={createReportMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createReportMutation.isPending ? 'Dodawanie...' : 'Dodaj Raport'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : reports && reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover-elevate transition-all" data-testid={`card-report-${report.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {report.type && (
                        <Badge variant={getReportTypeVariant(report.type)}>
                          {getReportTypeLabel(report.type)}
                        </Badge>
                      )}
                      {report.route_id && (
                        <Badge variant="outline" className="text-xs">
                          Trasa #{report.route_id}
                        </Badge>
                      )}
                      {report.run && (
                        <Badge variant="secondary" className="text-xs">
                          Kurs #{report.run}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base">
                      {report.description || 'Brak opisu'}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setReportToDelete(report)}
                    data-testid={`button-delete-report-${report.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-muted-foreground">
                  {report.coordinates && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="font-mono text-xs">
                        {report.coordinates.latitude.toFixed(4)}, {report.coordinates.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                  {report.created_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: pl })}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Brak raportów</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Nie ma jeszcze żadnych zgłoszeń
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Dodaj pierwszy raport
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć ten raport?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Raport zostanie trwale usunięty.
              {reportToDelete && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium text-foreground">
                    {reportToDelete.description || 'Brak opisu'}
                  </p>
                  {reportToDelete.type && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Typ: {getReportTypeLabel(reportToDelete.type)}
                    </p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Anuluj
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (reportToDelete) {
                  deleteReportMutation.mutate({
                    reportId: reportToDelete.id,
                  });
                }
              }}
              disabled={deleteReportMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteReportMutation.isPending ? 'Usuwanie...' : 'Usuń raport'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
