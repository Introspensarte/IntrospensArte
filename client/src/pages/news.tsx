import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import type { News } from "@shared/schema";

export default function News() {
  const { data: news = [], isLoading } = useQuery<(News & { author: any })[]>({
    queryKey: ["/api/news"],
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
          <h1 className="font-playfair text-5xl font-bold mb-4">Noticias</h1>
          <div className="decorative-line mb-4"></div>
          <p className="text-light-gray text-lg">Últimas novedades de la comunidad</p>
        </div>

        {/* News List */}
        <div className="space-y-6">
          {news.length > 0 ? (
            news.map((newsItem) => (
              <Card key={newsItem.id} className="bg-black/40 backdrop-blur-sm border-medium-gray/20 hover:border-soft-lavender/30 transition-all duration-300">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="font-playfair text-2xl text-white">
                      {newsItem.title}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-soft-lavender/20 text-soft-lavender">
                      Noticia
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-light-gray">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{newsItem.author?.fullName || "Autor desconocido"}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(newsItem.createdAt!).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-light-gray leading-relaxed whitespace-pre-wrap">
                      {newsItem.content}
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
                    <Calendar className="w-8 h-8 text-medium-gray" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">No hay noticias aún</h3>
                    <p className="text-light-gray">
                      Las noticias aparecerán aquí cuando los administradores publiquen actualizaciones
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
