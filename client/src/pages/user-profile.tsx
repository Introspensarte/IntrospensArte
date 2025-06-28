import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { MEDALS } from "@/lib/constants";
import type { User, Activity } from "@shared/schema";

function getRankColor(rank: string) {
  switch (rank) {
    case "Alma en tránsito":
      return "bg-yellow-500/20 text-yellow-400";
    case "Voz en boceto":
      return "bg-red-500/20 text-red-400";
    case "Narrador de atmósferas":
      return "bg-green-500/20 text-green-400";
    case "Escritor de introspecciones":
      return "bg-blue-500/20 text-blue-400";
    case "Arquitecto del alma":
      return "bg-purple-500/20 text-purple-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
}

export default function UserProfile() {
  const { userId } = useParams();
  const [, setLocation] = useLocation();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: [`/api/users/${userId}/activities`],
    enabled: !!userId,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: bonusHistory = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/bonus-history`],
    enabled: !!userId,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soft-lavender"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Usuario no encontrado</h1>
          <Button onClick={() => setLocation("/rankings")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Rankings
          </Button>
        </div>
      </div>
    );
  }

  const userMedal = MEDALS.find(m => m.rank === user.rank)?.medal;

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case "narrativa":
        return "bg-purple-500/20 text-purple-400";
      case "microcuento":
        return "bg-blue-500/20 text-blue-400";
      case "drabble":
        return "bg-green-500/20 text-green-400";
      case "hilo":
        return "bg-orange-500/20 text-orange-400";
      case "rol":
        return "bg-pink-500/20 text-pink-400";
      case "otro":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-medium-gray/20 text-medium-gray";
    }
  };

  const getAristaColor = (arista: string) => {
    switch (arista) {
      case "introspeccion":
        return "bg-soft-lavender/20 text-soft-lavender";
      case "nostalgia":
        return "bg-blue-400/20 text-blue-400";
      case "amor":
        return "bg-pink-400/20 text-pink-400";
      case "fantasia":
        return "bg-purple-400/20 text-purple-400";
      case "misterio":
        return "bg-yellow-400/20 text-yellow-400";
      case "actividades-express":
        return "bg-orange-400/20 text-orange-400";
      default:
        return "bg-medium-gray/20 text-medium-gray";
    }
  };

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-6xl mx-auto animate-slide-up pt-16">
        {/* Back button */}
        <div className="mb-8">
          <Button
            onClick={() => setLocation("/rankings")}
            variant="outline"
            className="border-soft-lavender/30 text-soft-lavender hover:bg-soft-lavender/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Rankings
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {/* Profile Information */}
          <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
            <CardHeader>
              <CardTitle className="font-playfair text-2xl">Perfil de Usuario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{user.fullName}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="bg-soft-lavender/20 text-soft-lavender">
                      {user.signature}
                    </Badge>
                    {user.role === "admin" && (
                      <Badge variant="destructive" className="bg-yellow-500/50 text-yellow-300">
                        Admin
                      </Badge>
                    )}
                    <Badge className={getRankColor(user.rank)}>{user.rank}</Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p><span className="text-light-gray">Edad:</span> {user.age} años</p>
                  <p><span className="text-light-gray">Cumpleaños:</span> {user.birthday}</p>
                  <p><span className="text-light-gray">Rango:</span> {user.rank}</p>
                  {userMedal && (
                    <p><span className="text-light-gray">Medalla:</span> {userMedal}</p>
                  )}
                  {user.facebookLink && (
                    <p>
                      <span className="text-light-gray">Facebook:</span>{" "}
                      <a 
                        href={user.facebookLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-soft-lavender hover:text-white transition-colors"
                      >
                        Ver perfil
                      </a>
                    </p>
                  )}
                  <p>
                    <span className="text-light-gray">Miembro desde:</span>{" "}
                    {new Date(user.createdAt!).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
            <CardHeader>
              <CardTitle className="font-playfair text-2xl">Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-soft-lavender">{user.totalTraces}</div>
                  <div className="text-sm text-light-gray">Trazos totales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-soft-lavender">{user.totalWords}</div>
                  <div className="text-sm text-light-gray">Palabras</div>
                </div>
              </div>

              <div className="text-center mb-6">
                <div className="text-2xl font-bold text-soft-lavender">{user.totalActivities}</div>
                <div className="text-sm text-light-gray">Actividades realizadas</div>
              </div>
            </CardContent>
          </Card>

          {/* User Activities */}
          <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20 lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-playfair text-2xl">Actividades</CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="p-3 bg-medium-gray/10 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-white text-sm mb-1">{activity.name}</h4>
                          <div className="flex flex-wrap gap-1 mb-2">
                            <Badge className={getActivityTypeColor(activity.type)}>
                              {activity.type}
                            </Badge>
                            <Badge className={getAristaColor(activity.arista)}>
                              {activity.arista.replace('-', ' ')}
                            </Badge>
                          </div>
                          <div className="text-xs text-light-gray space-y-1">
                            <p><span className="text-medium-gray">Álbum:</span> {activity.album}</p>
                            <p><span className="text-medium-gray">Palabras:</span> {activity.word_count || activity.wordCount || 0} • <span className="text-medium-gray">Trazos:</span> {activity.traces}</p>
                            <p><span className="text-medium-gray">Fecha:</span> {new Date(activity.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      {activity.link && (
                        <a
                          href={activity.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver actividad
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-medium-gray text-sm">Este usuario no tiene actividades aún</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cronología Bonus */}
          <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20 lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-playfair text-2xl">Cronología Bonus</CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              {bonusHistory.length > 0 ? (
                <div className="space-y-3">
                  {bonusHistory.map((bonus) => (
                    <div key={bonus.id} className="p-3 bg-gradient-to-r from-gold/10 to-soft-lavender/10 rounded-lg border border-gold/20">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-white text-sm mb-1">{bonus.title}</h4>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-gold/20 text-gold">
                              +{bonus.traces} trazos
                            </Badge>
                            <Badge variant="outline" className="text-xs border-medium-gray/30 text-medium-gray">
                              {bonus.type === 'registration' ? 'Registro' : 
                               bonus.type === 'birthday' ? 'Cumpleaños' : 
                               bonus.type === 'admin_assignment' ? 'Admin' : bonus.type}
                            </Badge>
                          </div>
                          <div className="text-xs text-light-gray space-y-1">
                            <p><span className="text-medium-gray">Fecha:</span> {new Date(bonus.createdAt).toLocaleDateString()}</p>
                            {bonus.reason && (
                              <p><span className="text-medium-gray">Motivo:</span> {bonus.reason}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-medium-gray text-sm">Este usuario no tiene bonificaciones registradas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}