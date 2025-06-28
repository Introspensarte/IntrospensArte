import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Share, Send, Calendar, ExternalLink, X, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { Activity, User as UserType } from "@shared/schema";
import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Comment {
  id: number;
  content: string;
  createdAt?: string;
  user?: UserType;
}

interface ActivityWithUser extends Activity {
  user: UserType;
}

function ActivityModal({ 
  activity, 
  isOpen, 
  onClose, 
  user, 
  onLike, 
  onComment, 
  newComment, 
  setNewComment,
  getComments 
}: {
  activity: ActivityWithUser | null;
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLike: (activityId: number) => void;
  onComment: (activityId: number) => void;
  newComment: string;
  setNewComment: (value: string) => void;
  getComments: (activityId: number) => any;
}) {
  if (!activity) return null;

  const { data: comments = [], isLoading } = getComments(activity.id!);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: activity.name,
        text: activity.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "narrativa": return "bg-purple-500/20 text-purple-400";
      case "microcuento": return "bg-blue-500/20 text-blue-400";
      case "drabble": return "bg-green-500/20 text-green-400";
      case "hilo": return "bg-orange-500/20 text-orange-400";
      case "rol": return "bg-pink-500/20 text-pink-400";
      case "otro": return "bg-gray-500/20 text-gray-400";
      default: return "bg-medium-gray/20 text-medium-gray";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-black/95 border-medium-gray/30 p-0">
        <div className="flex h-full">
          {/* Image Section */}
          <div className="w-1/2 bg-black">
            <img 
              src={activity.image || 'https://scontent.fpaz4-1.fna.fbcdn.net/v/t39.30808-6/489621375_122142703550426409_3085208440656935630_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=f727a1&_nc_ohc=k3C3nz46gW8Q7kNvwEYXQMV&_nc_oc=AdlXTRXFUrbiz7_hzcNduekaNgHmAeCPpHG_b3rp6XzBiffhfuO7oNx93k1uitgo5XXgdbQoAK9TyLTs8jl1cX5Z&_nc_zt=23&_nc_ht=scontent.fpaz4-1.fna&_nc_gid=25gzNMflzPt7ADWJVLmBQw&oh=00_AfNXDgfInFQk4CqIfy1P4v2_xNYSyNMF68AHIhUVm8ARiw&oe=68620DAA'} 
              alt={activity.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                console.log('Modal image failed to load:', target.src);
                target.src = "https://scontent.fpaz4-1.fna.fbcdn.net/v/t39.30808-6/489621375_122142703550426409_3085208440656935630_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=f727a1&_nc_ohc=k3C3nz46gW8Q7kNvwEYXQMV&_nc_oc=AdlXTRXFUrbiz7_hzcNduekaNgHmAeCPpHG_b3rp6XzBiffhfuO7oNx93k1uitgo5XXgdbQoAK9TyLTs8jl1cX5Z&_nc_zt=23&_nc_ht=scontent.fpaz4-1.fna&_nc_gid=25gzNMflzPt7ADWJVLmBQw&oh=00_AfNXDgfInFQk4CqIfy1P4v2_xNYSyNMF68AHIhUVm8ARiw&oe=68620DAA";
              }}
            />
          </div>

          {/* Content Section */}
          <div className="w-1/2 flex flex-col h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-medium-gray/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-soft-lavender/20 rounded-full flex items-center justify-center">
                    <span className="font-bold text-soft-lavender">
                      {activity.user?.fullName?.charAt(0) || "?"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{activity.user?.fullName}</h3>
                    <Badge variant="secondary" className="text-xs bg-soft-lavender/20 text-soft-lavender">
                      {activity.user?.signature}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-medium-gray hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">{activity.name}</h2>

              {/* Metadata */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className={`${getTypeColor(activity.type)} text-xs`}>
                  {activity.type}
                </Badge>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
                  {activity.arista}
                </Badge>
                <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
                  {activity.album}
                </Badge>
                <Badge variant="secondary" className="bg-soft-lavender/20 text-soft-lavender text-xs">
                  {activity.traces} trazos
                </Badge>
              </div>

              <div className="flex items-center text-sm text-medium-gray mb-4">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(activity.date).toLocaleDateString('es-ES')}
              </div>

              <p className="text-light-gray leading-relaxed mb-4">{activity.description}</p>

              {activity.link && (
                <a
                  href={activity.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-soft-lavender hover:text-white transition-colors mb-4"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver actividad completa
                </a>
              )}

              {/* Engagement buttons */}
              <div className="flex items-center space-x-4 pt-4 border-t border-medium-gray/20">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onLike(activity.id!)}
                  className={`transition-colors ${
                    activity.isLiked 
                      ? "text-red-400 hover:text-red-300" 
                      : "text-medium-gray hover:text-red-400"
                  }`}
                >
                  <Heart className={`w-5 h-5 mr-1 ${activity.isLiked ? "fill-current" : ""}`} />
                  {activity.likesCount || 0}
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-medium-gray hover:text-blue-400"
                >
                  <MessageCircle className="w-5 h-5 mr-1" />
                  {activity.commentsCount || 0}
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleShare}
                  className="text-medium-gray hover:text-soft-lavender"
                >
                  <Share className="w-5 h-5 mr-1" />
                  Compartir
                </Button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Comentarios</h4>

                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-soft-lavender"></div>
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-medium-gray text-center py-4">No hay comentarios aún</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment: Comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <div className="w-8 h-8 bg-soft-lavender/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-soft-lavender text-sm font-bold">
                            {comment.user?.fullName?.charAt(0) || "?"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="bg-medium-gray/10 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-white text-sm">
                                {comment.user?.fullName}
                              </span>
                              <Badge variant="secondary" className="text-xs bg-soft-lavender/20 text-soft-lavender">
                                {comment.user?.signature}
                              </Badge>
                            </div>
                            <p className="text-light-gray text-sm">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add comment */}
              {user && (
                <div className="p-6 border-t border-medium-gray/20">
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-soft-lavender/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-soft-lavender text-sm font-bold">
                        {user.fullName?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div className="flex-1 flex space-x-2">
                      <Input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escribe un comentario..."
                        className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender"
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            onComment(activity.id!);
                          }
                        }}
                      />
                      <Button
                        onClick={() => onComment(activity.id!)}
                        size="sm"
                        className="bg-soft-lavender/20 hover:bg-soft-lavender/30 text-soft-lavender"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<ActivityWithUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newComment, setNewComment] = useState("");

  const { data: activities = [], isLoading } = useQuery<ActivityWithUser[]>({
    queryKey: ["/api/activities", refreshKey],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/activities");
      const activitiesData = await response.json();

      // Get real likes and comments data for each activity
      const activitiesWithStats = await Promise.all(
        activitiesData.map(async (activity: any) => {
          try {
            // Get likes count
            const likesResponse = await apiRequest("GET", `/api/activities/${activity.id}/likes`);
            const likesData = await likesResponse.json();

            // Get comments count  
            const commentsResponse = await apiRequest("GET", `/api/activities/${activity.id}/comments`);
            const commentsData = await commentsResponse.json();

            // Check if current user liked this activity
            let isLiked = false;
            if (user?.id) {
              const userLikeResponse = await apiRequest("GET", `/api/activities/${activity.id}/likes/${user.id}`);
              isLiked = userLikeResponse.ok;
            }

            // Use image_url directly or fallback
            let imageUrl = activity.image_url || activity.imageUrl;
            
            // Use fallback image if no valid URL
            if (!imageUrl || imageUrl.trim() === '') {
              imageUrl = 'https://scontent.fpaz4-1.fna.fbcdn.net/v/t39.30808-6/489621375_122142703550426409_3085208440656935630_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=f727a1&_nc_ohc=k3C3nz46gW8Q7kNvwEYXQMV&_nc_oc=AdlXTRXFUrbiz7_hzcNduekaNgHmAeCPpHG_b3rp6XzBiffhfuO7oNx93k1uitgo5XXgdbQoAK9TyLTs8jl1cX5Z&_nc_zt=23&_nc_ht=scontent.fpaz4-1.fna&_nc_gid=25gzNMflzPt7ADWJVLmBQw&oh=00_AfNXDgfInFQk4CqIfy1P4v2_xNYSyNMF68AHIhUVm8ARiw&oe=68620DAA';
            }

            return {
              ...activity,
              image: imageUrl,
              likesCount: likesData.count || 0,
              commentsCount: commentsData.length || 0,
              isLiked,
              wordCount: activity.word_count || activity.wordCount || 0
            };
          } catch (error) {
            console.error('Error loading activity stats:', error);
            return {
              ...activity,
              image: 'https://scontent.fpaz4-1.fna.fbcdn.net/v/t39.30808-6/489621375_122142703550426409_3085208440656935630_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=f727a1&_nc_ohc=k3C3nz46gW8Q7kNvwEYXQMV&_nc_oc=AdlXTRXFUrbiz7_hzcNduekaNgHmAeCPpHG_b3rp6XzBiffhfuO7oNx93k1uitgo5XXgdbQoAK9TyLTs8jl1cX5Z&_nc_zt=23&_nc_ht=scontent.fpaz4-1.fna&_nc_gid=25gzNMflzPt7ADWJVLmBQw&oh=00_AfNXDgfInFQk4CqIfy1P4v2_xNYSyNMF68AHIhUVm8ARiw&oe=68620DAA',
              likesCount: 0,
              commentsCount: 0,
              isLiked: false,
              wordCount: activity.word_count || activity.wordCount || 0
            };
          }
        })
      );

      return activitiesWithStats;
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Like/Unlike mutation
  const likeMutation = useMutation({
    mutationFn: async ({ activityId, userId }: { activityId: number; userId: number }) => {
      const response = await apiRequest("POST", `/api/activities/${activityId}/like`, { userId });
      return response.json();
    },
    onSuccess: () => {
      // Refresh dashboard data
      setRefreshKey(prev => prev + 1);
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo procesar el like",
        variant: "destructive",
      });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async ({ activityId, userId, content }: { activityId: number; userId: number; content: string }) => {
      const response = await apiRequest("POST", `/api/activities/${activityId}/comments`, { userId, content });
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Refresh dashboard data
      setRefreshKey(prev => prev + 1);
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/${variables.activityId}/comments`] });
      setNewComment("");
      toast({
        title: "Comentario añadido",
        description: "Tu comentario se ha publicado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo añadir el comentario",
        variant: "destructive",
      });
    },
  });

  // Get comments for specific activity
  const getComments = (activityId: number) => {
    return useQuery<Comment[]>({
      queryKey: [`/api/activities/${activityId}/comments`],
      queryFn: async () => {
        const response = await apiRequest("GET", `/api/activities/${activityId}/comments`);
        return response.json();
      },
      enabled: isModalOpen && selectedActivity?.id === activityId,
    });
  };

  // Shuffle activities randomly each time
  const shuffledActivities = useMemo(() => {
    const shuffled = [...activities];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [activities, refreshKey]);

  const handleLike = (activityId: number) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para dar like",
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate({ activityId, userId: user.id! });
  };

  const handleComment = (activityId: number) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para comentar",
        variant: "destructive",
      });
      return;
    }

    const content = newComment?.trim();
    if (!content) return;

    commentMutation.mutate({ activityId, userId: user.id!, content });
  };

  const openActivityModal = (activity: ActivityWithUser) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const refreshFeed = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Auto-refresh when user interacts with the app or when activities change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshFeed();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soft-lavender"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-6xl mx-auto animate-slide-up pt-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-playfair text-5xl font-bold mb-4 text-soft-lavender">
            Galería Creativa
          </h1>
          <div className="decorative-line mb-4"></div>
          <p className="text-light-gray text-lg mb-6">
            Descubre el trabajo artístico de toda la comunidad
          </p>

          <Button 
            onClick={refreshFeed}
            className="bg-soft-lavender/20 hover:bg-soft-lavender/30 text-soft-lavender border border-soft-lavender/30"
          >
            Mezclar actividades
          </Button>
        </div>

        {/* Pinterest-style Grid - 2 Columns */}
        {shuffledActivities.length === 0 ? (
          <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                ¡El lienzo está en blanco!
              </h3>
              <p className="text-light-gray mb-6">
                Aún no hay actividades compartidas. Sé el primero en compartir tu arte.
              </p>
              <Link href="/upload">
                <Button className="bg-soft-lavender/20 hover:bg-soft-lavender/30 text-soft-lavender">
                  Subir mi primera actividad
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {shuffledActivities.map((activity) => (
              <Card 
                key={activity.id} 
                className="bg-black/40 backdrop-blur-sm border-medium-gray/20 hover:border-soft-lavender/30 transition-all duration-300 cursor-pointer group overflow-hidden"
                onClick={() => openActivityModal(activity)}
              >
                <div className="relative">
                  <img 
                    src={activity.image || 'https://scontent.fpaz4-1.fna.fbcdn.net/v/t39.30808-6/489621375_122142703550426409_3085208440656935630_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=f727a1&_nc_ohc=k3C3nz46gW8Q7kNvwEYXQMV&_nc_oc=AdlXTRXFUrbiz7_hzcNduekaNgHmAeCPpHG_b3rp6XzBiffhfuO7oNx93k1uitgo5XXgdbQoAK9TyLTs8jl1cX5Z&_nc_zt=23&_nc_ht=scontent.fpaz4-1.fna&_nc_gid=25gzNMflzPt7ADWJVLmBQw&oh=00_AfNXDgfInFQk4CqIfy1P4v2_xNYSyNMF68AHIhUVm8ARiw&oe=68620DAA'} 
                    alt={activity.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.log('Image failed to load:', target.src);
                      target.src = 'https://scontent.fpaz4-1.fna.fbcdn.net/v/t39.30808-6/489621375_122142703550426409_3085208440656935630_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=f727a1&_nc_ohc=k3C3nz46gW8Q7kNvwEYXQMV&_nc_oc=AdlXTRXFUrbiz7_hzcNduekaNgHmAeCPpHG_b3rp6XzBiffhfuO7oNx93k1uitgo5XXgdbQoAK9TyLTs8jl1cX5Z&_nc_zt=23&_nc_ht=scontent.fpaz4-1.fna&_nc_gid=25gzNMflzPt7ADWJVLmBQw&oh=00_AfNXDgfInFQk4CqIfy1P4v2_xNYSyNMF68AHIhUVm8ARiw&oe=68620DAA';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-soft-lavender font-medium">{activity.user?.signature}</span>
                      <div className="flex gap-2">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {activity.likesCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {activity.commentsCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-white text-sm line-clamp-2 leading-tight mb-1">
                    {activity.name}
                  </h3>
                  <p className="text-xs text-light-gray">Por {activity.user?.fullName}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load more button */}
        {shuffledActivities.length > 0 && (
          <div className="text-center mt-12">
            <Button 
              onClick={refreshFeed}
              variant="outline"
              className="border-soft-lavender/30 text-soft-lavender hover:bg-soft-lavender/10"
            >
              Cargar más contenido
            </Button>
          </div>
        )}
      </div>

      {/* Activity Modal */}
      <ActivityModal 
        activity={selectedActivity}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedActivity(null);
          setNewComment("");
        }}
        user={user}
        onLike={handleLike}
        onComment={handleComment}
        newComment={newComment}
        setNewComment={setNewComment}
        getComments={getComments}
      />
    </div>
  );
}