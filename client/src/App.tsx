import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OperatorProvider } from "@/contexts/operator-context";
import { OperatorSelector } from "@/components/operator-selector";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Routes from "@/pages/routes";
import Reports from "@/pages/reports";
import Tracking from "@/pages/tracking";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/routes" component={Routes} />
      <Route path="/reports" component={Reports} />
      <Route path="/tracking" component={Tracking} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OperatorProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between p-4 border-b border-border bg-background">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <div className="flex items-center gap-3">
                    <OperatorSelector />
                  </div>
                </header>
                <main className="flex-1 overflow-auto bg-background">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </OperatorProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
