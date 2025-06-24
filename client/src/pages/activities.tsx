
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Eye, ExternalLink } from "lucide-react";
import { useState } from "react";
import { ARISTAS } from "@/lib/constants";
import type { PlannedActivity } from "@shared/schema";

export default function Activities() {
  const { data: activities = [], isLoading } = useQuery<PlannedActivity[]>({
    queryKey: ["/api/planned-activities"],
  });

  const [openAristas, setOpenAristas] = useState<string[]>([]);
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soft-lavender"></div>
      </div>
    );
  }

  const toggleArista = (aristaKey: string) => {
    setOpenAristas(prev => 
      prev.includes(aristaKey) 
        ? prev.filter(key => key !== aristaKey)
        : [...prev, aristaKey]
    );
  };

  const toggleActivity = (activityId: number) => {
    setExpandedActivity(prev => prev === activityId ? null : activityId);
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
            const aristaActivities = activities.filter(activity => activity.arista === aristaKey);
            
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
                          const albumActivities = activities.filter(
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
                              
                              {albumActivities.length > 0 ? (
                                <div className="space-y-3">
                                  {albumActivities.map((activity) => (
                                    <div key={activity.id} className="space-y-2">
                                      <div className="p-3 bg-black/30 rounded border border-medium-gray/10">
                                        <div className="flex items-center justify-between mb-2">
                                          <h5 className="font-medium text-soft-lavender text-sm">
                                            {activity.title}
                                          </h5>
                                          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                                            Disponible
                                          </Badge>
                                        </div>
                                        
                                        {expandedActivity === activity.id ? (
                                          <div className="space-y-2">
                                            <p className="text-xs text-light-gray leading-relaxed">
                                              {activity.description}
                                            </p>
                                            {activity.deadline && (
                                              <div className="text-xs text-orange-400 bg-orange-500/10 p-2 rounded">
                                                <strong>Fecha límite:</strong> {new Date(activity.deadline).toLocaleDateString()}
                                              </div>
                                            )}
                                            <div className="flex justify-between items-center pt-2 border-t border-medium-gray/20">
                                              <div className="flex items-center space-x-2">
                                                <span className="text-xs text-medium-gray">
                                                  Publicado: {new Date(activity.createdAt!).toLocaleDateString()}
                                                </span>
                                                {activity.facebookLink && (
                                                  <a
                                                    href={activity.facebookLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                                                  >
                                                    <ExternalLink className="h-3 w-3" />
                                                    <span>Ver en Facebook</span>
                                                  </a>
                                                )}
                                              </div>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleActivity(activity.id!)}
                                                className="text-xs text-soft-lavender hover:text-white"
                                              >
                                                Ver menos
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex justify-between items-center">
                                            <p className="text-xs text-light-gray line-clamp-2">
                                              {activity.description.length > 60 
                                                ? `${activity.description.substring(0, 60)}...` 
                                                : activity.description
                                              }
                                            </p>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => toggleActivity(activity.id!)}
                                              className="text-xs text-soft-lavender hover:text-white flex items-center gap-1"
                                            >
                                              <Eye className="h-3 w-3" />
                                              Ver más
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6">
                                  <div className="text-medium-gray text-sm mb-1">
                                    No hay actividades disponibles aún
                                  </div>
                                  <div className="text-xs text-medium-gray">
                                    Las actividades aparecerán aquí cuando los administradores las publiquen
                                  </div>
                                </div>
                              )}
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
