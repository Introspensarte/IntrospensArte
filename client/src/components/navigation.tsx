import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Bell, HelpCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export default function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Clean up notifications query when user changes
  useEffect(() => {
    // This effect will run when user changes, helping with re-renders
  }, [user?.id]);

  const { data: notifications = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/notifications`],
    enabled: !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always refetch
    cacheTime: 0, // Don't cache
  });

  const unreadNotifications = notifications.filter((n: any) => !n.read);

  const handleLogout = () => {
    logout();
    // Clear any cached data
    localStorage.clear();
    // Force navigation to landing page
    setTimeout(() => {
      window.location.href = "/";
    }, 100);
  };

  // Don't show navigation on landing page
  if (location === "/" && !user) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-graphite/90 backdrop-blur-sm border-b border-medium-gray/20">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
        <Link href={user ? "/portal" : "/"}>
          <span className="font-playfair text-lg sm:text-xl font-semibold text-soft-lavender hover:text-white transition-colors cursor-pointer">
            Introspens/arte
          </span>
        </Link>

        <div className="flex items-center space-x-2 sm:space-x-6">
          {user ? (
            <>
              <Link href="/portal" className="hidden sm:block">
                <span className="text-light-gray hover:text-white transition-colors cursor-pointer">
                  Portal
                </span>
              </Link>
              <span className="text-xs sm:text-sm text-soft-lavender font-medium">
                {user.signature}
              </span>
              <Link href="/profile">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-light-gray hover:text-white hover:bg-medium-gray/20 p-2"
                >
                  <User className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/notifications">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-light-gray hover:text-white hover:bg-medium-gray/20 p-2 relative"
                >
                  <Bell className="h-4 w-4" />
                  {unreadNotifications.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 bg-soft-lavender text-white text-xs flex items-center justify-center">
                      {unreadNotifications.length}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/support">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-light-gray hover:text-white hover:bg-medium-gray/20 p-2"
                  title="Soporte"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </Link>
              <Button 
                onClick={handleLogout}
                variant="ghost" 
                size="sm"
                className="text-light-gray hover:text-white hover:bg-medium-gray/20 p-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <span className="text-light-gray hover:text-white transition-colors cursor-pointer text-sm sm:text-base">
                  Iniciar Sesión
                </span>
              </Link>
              <Link href="/register">
                <span className="text-light-gray hover:text-white transition-colors cursor-pointer text-sm sm:text-base">
                  Registro
                </span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}