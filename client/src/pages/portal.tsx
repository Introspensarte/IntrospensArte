import { Link } from "wouter";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Newspaper, 
  MessageSquare, 
  Calendar, 
  Upload, 
  Trophy, 
  Bell,
  Shield 
} from "lucide-react";

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

export default function Portal() {
  const { user, updateUser, refreshUser } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["/api/rankings"],
    enabled: !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Force frequent refresh to ensure fresh data
  const { data: currentUser } = useQuery({
    queryKey: [`/api/users/${user?.id}`],
    enabled: !!user?.id,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 0, // Always consider data stale
  });

  // Update user context when fresh data arrives
  useEffect(() => {
    if (currentUser && currentUser.id === user?.id) {
      // Only update if data has actually changed
      if (JSON.stringify(currentUser) !== JSON.stringify(user)) {
        updateUser(currentUser);
      }
    }
  }, [currentUser, user, updateUser]);

  // Update user stats when component mounts
  useEffect(() => {
    if (user?.id) {
      refreshUser();
    }
  }, [user?.id, refreshUser]);

  // Removed problematic useEffect that was causing infinite re-renders
  useEffect(() => {
    const refreshUserData = async () => {
      if (user?.id) {
        try {
          const response = await apiRequest("GET", `/api/users/${user.id}`, {});
          const userData = await response.json();
          updateUser(userData);
        } catch (error) {
          console.error("Error refreshing user data:", error);
        }
      }
    };

    refreshUserData();
  }, [user?.id]); // Remove updateUser from dependencies to prevent infinite loop

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-light-gray">Debes iniciar sesión para acceder al portal</p>
      </div>
    );
  }

  const userRanking = stats?.findIndex((u: any) => u.id === user.id) + 1 || 0;

  const primaryMenuItems = [
    ...(user.role === "admin" ? [{
      title: "Panel de admin",
      description: "Gestión avanzada",
      href: "/admin",
      icon: Shield,
      isAdmin: true,
    }] : []),
    {
      title: "Dashboard",
      description: "Feed de la comunidad",
      href: "/dashboard",
      icon: Calendar,
      isAdmin: false,
    },
    {
      title: "Rankings",
      description: "Trazos y palabras",
      href: "/rankings",
      icon: Trophy,
      isAdmin: false,
    },
  ];

  const gridMenuItems = [
    {
      title: "Noticias",
      description: "Últimas novedades",
      href: "/news",
      icon: Newspaper,
    },
    {
      title: "Avisos",
      description: "Comunicados importantes",
      href: "/announcements",
      icon: MessageSquare,
    },
    {
      title: "Sube tu actividad",
      description: "Comparte tu arte",
      href: "/upload",
      icon: Upload,
    },
    {
      title: "Actividades por realizar",
      description: "Explora las aristas",
      href: "/activities",
      icon: Calendar,
    },
  ];

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-6xl mx-auto animate-slide-up pt-16">
        {/* User Welcome & Portal Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-2">¡Bienvenido, {user.fullName}!</h2>
            <div className="flex items-center justify-center space-x-2">
              <Badge variant="secondary" className="bg-soft-lavender/20 text-soft-lavender">
                {user.signature}
              </Badge>
              <Badge variant="secondary" className={getRankColor(user.rank || "Alma en tránsito")}>
                {user.rank || "Alma en tránsito"}
              </Badge>
              {user.role === "admin" && (
                <Badge variant="destructive" className="bg-yellow-600/50 text-yellow-300">
                  Admin
                </Badge>
              )}
            </div>
          </div>

          <h1 className="font-playfair text-5xl font-bold mb-4 text-soft-lavender">IntrospensArte</h1>
          <div className="decorative-line mb-4"></div>
          <p className="text-light-gray text-lg mb-6">Portal de la comunidad artística</p>

          {/* Facebook Links */}
          <div className="flex justify-center space-x-6 mb-4">
            <a 
              href="https://www.facebook.com/share/19hgPWZaSd/?mibextid=wwXIfr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline hover:no-underline transition-colors"
            >
              Facebook Page
            </a>
            <a 
              href="https://www.facebook.com/share/g/18wmf5MZUb/?mibextid=wwXIfr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-soft-lavender hover:text-white underline hover:no-underline transition-colors"
            >
              Grupo de Actividades
            </a>
          </div>
        </div>

        {/* Primary Menu Items (Dashboard and Rankings) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {primaryMenuItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <Card className={`backdrop-blur-sm transition-all duration-300 cursor-pointer hover:scale-105 group ${
                item.isAdmin 
                  ? "bg-purple-900/40 border-purple-500/30 hover:border-purple-400/50" 
                  : "bg-black/40 border-medium-gray/20 hover:border-soft-lavender/50"
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                      item.isAdmin
                        ? "bg-purple-600/30 group-hover:bg-purple-500/40"
                        : "bg-soft-lavender/20 group-hover:bg-soft-lavender/30"
                    }`}>
                      <item.icon className={`w-6 h-6 ${
                        item.isAdmin ? "text-purple-300" : "text-soft-lavender"
                      }`} />
                    </div>
                    <div>
                      <h3 className={`font-semibold transition-colors ${
                        item.isAdmin
                          ? "text-white group-hover:text-purple-300"
                          : "text-white group-hover:text-soft-lavender"
                      }`}>
                        {item.title}
                      </h3>
                      <p className="text-sm text-medium-gray">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Grid Menu Items - responsive layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          {gridMenuItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20 hover:border-soft-lavender/50 transition-all duration-300 cursor-pointer hover:scale-105 group">
                <CardContent className="p-4 md:p-6 h-full flex flex-col items-center justify-center text-center min-h-[140px] md:min-h-[160px]">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-soft-lavender/20 rounded-lg flex items-center justify-center group-hover:bg-soft-lavender/30 transition-colors mb-3">
                    <item.icon className="w-5 h-5 md:w-6 md:h-6 text-soft-lavender" />
                  </div>
                  <div className="flex flex-col items-center justify-center flex-grow">
                    <h3 className="font-semibold text-white group-hover:text-soft-lavender transition-colors mb-2 text-sm md:text-base leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs md:text-sm text-medium-gray leading-relaxed">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-black/20 backdrop-blur-sm border-medium-gray/10">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-soft-lavender mb-2">
                  {user.totalTraces || 0}
                </div>
                <div className="text-light-gray">Trazos totales</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-sm border-medium-gray/10">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-soft-lavender mb-2">
                  {user.totalWords || 0}
                </div>
                <div className="text-light-gray">Palabras escritas</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-sm border-medium-gray/10">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-soft-lavender mb-2">
                  #{userRanking || "N/A"}
                </div>
                <div className="text-light-gray">Posición global</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}