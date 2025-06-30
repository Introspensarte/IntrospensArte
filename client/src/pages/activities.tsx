import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { ARISTAS } from "@/lib/constants";
import { ChevronDown, ChevronUp, ExternalLink, Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import type { PlannedActivity } from "@shared/schema";

interface ActivityWithTimer extends PlannedActivity {
  timeRemaining?: string;
  isExpired?: boolean;
}

interface ActivityCompletion {
  activityId: number;
  isCompleted: boolean;
  completionCount: number;
}

export default function Activities() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);
  const [activitiesWithTimers, setActivitiesWithTimers] = useState<ActivityWithTimer[]>([]);
  const [openAristas, setOpenAristas] = useState<string[]>([]);
  const [completedActivities, setCompletedActivities] = useState<{ [key: number]: ActivityCompletion }>({});

  const { data: activities = [], isLoading } = useQuery<PlannedActivity[]>({
    queryKey: ["/api/planned-activities"],
  });

  // Load completed activities from localStorage
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`completed-activities-${user.id}`);
      if (saved) {
        try {
          setCompletedActivities(JSON.parse(saved));
        } catch (error) {
          console.error("Error loading completed activities:", error);
        }
      }
    }
  }, [user?.id]);

  // Save completed activities to localStorage
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`completed-activities-${user.id}`, JSON.stringify(completedActivities));
    }
  }, [completedActivities, user?.id]);

  console.log("Loaded activities:", activities);

  useEffect(() => {
    if (activities.length === 0) return;

    const calculateTimeRemaining = () => {
      const now = new Date();
      const updatedActivities = activities.map(activity => {
        if (activity.arista === "actividades-express" && activity.album === "actividad-express" && activity.deadline) {
          const deadline = new Date(activity.deadline);
          const timeDiff = deadline.getTime() - now.getTime();

          if (timeDiff <= 0) {
            return { ...activity, timeRemaining: "¡Tiempo agotado!", isExpired: true };
          }

          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

          let timeString = "";
          if (days > 0) timeString += `${days}d `;
          if (hours > 0) timeString += `${hours}h `;
          if (minutes > 0) timeString += `${minutes}m `;
          if (days === 0 && hours === 0) timeString += `${seconds}s`;

          return { ...activity, timeRemaining: timeString.trim(), isExpired: false };
        }
        return { ...activity, timeRemaining: undefined, isExpired: false };
      });

      setActivitiesWithTimers(updatedActivities);
    };

    // Calcular inmediatamente
    calculateTimeRemaining();

    // Configurar intervalo
    const intervalId = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(intervalId);
  }, [activities]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-soft-lavender">Cargando actividades...</div>
      </div>
    );
  }

  const toggleActivity = (activityId: number) => {
    setExpandedActivity(prev => prev === activityId ? null : activityId);
  };

  const toggleActivityCompletion = (activityId: number) => {
    setCompletedActivities(prev => ({
      ...prev,
      [activityId]: {
        activityId,
        isCompleted: !prev[activityId]?.isCompleted,
        completionCount: prev[activityId]?.isCompleted ? 0 : (prev[activityId]?.completionCount || 0) + 1
      }
    }));
  };

  const updateCompletionCount = (activityId: number, count: number) => {
    if (count < 0) return;
    setCompletedActivities(prev => ({
      ...prev,
      [activityId]: {
        activityId,
        isCompleted: count > 0,
        completionCount: count
      }
    }));
  };

  // Group activities by arista and album
  const groupedActivities = activitiesWithTimers.reduce((acc, activity) => {
    console.log(`Processing activity: ${activity.title}, arista: ${activity.arista}, album: ${activity.album}`);
    if (!acc[activity.arista]) {
      acc[activity.arista] = {};
    }
    if (!acc[activity.arista][activity.album]) {
      acc[activity.arista][activity.album] = [];
    }
    acc[activity.arista][activity.album].push(activity);
    return acc;
  }, {} as { [arista: string]: { [album: string]: ActivityWithTimer[] } });

  console.log("Grouped activities:", groupedActivities);

  const toggleArista = (aristaKey: string) => {
    setOpenAristas(prev => 
      prev.includes(aristaKey) 
        ? prev.filter(key => key !== aristaKey)
        : [...prev, aristaKey]
    );
  };

  // Calculate totals
  const totalActivities = activitiesWithTimers.length;
  const completedCount = Object.values(completedActivities).filter(a => a.isCompleted).length;
  const totalCompletions = Object.values(completedActivities).reduce((sum, a) => sum + a.completionCount, 0);

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-6xl mx-auto animate-slide-up pt-16">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Actividades por realizar</h1>
          <div className="decorative-line mb-4"></div>
          <p className="text-light-gray text-sm sm:text-base lg:text-lg px-4">Explora las aristas y álbumes disponibles</p>
        </div>

        {/* Completion Summary */}
        <Card className="bg-black/20 backdrop-blur-sm border-medium-gray/10 mb-6 sm:mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-soft-lavender mb-2">{completedCount}</div>
                <div className="text-light-gray text-sm sm:text-base">Actividades completadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">{totalCompletions}</div>
                <div className="text-light-gray text-sm sm:text-base">Total de realizaciones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2">{totalActivities - completedCount}</div>
                <div className="text-light-gray text-sm sm:text-base">Pendientes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aristas and Albums Structure */}
        <div className="space-y-4">
          {Object.entries(ARISTAS).map(([aristaKey, arista]) => {
            const isOpen = openAristas.includes(aristaKey);
            const aristaActivities = activitiesWithTimers.filter(activity => activity.arista === aristaKey);

            return (
              <Collapsible key={aristaKey} open={isOpen} onOpenChange={() => toggleArista(aristaKey)}>
                <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="hover:bg-medium-gray/5 transition-colors p-3 sm:p-6">
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-playfair text-lg sm:text-xl lg:text-2xl text-soft-lavender text-left">
                          {arista.name}
                        </CardTitle>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Badge variant="secondary" className="bg-soft-lavender/20 text-soft-lavender text-xs sm:text-sm px-2 py-1">
                            {aristaActivities.length} actividades
                          </Badge>
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-soft-lavender" />
                          ) : (
                            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-soft-lavender" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0 p-3 sm:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {arista.albums.map((album) => {
                          const albumActivities = activitiesWithTimers.filter(
                            (activity) => activity.arista === aristaKey && activity.album === album.id
                          );

                          return (
                            <div
                              key={album.id}
                              className="p-3 sm:p-4 bg-medium-gray/10 rounded-lg border border-medium-gray/20 hover:border-soft-lavender/30 transition-colors"
                            >
                              <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-semibold text-purple-300">
                                  {album.name}
                                </h3>
                                {albumActivities.some(activity => activity.deadline) && (
                                  <div className="text-sm text-gray-400">
                                    ⏰ Con temporizador
                                  </div>
                                )}
                              </div>

                              {albumActivities.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                  <p className="text-sm">
                                    Aún no existen actividades para este álbum. Estamos trabajando para traerte las mejores actividades para ti.
                                  </p>
                                </div>
                              )}
                              <div className="space-y-3">
                                {albumActivities.map((activity) => {
                                  const completion = completedActivities[activity.id] || { isCompleted: false, completionCount: 0 };

                                  return (
                                    <Card key={activity.id} className={`bg-medium-gray/20 border-medium-gray/30 hover:border-soft-lavender/30 transition-all ${activity.isExpired ? 'border-red-500/50' : ''} ${completion.isCompleted ? 'border-green-500/50' : ''}`}>
                                      <CardHeader className="p-3 sm:p-4">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex items-start space-x-2 sm:space-x-3 min-w-0 flex-1">
                                            <Checkbox
                                              checked={completion.isCompleted}
                                              onCheckedChange={() => toggleActivityCompletion(activity.id)}
                                              className="border-soft-lavender data-[state=checked]:bg-soft-lavender data-[state=checked]:border-soft-lavender mt-1 flex-shrink-0"
                                            />
                                            <div className="min-w-0 flex-1">
                                              <CardTitle className="text-white text-sm sm:text-base flex items-start gap-2 flex-wrap">
                                                <span className="break-words">{activity.title}</span>
                                                {completion.isCompleted && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                                              </CardTitle>
                                              {completion.isCompleted && (
                                                <div className="flex items-center space-x-2 mt-2">
                                                  <span className="text-xs text-light-gray">Veces realizada:</span>
                                                  <Input
                                                    type="number"
                                                    min="0"
                                                    value={completion.completionCount}
                                                    onChange={(e) => updateCompletionCount(activity.id, parseInt(e.target.value) || 0)}
                                                    className="w-14 sm:w-16 h-6 text-xs bg-dark-graphite border-medium-gray/30 text-white"
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 flex-shrink-0">
                                            {activity.timeRemaining && (
                                              <div className={`flex items-center space-x-1 px-1 sm:px-2 py-1 rounded text-xs font-mono ${
                                                activity.isExpired 
                                                  ? 'bg-red-500/20 text-red-400' 
                                                  : 'bg-orange-500/20 text-orange-400'
                                              }`}>
                                                {activity.isExpired ? (
                                                  <AlertTriangle className="w-3 h-3" />
                                                ) : (
                                                  <Clock className="w-3 h-3" />
                                                )}
                                                <span className="hidden sm:inline">{activity.timeRemaining}</span>
                                              </div>
                                            )}
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => toggleActivity(activity.id)}
                                              className="text-light-gray hover:text-white p-1 h-auto"
                                            >
                                              {expandedActivity === activity.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </Button>
                                          </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-light-gray mt-2">
                                          <div className="flex items-center space-x-1">
                                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                            <span>{new Date(activity.createdAt!).toLocaleDateString()}</span>
                                          </div>
                                          {activity.deadline && activity.arista === "actividades-express" && activity.album === "actividad-express" && (
                                            <div className="flex items-center space-x-1">
                                              <span>•</span>
                                              <span className="hidden sm:inline">Límite: {new Date(activity.deadline).toLocaleDateString()} {new Date(activity.deadline).toLocaleTimeString()}</span>
                                              <span className="sm:hidden">Límite: {new Date(activity.deadline).toLocaleDateString()}</span>
                                            </div>
                                          )}
                                        </div>
                                      </CardHeader>
                                      {expandedActivity === activity.id && (
                                        <CardContent className="pt-0">
                                          <Separator className="mb-4 bg-medium-gray/30" />
                                          <div className="space-y-4">
                                            <p className="text-light-gray leading-relaxed">{activity.description}</p>

                                            {activity.isExpired && (
                                              <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                                                <div className="flex items-center space-x-2 text-red-400">
                                                  <AlertTriangle className="w-4 h-4" />
                                                  <span className="text-sm font-medium">Actividad Expirada</span>
                                                </div>
                                                <p className="text-xs text-red-300 mt-1">
                                                  Esta actividad ha pasado su fecha límite y se ha movido automáticamente a "Actividad Tardía".
                                                </p>
                                              </div>
                                            )}

                                            {completion.isCompleted && (
                                              <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
                                                <div className="flex items-center space-x-2 text-green-400">
                                                  <CheckCircle className="w-4 h-4" />
                                                  <span className="text-sm font-medium">Actividad Completada</span>
                                                </div>
                                                <p className="text-xs text-green-300 mt-1">
                                                  Has realizado esta actividad {completion.completionCount} {completion.completionCount === 1 ? 'vez' : 'veces'}.
                                                </p>
                                              </div>
                                            )}

                                            {activity.facebookLink && (
                                              <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                                              >
                                                <a href={activity.facebookLink} target="_blank" rel="noopener noreferrer">
                                                  <ExternalLink className="w-4 h-4 mr-2" />
                                                  Ver en Facebook
                                                </a>
                                              </Button>
                                            )}
                                          </div>
                                        </CardContent>
                                      )}
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </div>
  );
}