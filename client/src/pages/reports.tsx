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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Plus, MapPin, Clock } from "lucide-react";
import { Report, Route, CreateReportInput, createReportSchema, reportTypes } from "@shared/schema";
import { api } from "@/lib/api";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { useOperator } from "@/contexts/operator-context";

export default function Reports() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { selectedOperator } = useOperator();
  
  const { data: routesData, isLoading: isLoadingRoutes } = useQuery<Route[]>({
    queryKey: [api.operators.getData(selectedOperator!)],
    enabled: !!selectedOperator,
  });

  const reports = routesData?.flatMap(route => route.reports || []) || [];
  const isLoading = isLoadingRoutes;

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

  const formSchema = createReportSchema.extend({
    routeId: z.number().int().positive(),
  });

  const form = useForm<CreateReportInput & { routeId: number }>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      routeId: 1,
      type: 'delay',
      description: '',
      coordinates: {
        latitude: 50.5,
        longitude: 18.0,
      },
    },
  });

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

  const onSubmit = (data: CreateReportInput & { routeId: number }) => {
    createReportMutation.mutate(data);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-reports-title">Raporty</h1>
          <p className="text-muted-foreground">Zarządzaj zgłoszeniami i incydentami</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-report">
              <Plus className="w-4 h-4 mr-2" />
              Dodaj Raport
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
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
                      <FormLabel>ID Trasy</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-route-id"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Typ Raportu</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="coordinates.latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Szerokość Geo.</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.000001"
                            placeholder="50.5" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-latitude"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="coordinates.longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Długość Geo.</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.000001"
                            placeholder="18.0" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-longitude"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
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
                    <div className="flex items-center gap-2 mb-2">
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
                    </div>
                    <CardTitle className="text-base">
                      {report.description || 'Brak opisu'}
                    </CardTitle>
                  </div>
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
    </div>
  );
}
