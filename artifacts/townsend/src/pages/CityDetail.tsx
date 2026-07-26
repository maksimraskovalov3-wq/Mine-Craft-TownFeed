import React, { useState, useRef, useCallback } from 'react';
import { useRoute, Link } from 'wouter';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Map, MapPin, Users, Coins, Pickaxe, Calendar, ExternalLink, ArrowLeft, Copy, Check, MessageSquare } from 'lucide-react';
import { useGetCity, useListComments, useCreateComment, getListCommentsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const commentSchema = z.object({
  nickname: z.string().min(2, "Nickname must be at least 2 characters").max(30),
  content: z.string().min(3, "Comment must be at least 3 characters").max(500),
});

type CommentFormValues = z.infer<typeof commentSchema>;

export default function CityDetail() {
  const [, params] = useRoute('/city/:id');
  const id = params?.id || '';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: city, isLoading: cityLoading, error: cityError } = useGetCity(id, { 
    query: { enabled: !!id, queryKey: ['/api/cities', id] } 
  });
  
  const { data: comments, isLoading: commentsLoading } = useListComments(id, {
    query: { enabled: !!id, queryKey: getListCommentsQueryKey(id) }
  });

  const createComment = useCreateComment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(id) });
        toast({ title: "Success", description: "Comment added successfully!" });
        form.reset();
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to post comment. Try again.", variant: "destructive" });
      }
    }
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!city) return;
    navigator.clipboard.writeText(city.spawn_command || `/t spawn ${city.name}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      nickname: '',
      content: '',
    },
  });

  const onSubmit = (data: CommentFormValues) => {
    createComment.mutate({ id, data });
  };

  if (cityLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-8 w-24 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (cityError || !city) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Map className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h1 className="text-2xl font-pixel text-destructive mb-2">City Not Found</h1>
        <p className="text-muted-foreground mb-8">The city you're looking for doesn't exist or has fallen to ruin.</p>
        <Link href="/">
          <Button variant="outline" className="font-pixel text-[10px]">Return to Map</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6 font-medium">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Catalog
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-pixel text-primary">{city.name}</h1>
            <Badge variant="outline" className="bg-background text-xs uppercase font-bold border-primary/20 text-primary">
              {city.reputation}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center mt-3">
            <Pickaxe className="w-4 h-4 mr-2" /> Founded by <strong className="ml-1 text-foreground">{city.founder}</strong>
          </p>
        </div>
        
        {city.map_link && (
          <Button asChild className="pixel-shadow">
            <a href={city.map_link} target="_blank" rel="noopener noreferrer">
              <Map className="w-4 h-4 mr-2" /> Show on Map <ExternalLink className="w-3 h-3 ml-2 opacity-70" />
            </a>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Photo Collage */}
          {city.photos && city.photos.length > 0 && (
            <div className={`grid gap-2 ${city.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} rounded-xl overflow-hidden border border-border pixel-shadow`}>
              {city.photos.slice(0, 4).map((photo, i) => (
                <div key={i} className={`relative group ${city.photos.length === 3 && i === 0 ? 'col-span-2 aspect-[21/9]' : 'aspect-video'}`}>
                  <img 
                    src={photo} 
                    alt={`${city.name} screenshot ${i + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.classList.add('bg-muted', 'flex', 'items-center', 'justify-center');
                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-muted-foreground">Image missing</span>';
                    }}
                  />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="prose prose-invert max-w-none">
            <p className="text-lg leading-relaxed text-foreground/90">{city.description}</p>
          </div>

          {/* Comments Section */}
          <div className="pt-8 border-t border-border">
            <h3 className="text-xl font-pixel mb-6 flex items-center">
              <MessageSquare className="w-5 h-5 mr-3 text-primary" /> 
              Travelers' Log
            </h3>
            
            <div className="space-y-6 mb-8">
              {commentsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : comments && comments.length > 0 ? (
                comments.map(comment => (
                  <div key={comment.id} className="bg-card border border-border p-4 rounded-lg flex gap-4">
                    <div className="w-10 h-10 rounded bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {comment.avatar_url ? (
                         <img src={comment.avatar_url} alt={comment.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-pixel text-[10px] text-muted-foreground">{comment.nickname.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-primary">{comment.nickname}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(comment.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground italic text-sm">No log entries yet. Be the first to leave your mark.</p>
              )}
            </div>

            <Card className="border-border bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-pixel">Leave a comment</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nickname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nickname</FormLabel>
                          <FormControl>
                            <Input placeholder="Steve" className="bg-background" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea placeholder="What did you see in this city?" className="min-h-24 bg-background" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={createComment.isPending} className="w-full sm:w-auto">
                      {createComment.isPending ? 'Posting...' : 'Post Entry'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card className="border-border bg-card pixel-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="font-pixel text-sm">City Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center p-3 bg-background rounded border border-border">
                <Users className="w-5 h-5 text-blue-400 mr-3" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Population</p>
                  <p className="font-bold">{city.population}</p>
                </div>
              </div>
              
              <div className="flex items-center p-3 bg-background rounded border border-border">
                <Coins className="w-5 h-5 text-yellow-500 mr-3" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Treasury</p>
                  <p className="font-bold">{city.treasury}</p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-background rounded border border-border">
                <MapPin className="w-5 h-5 text-red-400 mr-3" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Coordinates</p>
                  <p className="font-bold font-mono text-sm">X: {city.coordinates_x} / Z: {city.coordinates_z}</p>
                </div>
              </div>

              {city.last_updated && (
                <div className="flex items-center p-3 bg-background rounded border border-border">
                  <Calendar className="w-5 h-5 text-green-400 mr-3" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Last Updated</p>
                    <p className="font-bold text-sm">{format(new Date(city.last_updated), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* How to get there */}
          <Card className="border-border bg-card pixel-shadow">
            <CardHeader className="pb-4">
              <CardTitle className="font-pixel text-sm">How to get there</CardTitle>
              <CardDescription>Use this command in-game to teleport to the city spawn.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative group">
                <div className="bg-background border border-border rounded p-3 font-mono text-sm text-primary pr-12 overflow-x-auto whitespace-nowrap">
                  {city.spawn_command || `/t spawn ${city.name}`}
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-1 top-1 h-9 w-9 bg-card/50 hover:bg-card hover:text-primary transition-colors"
                  onClick={handleCopy}
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
