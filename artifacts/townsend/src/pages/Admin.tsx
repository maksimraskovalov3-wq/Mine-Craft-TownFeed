import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus, LogOut, Check, Building, Newspaper } from 'lucide-react';

import { 
  useAdminLogin, 
  useListCities, 
  useCreateCity, 
  useDeleteCity,
  useListNews,
  useCreateNews,
  useDeleteNews,
  getListCitiesQueryKey,
  getListNewsQueryKey
} from '@workspace/api-client-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// SCHEMAS
const loginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

const citySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  treasury: z.string().min(1, 'Treasury is required'),
  reputation: z.string().min(1, 'Reputation is required'),
  founder: z.string().min(1, 'Founder is required'),
  population: z.string().min(1, 'Population is required'),
  coordinates_x: z.string().min(1, 'X coordinate is required'),
  coordinates_z: z.string().min(1, 'Z coordinate is required'),
  map_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  spawn_command: z.string().min(1, 'Spawn command is required'),
  photos: z.array(z.object({ value: z.string().url('Must be a valid image URL') })).optional(),
});

const newsSchema = z.object({
  content: z.string().min(5, 'News content must be at least 5 characters'),
});

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  const loginMutation = useAdminLogin({
    mutation: {
      onSuccess: (data) => {
        if (data.success && data.token) {
          localStorage.setItem('admin_token', data.token);
          setIsAuthenticated(true);
          toast({ title: 'Access granted', description: 'Welcome to the control panel.' });
        } else {
          toast({ title: 'Access denied', description: 'Invalid credentials.', variant: 'destructive' });
        }
      },
      onError: () => {
        toast({ title: 'Access denied', description: 'Invalid credentials.', variant: 'destructive' });
      }
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    toast({ title: 'Logged out', description: 'You have been logged out.' });
  };

  if (isCheckingAuth) return null;

  if (!isAuthenticated) {
    return <AdminLogin onLogin={(password) => loginMutation.mutate({ data: { password } })} isPending={loginMutation.isPending} />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-pixel text-primary mb-2">Admin Console</h1>
          <p className="text-muted-foreground">Manage cities and server news.</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="border-border">
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>

      <Tabs defaultValue="cities" className="space-y-6">
        <TabsList className="bg-card border border-border pixel-shadow h-12">
          <TabsTrigger value="cities" className="font-pixel text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Building className="w-4 h-4 mr-2" /> Cities
          </TabsTrigger>
          <TabsTrigger value="news" className="font-pixel text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Newspaper className="w-4 h-4 mr-2" /> News
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="cities">
          <CitiesManager queryClient={queryClient} toast={toast} />
        </TabsContent>
        
        <TabsContent value="news">
          <NewsManager queryClient={queryClient} toast={toast} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminLogin({ onLogin, isPending }: { onLogin: (password: string) => void, isPending: boolean }) {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { password: '' }
  });

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card pixel-shadow">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 bg-primary/20 rounded-lg mx-auto flex items-center justify-center mb-4 border border-primary/50">
            <Building className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="font-pixel text-lg">Restricted Access</CardTitle>
          <CardDescription>Enter admin password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => onLogin(d.password))} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="text-center tracking-widest text-lg" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full pixel-shadow" disabled={isPending}>
                {isPending ? 'Authenticating...' : 'Authenticate'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function CitiesManager({ queryClient, toast }: any) {
  const { data: cities, isLoading } = useListCities();
  
  const deleteCity = useDeleteCity({
    mutation: {
      onSuccess: () => {
        toast({ title: 'City deleted', description: 'The city has been removed from the atlas.' });
        queryClient.invalidateQueries({ queryKey: getListCitiesQueryKey() });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to delete city.', variant: 'destructive' })
    }
  });

  const createCity = useCreateCity({
    mutation: {
      onSuccess: () => {
        toast({ title: 'City added', description: 'A new city has been registered.' });
        queryClient.invalidateQueries({ queryKey: getListCitiesQueryKey() });
      },
      onError: () => toast({ title: 'Error', description: 'Failed to create city.', variant: 'destructive' })
    }
  });

  const form = useForm<z.infer<typeof citySchema>>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      name: '', description: '', treasury: '', reputation: 'Neutral', 
      founder: '', population: '1', coordinates_x: '0', coordinates_z: '0',
      map_link: '', spawn_command: '/t spawn ', photos: []
    }
  });

  const { fields: photoFields, append: appendPhoto, remove: removePhoto } = useFieldArray({
    control: form.control,
    name: "photos"
  });

  const onSubmit = (data: z.infer<typeof citySchema>) => {
    const payload = {
      ...data,
      map_link: data.map_link || undefined,
      photos: data.photos?.map(p => p.value).filter(Boolean) || []
    };
    createCity.mutate({ data: payload as any }, {
      onSuccess: () => form.reset()
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Create Form */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-pixel text-sm">Register New City</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>City Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="founder" render={({ field }) => (
                  <FormItem><FormLabel>Founder</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea className="h-20" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="reputation" render={({ field }) => (
                  <FormItem><FormLabel>Reputation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="treasury" render={({ field }) => (
                  <FormItem><FormLabel>Treasury</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="population" render={({ field }) => (
                  <FormItem><FormLabel>Population</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="coordinates_x" render={({ field }) => (
                  <FormItem><FormLabel>Coord X</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="coordinates_z" render={({ field }) => (
                  <FormItem><FormLabel>Coord Z</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="spawn_command" render={({ field }) => (
                  <FormItem><FormLabel>Spawn Command</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="map_link" render={({ field }) => (
                  <FormItem><FormLabel>Dynmap Link (optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Photos (URLs)</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendPhoto({ value: '' })} className="h-7 text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Add Photo
                  </Button>
                </div>
                {photoFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <FormField control={form.control} name={`photos.${index}.value`} render={({ field }) => (
                      <FormItem className="flex-1 space-y-0"><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => removePhoto(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full mt-4" disabled={createCity.isPending}>
                {createCity.isPending ? 'Creating...' : 'Register City'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-pixel text-sm">Existing Cities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : cities?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">No cities found.</div>
            ) : (
              cities?.map(city => (
                <div key={city.id} className="flex justify-between items-center p-3 bg-background border border-border rounded-lg group">
                  <div>
                    <p className="font-bold text-primary font-pixel text-[10px] mb-1">{city.name}</p>
                    <p className="text-xs text-muted-foreground">Pop: {city.population} • X:{city.coordinates_x} Z:{city.coordinates_z}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      if(window.confirm(`Delete ${city.name}?`)) {
                        deleteCity.mutate({ id: city.id });
                      }
                    }}
                    disabled={deleteCity.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NewsManager({ queryClient, toast }: any) {
  const { data: news, isLoading } = useListNews();
  
  const deleteNews = useDeleteNews({
    mutation: {
      onSuccess: () => {
        toast({ title: 'News deleted' });
        queryClient.invalidateQueries({ queryKey: getListNewsQueryKey() });
      }
    }
  });

  const createNews = useCreateNews({
    mutation: {
      onSuccess: () => {
        toast({ title: 'News posted' });
        queryClient.invalidateQueries({ queryKey: getListNewsQueryKey() });
      }
    }
  });

  const form = useForm<z.infer<typeof newsSchema>>({
    resolver: zodResolver(newsSchema),
    defaultValues: { content: '' }
  });

  const onSubmit = (data: z.infer<typeof newsSchema>) => {
    createNews.mutate({ data }, {
      onSuccess: () => form.reset()
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-pixel text-sm">Post News Item</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem>
                  <FormLabel>Message content</FormLabel>
                  <FormControl>
                    <Textarea className="h-32" placeholder="Announce server events, lore updates..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={createNews.isPending}>
                {createNews.isPending ? 'Posting...' : 'Broadcast'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-pixel text-sm">News History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : news?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">No news found.</div>
            ) : (
              news?.map(item => (
                <div key={item.id} className="p-4 bg-background border border-border rounded-lg group relative pr-12">
                  <p className="text-sm">{item.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-2 font-mono">{new Date(item.created_at).toLocaleString()}</p>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={() => {
                      if(window.confirm('Delete this news item?')) {
                        deleteNews.mutate({ id: item.id });
                      }
                    }}
                    disabled={deleteNews.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
