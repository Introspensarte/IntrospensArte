import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ARISTAS } from "@/lib/constants";
import { ChevronDown, ChevronUp, ExternalLink, Calendar, Clock, AlertTriangle } from "lucide-react";
import type { PlannedActivity } from "@shared/schema";

interface ActivityWithTimer extends PlannedActivity {
  timeRemaining?: string;
  isExpired?: boolean;
}

export default function Activities() {
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);
  const [activitiesWithTimers, setActivitiesWithTimers] = useState<ActivityWithTimer[]>([]);
  const [openAristas, setOpenAristas] = useState<string[]>([]);

  const { data: activities = [], isLoading } = useQuery<PlannedActivity[]>({
    queryKey: ["/api/planned-activities"],
  });

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


  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-6xl mx-auto animate-slide-up pt-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-playfair text-5xl font-bold mb-4">Actividades por realizar</h1>
          <div className="decorative-line mb-4"></div>
          <p className="text-light-gray text-lg">Explora las aristas y álbumes disponibles</p>
        </div>

        {/* Aristas and Albums Structure */}
        <div className="space-y-4">
          {Object.entries(ARISTAS).map(([aristaKey, arista]) => {
            const isOpen = openAristas.includes(aristaKey);
            const aristaActivities = activitiesWithTimers.filter(activity => activity.arista === aristaKey);

            return (
              <Collapsible key={aristaKey} open={isOpen} onOpenChange={() => toggleArista(aristaKey)}>
                <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="hover:bg-medium-gray/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-playfair text-2xl text-soft-lavender text-left">
                          {arista.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-soft-lavender/20 text-soft-lavender">
                            {aristaActivities.length} actividades
                          </Badge>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-soft-lavender" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-soft-lavender" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {arista.albums.map((album) => {
                          const albumActivities = activitiesWithTimers.filter(
                            (activity) => activity.arista === aristaKey && activity.album === album.id
                          );

                          return (
                            <div
                              key={album.id}
                              className="p-4 bg-medium-gray/10 rounded-lg border border-medium-gray/20 hover:border-soft-lavender/30 transition-colors"
                            >
                              <h4 className="font-semibold text-white mb-3 text-center border-b border-medium-gray/20 pb-2">
                                {album.name}
                              </h4>
                              <div className="space-y-3">
                          {albumActivities.map((activity) => (
                            <Card key={activity.id} className={`bg-medium-gray/20 border-medium-gray/30 hover:border-soft-lavender/30 transition-all ${activity.isExpired ? 'border-red-500/50' : ''}`}>
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-white text-base">{activity.title}</CardTitle>
                                  <div className="flex items-center space-x-2">
                                    {activity.timeRemaining && (
                                      <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-mono ${
                                        activity.isExpired 
                                          ? 'bg-red-500/20 text-red-400' 
                                          : 'bg-orange-500/20 text-orange-400'
                                      }`}>
                                        {activity.isExpired ? (
                                          <AlertTriangle className="w-3 h-3" />
                                        ) : (
                                          <Clock className="w-3 h-3" />
                                        )}
                                        <span>{activity.timeRemaining}</span>
                                      </div>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleActivity(activity.id)}
                                      className="text-light-gray hover:text-white"
                                    >
                                      {expandedActivity === activity.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-light-gray">
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(activity.createdAt!).toLocaleDateString()}</span>
                                  {activity.deadline && activity.arista === "actividades-express" && activity.album === "actividad-express" && (
                                    <>
                                      <span>•</span>
                                      <span>Límite: {new Date(activity.deadline).toLocaleDateString()} {new Date(activity.deadline).toLocaleTimeString()}</span>
                                    </>
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
                          ))}
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

        {/* Activities Summary */}
        <Card className="bg-black/20 backdrop-blur-sm border-medium-gray/10 mt-8">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-soft-lavender mb-2">
                {activities.length}
              </div>
              <div className="text-light-gray">
                Actividades totales disponibles
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}