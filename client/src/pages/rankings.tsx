import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Trophy, Medal, Crown, Star, Shield, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

const getRankColor = (rank: string) => {
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
  };

export default function Rankings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/rankings"],
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchOnMount: true,
    refetchIntervalInBackground: true,
  });

  const sortedByTraces = [...users].sort((a, b) => b.totalTraces - a.totalTraces);
  const sortedByWords = [...users].sort((a, b) => b.totalWords - a.totalWords);

  const userTracesPosition = sortedByTraces.findIndex(u => u.id === user?.id) + 1;
  const userWordsPosition = sortedByWords.findIndex(u => u.id === user?.id) + 1;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soft-lavender"></div>
      </div>
    );
  }

  const RankingList = ({ users, type }: { users: User[], type: 'traces' | 'words' }) => (
    <div className="space-y-3">
      {users.map((rankUser, index) => (
        <Card
          key={rankUser.id}
          className={`bg-black/40 backdrop-blur-sm border-medium-gray/20 transition-all duration-300 ${
            rankUser.id === user?.id ? 'border-soft-lavender/70 bg-soft-lavender/10' : ''
          }`}
        >
          <Collapsible 
            open={expandedUser === rankUser.id}
            onOpenChange={(open) => setExpandedUser(open ? rankUser.id : null)}
          >
            <CollapsibleTrigger asChild>
              <CardContent className="p-3 sm:p-4 cursor-pointer hover:bg-medium-gray/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-medium-gray/20 flex-shrink-0">
                      {index === 0 && <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />}
                      {index === 1 && <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />}
                      {index === 2 && <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />}
                      {index > 2 && <span className="text-light-gray font-semibold text-sm sm:text-base">#{index + 1}</span>}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-white text-sm sm:text-lg truncate">{rankUser.fullName}</h3>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                          <Badge variant="secondary" className="text-xs bg-soft-lavender/20 text-soft-lavender px-1 py-0">
                            {rankUser.signature}
                          </Badge>
                          <Badge variant="secondary" className={`text-xs px-1 py-0 ${getRankColor(rankUser.rank)}`}>
                            {rankUser.rank}
                          </Badge>
                          {rankUser.role === "admin" && (
                            <Badge variant="destructive" className="text-xs bg-yellow-600/50 text-yellow-300 px-1 py-0">
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-lg sm:text-2xl font-bold text-soft-lavender">
                        {type === 'traces' ? rankUser.totalTraces : rankUser.totalWords}
                      </div>
                      <div className="text-xs sm:text-sm text-light-gray">
                        {type === 'traces' ? 'trazos' : 'palabras'}
                      </div>
                    </div>
                    {expandedUser === rankUser.id ? (
                      <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-light-gray" />
                    ) : (
                      <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-light-gray" />
                    )}
                  </div>
                </div>
              </CardContent>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-medium-gray/20">
                <div className="pt-3 sm:pt-4 space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                    <div>
                      <div className="text-sm sm:text-lg font-bold text-soft-lavender">{rankUser.totalTraces}</div>
                      <div className="text-xs sm:text-sm text-light-gray">Trazos totales</div>
                    </div>
                    <div>
                      <div className="text-sm sm:text-lg font-bold text-soft-lavender">{rankUser.totalWords}</div>
                      <div className="text-xs sm:text-sm text-light-gray">Palabras totales</div>
                    </div>
                    <div>
                      <div className="text-sm sm:text-lg font-bold text-soft-lavender">{rankUser.totalActivities}</div>
                      <div className="text-xs sm:text-sm text-light-gray">Actividades</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-light-gray">Miembro desde:</span>
                      <span className="text-white">
                        {new Date(rankUser.createdAt!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/usuario/${rankUser.id}`);
                    }}
                    className="w-full bg-soft-lavender/20 hover:bg-soft-lavender/30 text-soft-lavender border border-soft-lavender/30 h-8 sm:h-10 text-xs sm:text-sm"
                    variant="outline"
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Ver Perfil
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-6xl mx-auto animate-slide-up pt-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-playfair text-5xl font-bold mb-4">Rankings</h1>
          <div className="decorative-line mb-4"></div>
          <p className="text-light-gray text-lg">Clasificaciones de la comunidad</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Rankings */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="traces" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-medium-gray/20 h-auto">
                <TabsTrigger value="traces" className="data-[state=active]:bg-soft-lavender/20 data-[state=active]:text-soft-lavender text-xs sm:text-sm py-2 px-2 sm:px-4">
                  Ranking de Trazos
                </TabsTrigger>
                <TabsTrigger value="words" className="data-[state=active]:bg-soft-lavender/20 data-[state=active]:text-soft-lavender text-xs sm:text-sm py-2 px-2 sm:px-4">
                  Ranking de Palabras
                </TabsTrigger>
              </TabsList>

              <TabsContent value="traces" className="mt-6">
                <RankingList users={sortedByTraces} type="traces" />
              </TabsContent>

              <TabsContent value="words" className="mt-6">
                <RankingList users={sortedByWords} type="words" />
              </TabsContent>
            </Tabs>
          </div>

          {/* Current User Position */}
          <div className="space-y-4 lg:space-y-6">
            {user && (
              <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
                <CardHeader className="pb-3">
                  <CardTitle className="font-playfair text-lg sm:text-xl">Tu Posición</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-light-gray text-xs sm:text-sm">Ranking de Trazos:</span>
                      <Badge variant="outline" className="text-soft-lavender border-soft-lavender/30 text-xs sm:text-sm">
                        #{userTracesPosition || "N/A"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-light-gray text-xs sm:text-sm">Ranking de Palabras:</span>
                      <Badge variant="outline" className="text-soft-lavender border-soft-lavender/30 text-xs sm:text-sm">
                        #{userWordsPosition || "N/A"}
                      </Badge>
                    </div>
                    <div className="pt-2 border-t border-medium-gray/20">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl font-bold text-soft-lavender">{user.totalTraces}</div>
                        <div className="text-xs sm:text-sm text-light-gray">Tus trazos totales</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}