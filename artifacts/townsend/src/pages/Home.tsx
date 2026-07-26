import React, { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import Fuse from 'fuse.js';
import { Search, Info, Coins, Users, Calendar, MapPin, Map as MapIcon, ChevronRight } from 'lucide-react';
import { useListCities, useGetCityStats, useListNews } from '@workspace/api-client-react';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { data: cities, isLoading: citiesLoading } = useListCities();
  const { data: stats, isLoading: statsLoading } = useGetCityStats();
  const { data: news, isLoading: newsLoading } = useListNews();
  
  const [searchQuery, setSearchQuery] = useState('');

  const fuse = useMemo(() => {
    if (!cities) return null;
    return new Fuse(cities, {
      keys: ['name', 'description', 'founder'],
      threshold: 0.3,
    });
  }, [cities]);

  const filteredCities = useMemo(() => {
    if (!cities) return [];
    if (!searchQuery.trim()) return cities;
    if (!fuse) return cities;
    
    return fuse.search(searchQuery).map(result => result.item);
  }, [cities, searchQuery, fuse]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Main Content - Cities Grid */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-pixel mb-2">Explore Cities</h1>
              <p className="text-muted-foreground">Discover settlements across the server.</p>
            </div>
            
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Find a city..." 
                className="pl-9 bg-card border-card-border focus-visible:ring-primary h-12 pixel-shadow"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {citiesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="overflow-hidden border-border bg-card">
                  <div className="h-32 bg-muted animate-pulse" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCities.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-border rounded-lg bg-card/50">
              <MapIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-pixel text-lg text-muted-foreground mb-2">No cities found</h3>
              <p className="text-sm text-muted-foreground">Try a different search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCities.map(city => (
                <Link key={city.id} href={`/city/${city.id}`} className="block group">
                  <Card className="h-full overflow-hidden border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 pixel-shadow group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
                    {city.photos && city.photos.length > 0 ? (
                      <div className="h-32 overflow-hidden relative">
                        <img 
                          src={city.photos[0]} 
                          alt={city.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.classList.add('bg-muted');
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                      </div>
                    ) : (
                      <div className="h-32 bg-muted relative flex items-center justify-center border-b border-border">
                        <MapIcon className="w-8 h-8 text-muted-foreground/30" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                      </div>
                    )}
                    
                    <CardHeader className="-mt-8 relative z-10 pb-2">
                      <div className="flex justify-between items-end mb-1">
                        <CardTitle className="font-pixel text-[13px] text-primary">{city.name}</CardTitle>
                        <Badge variant="outline" className="bg-background/80 backdrop-blur text-[10px] uppercase font-bold border-primary/20 text-primary">
                          {city.reputation}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2 h-10">
                        {city.description}
                      </p>
                    </CardHeader>
                    
                    <CardContent className="pb-4">
                      <div className="grid grid-cols-2 gap-y-2 text-xs">
                        <div className="flex items-center text-muted-foreground">
                          <Coins className="w-3 h-3 mr-1.5 text-yellow-500" />
                          <span className="truncate">{city.treasury}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Users className="w-3 h-3 mr-1.5 text-blue-400" />
                          <span>{city.population}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground col-span-2">
                          <MapPin className="w-3 h-3 mr-1.5 text-red-400" />
                          <span>X:{city.coordinates_x} Z:{city.coordinates_z}</span>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-0 border-t border-border/50 flex justify-between items-center text-[10px] text-muted-foreground bg-muted/10 h-10">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Updated {city.last_updated ? format(new Date(city.last_updated), 'MMM d, yyyy') : 'Unknown'}
                      </span>
                      <span className="group-hover:text-primary flex items-center font-bold">
                        Read more <ChevronRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 space-y-6">
          <Card className="border-border bg-card pixel-shadow">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="font-pixel text-sm flex items-center">
                <Info className="w-4 h-4 mr-2 text-primary" />
                Server Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {statsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Cities</span>
                    <span className="font-bold text-primary font-pixel text-[10px]">{stats?.total_cities || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Comments</span>
                    <span className="font-bold text-primary font-pixel text-[10px]">{stats?.total_comments || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">News Items</span>
                    <span className="font-bold text-primary font-pixel text-[10px]">{stats?.total_news || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card pixel-shadow">
            <CardHeader className="pb-3 border-b border-border/50 bg-primary/5">
              <CardTitle className="font-pixel text-sm flex items-center text-primary">
                Latest News
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              {newsLoading ? (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : news && news.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {news.map(item => (
                    <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="text-xs text-muted-foreground mb-1 font-mono">
                        {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')}
                      </div>
                      <p className="text-sm">{item.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No news available.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
