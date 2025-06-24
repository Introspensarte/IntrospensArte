import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Check, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

export default function Notifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: [`/api/users/${user?.id}/notifications`],
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest("PUT", `/api/notifications/${notificationId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/notifications`] });
      toast({
        title: "Notificación marcada como leída",
        description: "La notificación ha sido actualizada",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo marcar la notificación",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-light-gray">Debes iniciar sesión para ver las notificaciones</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soft-lavender"></div>
      </div>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto animate-slide-up pt-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-playfair text-5xl font-bold mb-4">Notificaciones</h1>
          <div className="decorative-line mb-4"></div>
          <p className="text-light-gray text-lg">Mantente al día con las últimas actualizaciones</p>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-black/20 backdrop-blur-sm border-medium-gray/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-3">
                <Bell className="w-8 h-8 text-soft-lavender" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-soft-lavender">{unreadNotifications.length}</div>
                  <div className="text-light-gray">Sin leer</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-black/20 backdrop-blur-sm border-medium-gray/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-3">
                <Check className="w-8 h-8 text-green-500" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{readNotifications.length}</div>
                  <div className="text-light-gray">Leídas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <div className="space-y-6">
          {/* Unread Notifications */}
          {unreadNotifications.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <Bell className="w-5 h-5 text-soft-lavender" />
                <span>Nuevas notificaciones</span>
              </h2>
              
              <div className="space-y-3">
                {unreadNotifications.map((notification) => (
                  <Card key={notification.id} className="bg-black/40 backdrop-blur-sm border-soft-lavender/30 hover:border-soft-lavender/50 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-white text-lg">{notification.title}</h3>
                            <Badge variant="secondary" className="bg-soft-lavender/20 text-soft-lavender">
                              Nuevo
                            </Badge>
                          </div>
                          
                          <p className="text-light-gray mb-3 leading-relaxed">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center space-x-1 text-sm text-medium-gray">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(notification.createdAt!).toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markAsReadMutation.isPending}
                          size="sm"
                          className="ml-4 bg-soft-lavender/20 text-soft-lavender hover:bg-soft-lavender/30 border border-soft-lavender/30"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Marcar como leída
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Read Notifications */}
          {readNotifications.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                <BellOff className="w-5 h-5 text-green-500" />
                <span>Notificaciones leídas</span>
              </h2>
              
              <div className="space-y-3">
                {readNotifications.map((notification) => (
                  <Card key={notification.id} className="bg-black/20 backdrop-blur-sm border-medium-gray/10 opacity-75">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-2">{notification.title}</h3>
                          <p className="text-light-gray mb-3 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-1 text-sm text-medium-gray">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(notification.createdAt!).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {notifications.length === 0 && (
            <Card className="bg-black/20 backdrop-blur-sm border-medium-gray/10">
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-medium-gray/20 rounded-full flex items-center justify-center">
                    <Bell className="w-8 h-8 text-medium-gray" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">No hay notificaciones</h3>
                    <p className="text-light-gray">
                      Las notificaciones aparecerán aquí cuando haya actualizaciones importantes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
