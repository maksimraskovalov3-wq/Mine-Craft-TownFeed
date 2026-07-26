import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, Link } from 'wouter';
import { useEffect } from 'react';
import { setAuthTokenGetter } from '@workspace/api-client-react';

import Home from '@/pages/Home';
import CityDetail from '@/pages/CityDetail';
import Admin from '@/pages/Admin';

const queryClient = new QueryClient();

// Configure the API client to use the admin token from localStorage
setAuthTokenGetter(() => localStorage.getItem('admin_token'));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/city/:id" component={CityDetail} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Force dark mode
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <div className="min-h-[100dvh] flex flex-col">
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-sm pixel-shadow flex items-center justify-center">
                    <span className="font-pixel text-[10px] text-primary-foreground">TF</span>
                  </div>
                  <span className="font-pixel text-lg font-bold tracking-tight mt-1 text-primary">TownFeed</span>
                </Link>
                <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  Admin
                </Link>
              </div>
            </header>
            <main className="flex-1">
              <Router />
            </main>
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
