import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, MessageSquare } from "lucide-react";
import type { Announcement } from "@shared/schema";

export default function Announcements() {
  const { data: announcements = [], isLoading } = useQuery<(Announcement & { author: any })[]>({
    queryKey: ["/api/announcements"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soft-lavender"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto animate-slide-up pt-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-playfair text-5xl font-bold mb-4">Avisos</h1>
          <div className="decorative-line mb-4"></div>
          <p className="text-light-gray text-lg">Comunicados importantes de la administración</p>
        </div>

        {/* Announcements List */}
        <div className="space-y-6">
          {announcements.length > 0 ? (
            announcements.map((announcement) => (
              <Card key={announcement.id} className="bg-black/40 backdrop-blur-sm border-medium-gray/20 hover:border-soft-lavender/30 transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="font-playfair text-2xl text-white">
                      {announcement.title}
                    </CardTitle>
                    <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                      Aviso
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-light-gray">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{announcement.author?.fullName || "Administración"}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(announcement.createdAt!).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-light-gray leading-relaxed whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-black/20 backdrop-blur-sm border-medium-gray/10">
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-medium-gray/20 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-medium-gray" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">No hay avisos</h3>
                    <p className="text-light-gray">
                      Los avisos importantes aparecerán aquí cuando la administración publique comunicados
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
