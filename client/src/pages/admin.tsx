import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ARISTAS, RANKS, MEDALS } from "@/lib/constants";
import { 
  Shield, Users, FileText, MessageSquare, Calendar, Settings, Plus, Edit2, Trash2, 
  Eye, HelpCircle, BarChart3, Database, Zap, AlertTriangle, CheckCircle, Clock,
  TrendingUp, Activity
} from "lucide-react";
import type { User } from "@shared/schema";
import SupportTicketsManagement from "@/components/support-tickets-management";
import AdminCalendar from "@/components/admin-calendar";

// Get available albums based on selected arista
const getAvailableAlbums = (aristaKey: string) => {
  if (!aristaKey || !ARISTAS[aristaKey as keyof typeof ARISTAS]) return [];
  return ARISTAS[aristaKey as keyof typeof ARISTAS].albums || [];
};

const newsSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  content: z.string().min(1, "El contenido es requerido"),
});

const announcementSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  content: z.string().min(1, "El contenido es requerido"),
});

const plannedActivitySchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  arista: z.string().min(1, "La arista es requerida"),
  album: z.string().min(1, "El álbum es requerido"),
  deadline: z.string().optional().nullable(),
  facebookLink: z.string().url().optional().or(z.literal("")).or(z.undefined()),
  activityCode: z.string().optional(),
});

const userUpdateSchema = z.object({
  signature: z.string().min(1, "La firma es requerida"),
  role: z.string(),
  rank: z.string(),
  medal: z.string().optional(),
  totalTraces: z.number().min(0),
});

const traceAssignmentSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  date: z.string().min(1, "La fecha es requerida"),
  selectedUsers: z.array(z.number()).min(1, "Selecciona al menos un usuario"),
  reason: z.string().min(1, "La razón es requerida"),
  tracesAmount: z.number().min(1, "La cantidad de trazos debe ser mayor a 0"),
});

type NewsForm = z.infer<typeof newsSchema>;
type AnnouncementForm = z.infer<typeof announcementSchema>;
type PlannedActivityForm = z.infer<typeof plannedActivitySchema>;
type UserUpdateForm = z.infer<typeof userUpdateSchema>;
type TraceAssignmentForm = z.infer<typeof traceAssignmentSchema>;

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [expandedUser, setExpandedUser] = useState<number | null>(null);
    const [editingNews, setEditingNews] = useState<any>(null);
    const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
    const [editingActivity, setEditingActivity] = useState<any>(null);
    const [viewingNewsViewers, setViewingNewsViewers] = useState<number | null>(null);
    const [viewingAnnouncementViewers, setViewingAnnouncementViewers] = useState<number | null>(null);

  // Queries
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/rankings"],
    enabled: !!user && (user.role === "admin" || user.signature === "#INELUDIBLE"),
  });

  const { data: newsList = [] } = useQuery({
    queryKey: ["/api/news"],
    enabled: !!user && (user.role === "admin" || user.signature === "#INELUDIBLE"),
  });

  const { data: announcementsList = [] } = useQuery({
    queryKey: ["/api/announcements"],
    enabled: !!user && (user.role === "admin" || user.signature === "#INELUDIBLE"),
  });

  const { data: plannedActivitiesList = [] } = useQuery({
    queryKey: ["/api/planned-activities"],
    enabled: !!user && (user.role === "admin" || user.signature === "#INELUDIBLE"),
    
  });

  const { data: newsViewers = [] } = useQuery({
    queryKey: [`/api/news/${viewingNewsViewers}/viewers`],
    enabled: !!user && (user.role === "admin" || user.signature === "#INELUDIBLE") && viewingNewsViewers !== null,
  });

  const { data: announcementViewers = [] } = useQuery({
    queryKey: [`/api/announcements/${viewingAnnouncementViewers}/viewers`],
    enabled: !!user && (user.role === "admin" || user.signature === "#INELUDIBLE") && viewingAnnouncementViewers !== null,
  });

  const { data: userCountData } = useQuery({
    queryKey: ["/api/admin/user-count"],
    enabled: !!user && (user.role === "admin" || user.signature === "#INELUDIBLE"),
    refetchInterval: 30000,
  });

  const { data: traceAssignments = [] } = useQuery({
    queryKey: [`/api/admin/trace-assignments?adminId=${user?.id}`],
    enabled: !!user && (user.role === "admin" || user.signature === "#INELUDIBLE"),
  });

  // Forms
  const newsForm = useForm<NewsForm>({
    resolver: zodResolver(newsSchema),
    defaultValues: { title: "", content: "" },
  });

  const announcementForm = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: "", content: "" },
  });

  const activityForm = useForm<PlannedActivityForm>({
    resolver: zodResolver(plannedActivitySchema),
    defaultValues: { 
      title: "", 
      description: "", 
      arista: "", 
      album: "",
      deadline: "",
      facebookLink: "",
      activityCode: ""
    },
  });

  const userForm = useForm<UserUpdateForm>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      signature: "",
      role: "user",
      rank: "Alma en tránsito",
      medal: "",
      totalTraces: 0,
    },
  });

  const traceAssignmentForm = useForm<TraceAssignmentForm>({
    resolver: zodResolver(traceAssignmentSchema),
    defaultValues: {
      title: "",
      date: new Date().toISOString().split('T')[0],
      selectedUsers: [],
      reason: "",
      tracesAmount: 0,
    },
  });

  // Mutations
  const createNewsMutation = useMutation({
    mutationFn: async (data: NewsForm) => {
      const response = await apiRequest("POST", "/api/news", {
        ...data,
        authorId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "✓ Noticia publicada", description: "La noticia ha sido creada exitosamente" });
      newsForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

    const updateNewsMutation = useMutation({
        mutationFn: async (data: NewsForm & { id: number }) => {
            const { id, ...updateData } = data;
            const response = await apiRequest("PUT", `/api/news/${id}`, updateData);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/news"] });
            toast({ title: "Noticia actualizada", description: "La noticia ha sido actualizada exitosamente" });
            newsForm.reset();
            setEditingNews(null);
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: AnnouncementForm) => {
      const response = await apiRequest("POST", "/api/announcements", {
        ...data,
        authorId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "✓ Aviso publicado", description: "El aviso ha sido creado exitosamente" });
      announcementForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

    const updateAnnouncementMutation = useMutation({
        mutationFn: async (data: AnnouncementForm & { id: number }) => {
            const { id, ...updateData } = data;
            const response = await apiRequest("PUT", `/api/announcements/${id}`, updateData);
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
            toast({ title: "Aviso actualizado", description: "El aviso ha sido actualizado exitosamente" });
            announcementForm.reset();
            setEditingAnnouncement(null);
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

  const createActivityMutation = useMutation({
    mutationFn: async (data: PlannedActivityForm) => {
      const response = await apiRequest("POST", "/api/planned-activities", {
        ...data,
        authorId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planned-activities"] });
      toast({ title: "✓ Actividad creada", description: "La actividad ha sido agregada exitosamente" });
      activityForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async (data: PlannedActivityForm & { id: number }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PUT", `/api/planned-activities/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planned-activities"] });
      toast({ title: "Actividad actualizada", description: "La actividad ha sido actualizada exitosamente" });
      activityForm.reset();
      setEditingActivity(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: UserUpdateForm & { userId: number }) => {
      const { userId, ...updateData } = data;
      const response = await apiRequest("PUT", `/api/users/${userId}`, { 
        ...updateData, 
        adminUpdate: true
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rankings"] });
      toast({ title: "✓ Usuario actualizado", description: "Los datos del usuario han sido actualizados" });
      setSelectedUser(null);
      userForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteNewsMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/news/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "Noticia eliminada", description: "La noticia ha sido eliminada exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/announcements/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Aviso eliminado", description: "El aviso ha sido eliminado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePlannedActivityMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/planned-activities/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planned-activities"] });
      toast({ title: "Actividad eliminada", description: "La actividad ha sido eliminada exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const assignTracesMutation = useMutation({
    mutationFn: async (data: TraceAssignmentForm) => {
      const response = await apiRequest("POST", "/api/admin/assign-traces", {
        ...data,
        adminId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rankings"] });
      toast({ title: "✓ Trazos asignados", description: "Los trazos han sido asignados exitosamente" });
      traceAssignmentForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

    const startEditingNews = (newsItem: any) => {
        setEditingNews(newsItem);
        newsForm.reset(newsItem);
    };

    const startEditingAnnouncement = (announcement: any) => {
        setEditingAnnouncement(announcement);
        announcementForm.reset(announcement);
    };

    const startEditingActivity = (activity: any) => {
        setEditingActivity(activity);
        activityForm.reset({
          title: activity.title,
          description: activity.description,
          arista: activity.arista,
          album: activity.album,
          deadline: activity.deadline || "",
          facebookLink: activity.facebookLink || "",
          activityCode: activity.activityCode || ""
        });
    };

  // Check admin permissions
  const isAdmin = user && (user.role === "admin" || user.signature === "#INELUDIBLE");

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <Card className="bg-black/60 backdrop-blur-xl border-red-500/20 p-8 shadow-2xl">
          <div className="text-center space-y-6">
            <div className="relative">
              <Shield className="w-20 h-20 text-red-400 mx-auto animate-pulse" />
              <div className="absolute inset-0 bg-red-400/20 rounded-full blur-xl"></div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Acceso Denegado</h2>
              <p className="text-gray-300">No tienes permisos para acceder al panel de administración</p>
            </div>
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-sm text-red-300">
              <p>Usuario: {user?.signature || 'No autenticado'}</p>
              <p>Rol: {user?.role || 'No definido'}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const onSelectUser = (selectedUser: User) => {
    setSelectedUser(selectedUser);
    userForm.reset({
      signature: selectedUser.signature,
      role: selectedUser.role,
      rank: selectedUser.rank || "Alma en tránsito",
      medal: selectedUser.medal || "none",
      totalTraces: selectedUser.totalTraces,
    });
  };

  // Statistics calculations
  const totalUsers = users.length;
  const totalTraces = users.reduce((sum, user) => sum + (user.totalTraces || 0), 0);
  const totalWords = users.reduce((sum, user) => sum + (user.totalWords || 0), 0);
  const totalActivities = users.reduce((sum, user) => sum + (user.totalActivities || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <h1 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Panel Administrativo
            </h1>
          </div>
          <p className="text-gray-400 text-sm md:text-base mt-2">Centro de control y gestión</p>
        </div>

        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card className="bg-black/60 backdrop-blur-xl border-purple-500/30 hover:border-purple-400/50 transition-all">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-purple-300 text-xs md:text-sm font-medium truncate">Usuarios</p>
                  <p className="text-xl md:text-2xl font-bold text-white">{totalUsers}</p>
                  <p className="text-gray-400 text-xs truncate">
                    {userCountData?.availableSlots || 0} cupos
                  </p>
                </div>
                <Users className="w-6 h-6 md:w-7 md:h-7 text-purple-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/60 backdrop-blur-xl border-indigo-500/30 hover:border-indigo-400/50 transition-all">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-indigo-300 text-xs md:text-sm font-medium truncate">Trazos</p>
                  <p className="text-xl md:text-2xl font-bold text-white">{totalTraces.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs truncate">
                    {Math.round(totalTraces / totalUsers || 0)} prom
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-indigo-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/60 backdrop-blur-xl border-blue-500/30 hover:border-blue-400/50 transition-all">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-blue-300 text-xs md:text-sm font-medium truncate">Palabras</p>
                  <p className="text-xl md:text-2xl font-bold text-white">{totalWords.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs truncate">
                    {Math.round(totalWords / totalUsers || 0)} prom
                  </p>
                </div>
                <FileText className="w-6 h-6 md:w-7 md:h-7 text-blue-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/60 backdrop-blur-xl border-gray-500/30 hover:border-gray-400/50 transition-all">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-gray-300 text-xs md:text-sm font-medium truncate">Actividades</p>
                  <p className="text-xl md:text-2xl font-bold text-white">{totalActivities}</p>
                  <p className="text-gray-400 text-xs truncate">
                    {Math.round(totalActivities / totalUsers || 0)} prom
                  </p>
                </div>
                <Activity className="w-6 h-6 md:w-7 md:h-7 text-gray-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 bg-black/60 backdrop-blur-xl border border-purple-500/20 h-auto p-1">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-600/30 data-[state=active]:text-white flex items-center gap-1 md:gap-2 p-2 md:p-3 text-xs md:text-sm">
              <BarChart3 className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-indigo-600/30 data-[state=active]:text-white flex items-center gap-1 md:gap-2 p-2 md:p-3 text-xs md:text-sm">
              <FileText className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Contenido</span>
              <span className="sm:hidden">Posts</span>
            </TabsTrigger>
            <TabsTrigger value="management" className="data-[state=active]:bg-indigo-600/30 data-[state=active]:text-white flex items-center gap-1 md:gap-2 p-2 md:p-3 text-xs md:text-sm">
              <Settings className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Gestión</span>
              <span className="sm:hidden">Manage</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-600/30 data-[state=active]:text-white flex items-center gap-1 md:gap-2 p-2 md:p-3 text-xs md:text-sm">
              <Users className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Usuarios</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="traces" className="data-[state=active]:bg-blue-600/30 data-[state=active]:text-white flex items-center gap-1 md:gap-2 p-2 md:p-3 text-xs md:text-sm">
              <Zap className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Trazos</span>
              <span className="sm:hidden">Traces</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-indigo-600/30 data-[state=active]:text-white flex items-center gap-1 md:gap-2 p-2 md:p-3 text-xs md:text-sm">
              <Calendar className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Calendario</span>
              <span className="sm:hidden">Cal</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-gray-600/30 data-[state=active]:text-white flex items-center gap-1 md:gap-2 p-2 md:p-3 text-xs md:text-sm">
              <HelpCircle className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Soporte</span>
              <span className="sm:hidden">Help</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* System Actions */}
              <Card className="bg-black/60 backdrop-blur-xl border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-purple-300 text-lg">
                    <Database className="w-5 h-5" />
                    Acciones del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-black/40 p-3 rounded-lg border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-purple-400" />
                      <h4 className="text-purple-300 font-medium text-sm">Actualizar Estadísticas</h4>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      Recalcula todas las estadísticas de usuarios.
                    </p>
                    <Button
                      onClick={async () => {
                        try {
                          const response = await apiRequest("POST", "/api/admin/refresh-all-stats", {
                            adminId: user?.id,
                          });
                          if (response.ok) {
                            queryClient.invalidateQueries();
                            toast({ title: "✓ Estadísticas actualizadas", description: "Todas las estadísticas han sido recalculadas" });
                          }
                        } catch (error: any) {
                          toast({ title: "Error", description: error.message, variant: "destructive" });
                        }
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700 h-8 text-xs"
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Actualizar
                    </Button>
                  </div>

                  <div className="bg-black/40 p-3 rounded-lg border border-indigo-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-indigo-300 font-medium text-sm">Limpiar Datos</h4>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      Elimina bonus duplicados por error.
                    </p>
                    <Button
                      onClick={async () => {
                        try {
                          const response = await apiRequest("POST", "/api/admin/clean-duplicate-bonuses", {
                            adminId: user?.id,
                          });
                          if (response.ok) {
                            queryClient.invalidateQueries();
                            toast({ title: "✓ Datos limpiados", description: "Bonus duplicados eliminados" });
                          }
                        } catch (error: any) {
                          toast({ title: "Error", description: error.message, variant: "destructive" });
                        }
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 h-8 text-xs"
                    >
                      <Database className="w-3 h-3 mr-1" />
                      Limpiar
                    </Button>
                  </div>

                  <div className="bg-black/40 p-3 rounded-lg border border-gray-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Trash2 className="w-4 h-4 text-gray-400" />
                      <h4 className="text-gray-300 font-medium text-sm">Gestión de Bimestre</h4>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      Elimina usuarios con menos de 1000 trazos.
                    </p>
                    <Button
                      onClick={async () => {
                        try {
                          const response = await apiRequest("POST", "/api/admin/remove-inactive-users", {
                            adminId: user?.id,
                            minimumTraces: 1000,
                          });
                          if (response.ok) {
                            queryClient.invalidateQueries();
                            toast({ title: "✓ Usuarios eliminados", description: "Usuarios inactivos removidos del sistema" });
                          }
                        } catch (error: any) {
                          toast({ title: "Error", description: error.message, variant: "destructive" });
                        }
                      }}
                      className="w-full bg-gray-600 hover:bg-gray-700 h-8 text-xs"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Eliminar Inactivos
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-black/60 backdrop-blur-xl border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-purple-300 text-lg">
                    <Clock className="w-5 h-5" />
                    Actividad Reciente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 bg-purple-900/20 rounded-lg border border-purple-500/30">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-purple-300 truncate">Noticias publicadas</p>
                        <p className="text-xs text-gray-400">{newsList.length} total</p>
                      </div>
                      <Badge className="bg-purple-500/30 text-purple-300 text-xs px-2 py-0">{newsList.length}</Badge>
                    </div>

                    <div className="flex items-center gap-3 p-2 bg-indigo-900/20 rounded-lg border border-indigo-500/30">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-indigo-300 truncate">Avisos publicados</p>
                        <p className="text-xs text-gray-400">{announcementsList.length} total</p>
                      </div>
                      <Badge className="bg-indigo-500/30 text-indigo-300 text-xs px-2 py-0">{announcementsList.length}</Badge>
                    </div>

                    <div className="flex items-center gap-3 p-2 bg-blue-900/20 rounded-lg border border-blue-500/30">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-blue-300 truncate">Actividades planificadas</p>
                        <p className="text-xs text-gray-400">{plannedActivitiesList.length} total</p>
                      </div>
                      <Badge className="bg-blue-500/30 text-blue-300 text-xs px-2 py-0">{plannedActivitiesList.length}</Badge>
                    </div>

                    <div className="flex items-center gap-3 p-2 bg-gray-900/20 rounded-lg border border-gray-500/30">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300 truncate">Sistema en línea</p>
                        <p className="text-xs text-gray-400">Funcionando correctamente</p>
                      </div>
                      <Badge className="bg-gray-500/30 text-gray-300 text-xs px-2 py-0">Online</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Management Tab */}
          <TabsContent value="content" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Create News */}
              <Card className="bg-black/60 backdrop-blur-xl border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-purple-300 text-lg">
                    <FileText className="w-5 h-5" />
                    Crear Noticia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...newsForm}>
                    <form onSubmit={newsForm.handleSubmit((data) => {
                      editingNews ? updateNewsMutation.mutate({ ...data, id: editingNews.id }) : createNewsMutation.mutate(data)
                    })} className="space-y-4">
                      <FormField
                        control={newsForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 text-sm">Título</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Título de la noticia"
                                className="bg-black/50 border-purple-500/30 text-white placeholder-gray-400 focus:border-purple-400 h-9"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={newsForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 text-sm">Contenido</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Contenido de la noticia..."
                                rows={4}
                                className="bg-black/50 border-purple-500/30 text-white placeholder-gray-400 focus:border-purple-400 resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={createNewsMutation.isPending || updateNewsMutation.isPending}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium h-9"
                      >
                        {createNewsMutation.isPending
                          ? "Publicando..."
                          : updateNewsMutation.isPending
                            ? "Guardando..."
                            : editingNews
                              ? "Guardar Noticia"
                              : "Publicar Noticia"}
                      </Button>
                      {editingNews && (
                        <Button
                          type="button"
                          variant="outline"
                          className="border-gray-600/30 text-gray-300 hover:bg-gray-800/50 h-9"
                          onClick={() => {
                            setEditingNews(null);
                            newsForm.reset();
                          }}
                        >
                          Cancelar
                        </Button>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Create Announcement */}
              <Card className="bg-black/60 backdrop-blur-xl border-indigo-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-indigo-300 text-lg">
                    <MessageSquare className="w-5 h-5" />
                    Crear Aviso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...announcementForm}>
                    <form onSubmit={announcementForm.handleSubmit((data) => {
                      editingAnnouncement ? updateAnnouncementMutation.mutate({ ...data, id: editingAnnouncement.id }) : createAnnouncementMutation.mutate(data)
                    })} className="space-y-4">
                      <FormField
                        control={announcementForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 text-sm">Título</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Título del aviso"
                                className="bg-black/50 border-indigo-500/30 text-white placeholder-gray-400 focus:border-indigo-400 h-9"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={announcementForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 text-sm">Contenido</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Contenido del aviso..."
                                rows={4}
                                className="bg-black/50 border-indigo-500/30 text-white placeholder-gray-400 focus:border-indigo-400 resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium h-9"
                      >
                        {createAnnouncementMutation.isPending
                          ? "Publicando..."
                          : updateAnnouncementMutation.isPending
                            ? "Guardando..."
                            : editingAnnouncement
                              ? "Guardar Aviso"
                              : "Publicar Aviso"}
                      </Button>
                      {editingAnnouncement && (
                        <Button
                          type="button"
                          variant="outline"
                          className="border-gray-600/30 text-gray-300 hover:bg-gray-800/50 h-9"
                          onClick={() => {
                            setEditingAnnouncement(null);
                            announcementForm.reset();
                          }}
                        >
                          Cancelar
                        </Button>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Create Planned Activity */}
              <Card className="bg-black/60 backdrop-blur-xl border-blue-500/30 lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-300 text-lg">
                    <Calendar className="w-5 h-5" />
                    Crear Actividad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...activityForm}>
                    <form onSubmit={activityForm.handleSubmit((data) => {
                      editingActivity ? updateActivityMutation.mutate({ ...data, id: editingActivity.id }) : createActivityMutation.mutate(data)
                    })} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={activityForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300 text-sm">Título</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Título de la actividad"
                                  className="bg-black/50 border-blue-500/30 text-white placeholder-gray-400 focus:border-blue-400 h-9"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={activityForm.control}
                          name="arista"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300 text-sm">Arista</FormLabel>
                              <Select onValueChange={(value) => {
                                field.onChange(value);
                                activityForm.setValue("album", "");
                                // Clear deadline if not Express activities
                                if (value !== "actividades-express") {
                                  activityForm.setValue("deadline", "");
                                }
                              }} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-black/50 border-blue-500/30 text-white h-9">
                                    <SelectValue placeholder="Selecciona una arista" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(ARISTAS).map(([key, arista]) => (
                                    <SelectItem key={key} value={key}>
                                      {arista.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={activityForm.control}
                        name="album"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 text-sm">Álbum</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-black/50 border-blue-500/30 text-white h-9">
                                  <SelectValue placeholder="Selecciona un álbum" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {getAvailableAlbums(activityForm.watch("arista")).map((album) => (
                                  <SelectItem key={album.id} value={album.id}>
                                    {album.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Show deadline field only for Express activities */}
                      {activityForm.watch("arista") === "actividades-express" && (
                        <FormField
                          control={activityForm.control}
                          name="deadline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300 text-sm flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Fecha Límite (opcional)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="datetime-local"
                                  value={field.value || ""}
                                  className="bg-black/50 border-blue-500/30 text-white h-9"
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-gray-400 mt-1">
                                Si se establece una fecha límite, aparecerá un temporizador en "Actividades por Realizar"
                              </p>
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={activityForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 text-sm">Descripción</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Descripción de la actividad..."
                                rows={3}
                                className="bg-black/50 border-blue-500/30 text-white placeholder-gray-400 focus:border-blue-400 resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={activityForm.control}
                        name="activityCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 text-sm">Código de Actividad</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ej: ACT001"
                                className="bg-black/50 border-blue-500/30 text-white placeholder-gray-400 focus:border-blue-400 h-9"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={activityForm.control}
                        name="facebookLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 text-sm">Link de Facebook (opcional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="url"
                                placeholder="https://facebook.com/..."
                                className="bg-black/50 border-blue-500/30 text-white placeholder-gray-400 focus:border-blue-400 h-9"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={createActivityMutation.isPending || updateActivityMutation.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-9"
                      >
                        {createActivityMutation.isPending
                          ? "Creando..."
                          : updateActivityMutation.isPending
                            ? "Guardando..."
                            : editingActivity
                              ? "Guardar Actividad"
                              : "Crear Actividad"}
                      </Button>
                      {editingActivity && (
                        <Button
                          type="button"
                          variant="outline"
                          className="border-gray-600/30 text-gray-300 hover:bg-gray-800/50 h-9"
                          onClick={() => {
                            setEditingActivity(null);
                            activityForm.reset();
                          }}
                        >
                          Cancelar
                        </Button>
                      )}
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Management Tab */}
          <TabsContent value="management" className="mt-4">
            <div className="space-y-6">
              {/* Trace Assignments Management */}
              <Card className="bg-black/60 backdrop-blur-xl border-yellow-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-yellow-300 text-lg">
                    <Zap className="w-5 h-5" />
                    Gestión de Asignaciones de Trazos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {traceAssignments?.map((assignment: any) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-gray-700/50">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm truncate">{assignment.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-0">
                              {assignment.traces_amount} trazos
                            </Badge>
                            <Badge variant="outline" className="text-xs border-medium-gray/30 text-medium-gray">
                              {assignment.user_signatures?.length || 0} usuarios
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(assignment.assignment_date).toLocaleDateString('es-ES')} - {assignment.admin_signature}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 truncate">{assignment.reason}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              alert(`Usuarios: ${assignment.user_signatures?.join(', ')}\nRazón: ${assignment.reason}`);
                            }}
                            className="border-gray-600/30 text-gray-300 hover:bg-gray-800/50 h-8 text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Detalles
                          </Button>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-400 text-center py-4">No hay asignaciones de trazos registradas.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Published News Management */}
              <Card className="bg-black/60 backdrop-blur-xl border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-purple-300 text-lg">
                    <FileText className="w-5 h-5" />
                    Gestión de Noticias Publicadas ({newsList.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {newsList.map((newsItem: any) => (
                      <div key={newsItem.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-gray-700/50">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm truncate">{newsItem.title}</h4>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(newsItem.createdAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingNewsViewers(newsItem.id)}
                            className="border-gray-600/30 text-gray-300 hover:bg-gray-800/50 h-8 text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Viewers
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => startEditingNews(newsItem)}
                            className="bg-purple-600 hover:bg-purple-700 h-8 text-xs"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteNewsMutation.mutate(newsItem.id)}
                            className="border-red-600/30 text-red-300 hover:bg-red-800/50 h-8 text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Published Announcements Management */}
              <Card className="bg-black/60 backdrop-blur-xl border-indigo-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-indigo-300 text-lg">
                    <MessageSquare className="w-5 h-5" />
                    Gestión de Avisos Publicados ({announcementsList.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {announcementsList.map((announcement: any) => (
                      <div key={announcement.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-gray-700/50">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm truncate">{announcement.title}</h4>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(announcement.createdAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingAnnouncementViewers(announcement.id)}
                            className="border-gray-600/30 text-gray-300 hover:bg-gray-800/50 h-8 text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Viewers
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => startEditingAnnouncement(announcement)}
                            className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                            className="border-red-600/30 text-red-300 hover:bg-red-800/50 h-8 text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Published Activities Management */}
              <Card className="bg-black/60 backdrop-blur-xl border-blue-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-300 text-lg">
                    <Calendar className="w-5 h-5" />
                    Gestión de Actividades Publicadas ({plannedActivitiesList.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {plannedActivitiesList.map((activity: any) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-gray-700/50">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm truncate">{activity.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0">
                              {activity.arista}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-gray-500/20 text-gray-300 px-2 py-0">
                              {activity.album}
                            </Badge>
                            {activity.activityCode && (
                              <Badge className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0">
                                #{activity.activityCode}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(activity.createdAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => startEditingActivity(activity)}
                            className="bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deletePlannedActivityMutation.mutate(activity.id)}
                            className="border-red-600/30 text-red-300 hover:bg-red-800/50 h-8 text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Users List */}
              <Card className="lg:col-span-2 bg-black/60 backdrop-blur-xl border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-purple-300 text-lg">
                    <Users className="w-5 h-5" />
                    Lista de Usuarios ({users.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {users.map((userItem) => (
                      <div
                        key={userItem.id}
                        className="rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-all bg-black/30"
                      >
                        {/* User Header */}
                        <div
                          className="p-3 cursor-pointer"
                          onClick={() => setExpandedUser(expandedUser === userItem.id ? null : userItem.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-white text-sm truncate">{userItem.fullName}</h4>
                              <div className="flex items-center gap-1 mt-1">
                                <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0">
                                  {userItem.signature}
                                </Badge>
                                {userItem.role === "admin" && (
                                  <Badge className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-1 truncate">{userItem.rank}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-lg font-bold text-purple-400">{userItem.totalTraces}</div>
                              <div className="text-xs text-gray-400">trazos</div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedUser === userItem.id && (
                          <div className="px-3 pb-3 border-t border-gray-700/30">
                            <div className="mt-3 space-y-3">
                              {/* User Summary */}
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-gray-800/40 p-2 rounded">
                                  <p className="text-gray-400">Palabras</p>
                                  <p className="text-white font-semibold">{userItem.totalWords || 0}</p>
                                </div>
                                <div className="bg-gray-800/40 p-2 rounded">
                                  <p className="text-gray-400">Actividades</p>
                                  <p className="text-white font-semibold">{userItem.totalActivities || 0}</p>
                                </div>
                                <div className="bg-gray-800/40 p-2 rounded">
                                  <p className="text-gray-400">Medalla</p>
                                  <p className="text-white font-semibold">{userItem.medal || "Sin medalla"}</p>
                                </div>
                                <div className="bg-gray-800/40 p-2 rounded">
                                  <p className="text-gray-400">Registro</p>
                                  <p className="text-white font-semibold">
                                    {userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString() : "N/A"}
                                  </p>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectUser(userItem);
                                  }}
                                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white h-8 text-xs"
                                >
                                  <Edit2 className="w-3 h-3 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`/usuario/${userItem.id}`, '_blank');
                                  }}
                                  variant="outline"
                                  className="flex-1 border-gray-600/30 text-gray-300 hover:bg-gray-800/50 h-8 text-xs"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Ver Perfil
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* User Edit Form */}
              {selectedUser && (
                <Card className="bg-black/60 backdrop-blur-xl border-purple-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-purple-300 text-lg">
                      <Settings className="w-5 h-5" />
                      Editar Usuario
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...userForm}>
                      <form onSubmit={userForm.handleSubmit((data) => updateUserMutation.mutate({ ...data, userId: selectedUser.id }))} className="space-y-3">
                        <div className="mb-3 p-2 bg-purple-900/20 rounded-lg border border-purple-500/30">
                          <h4 className="font-semibold text-purple-300 text-sm">{selectedUser.fullName}</h4>
                          <p className="text-xs text-gray-400">ID: {selectedUser.id}</p>
                        </div>

                        <FormField
                          control={userForm.control}
                          name="signature"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300 text-sm">Firma</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="bg-black/50 border-purple-500/30 text-white h-8"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={userForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300 text-sm">Rol</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-black/50 border-purple-500/30 text-white h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="user">Usuario</SelectItem>
                                  <SelectItem value="admin">Administrador</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={userForm.control}
                          name="rank"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300 text-sm">Rango</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-black/50 border-purple-500/30 text-white h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {RANKS.map((rank) => (
                                    <SelectItem key={rank} value={rank}>
                                      {rank}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={userForm.control}
                          name="totalTraces"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300 text-sm">Trazos Totales</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  className="bg-black/50 border-purple-500/30 text-white h-8"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={userForm.control}
                          name="medal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-300 text-sm">Medalla</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-black/50 border-purple-500/30 text-white h-8">
                                    <SelectValue placeholder="Seleccionar medalla" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">Sin medalla</SelectItem>
                                  {MEDALS.map((medal) => (
                                    <SelectItem key={medal} value={medal}>
                                      {medal}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex space-x-2 pt-2">
                          <Button
                            type="submit"
                            disabled={updateUserMutation.isPending}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 h-8 text-sm"
                          >
                            {updateUserMutation.isPending ? "Guardando..." : "Guardar"}
                          </Button>

                          <Button
                            type="button"
                            onClick={() => setSelectedUser(null)}
                            variant="outline"
                            className="border-gray-600/30 text-gray-300 hover:bg-gray-800/50 h-8 text-sm"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Trace Assignment Tab */}
          <TabsContent value="traces" className="mt-4">
            <Card className="bg-black/60 backdrop-blur-xl border-blue-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-300 text-lg">
                  <Zap className="w-5 h-5" />
                  Asignar Trazos Masivamente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...traceAssignmentForm}>
                  <form onSubmit={traceAssignmentForm.handleSubmit((data) => assignTracesMutation.mutate(data))} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={traceAssignmentForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Título</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ej: Trazos de bonificación navideña"
                                className="bg-gray-800/50 border-gray-600/30 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={traceAssignmentForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">Fecha</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="date"
                                className="bg-gray-800/50 border-gray-600/30 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={traceAssignmentForm.control}
                      name="tracesAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Cantidad de Trazos</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              placeholder="100"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              className="bg-gray-800/50 border-gray-600/30 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={traceAssignmentForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Razón</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Explica por qué se asignan estos trazos..."
                              rows={3}
                              className="bg-gray-800/50 border-gray-600/30 text-white resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={traceAssignmentForm.control}
                      name="selectedUsers"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-gray-300">Seleccionar Usuarios</FormLabel>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const allUserIds = users.map(u => u.id);
                                const isAllSelected = allUserIds.every(id => field.value.includes(id));
                                field.onChange(isAllSelected ? [] : allUserIds);
                              }}
                              className="border-yellow-500/30 text-yellow-300"
                            >
                              {users.length > 0 && users.every(u => field.value.includes(u.id)) ? "Deseleccionar todos" : "Seleccionar todos"}
                            </Button>
                          </div>
                          <div className="bg-gray-800/30 border border-gray-600/30 rounded-md p-4 max-h-40 overflow-y-auto">
                            <div className="space-y-2">
                              {users.map((userItem) => (
                                <label key={userItem.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-700/20 p-2 rounded">
                                  <input
                                    type="checkbox"
                                    checked={field.value.includes(userItem.id)}
                                    onChange={(e) => {
                                      const newValue = e.target.checked
                                        ? [...field.value, userItem.id]
                                        : field.value.filter(id => id !== userItem.id);
                                      field.onChange(newValue);
                                    }}
                                    className="rounded border-gray-600/30"
                                  />
                                  <div className="flex-1">
                                    <div className="text-white font-medium">{userItem.fullName}</div>
                                    <div className="text-sm text-gray-400">{userItem.signature}</div>
                                  </div>
                                  <div className="text-yellow-400 font-bold">{userItem.totalTraces || 0} trazos</div>
                                </label>
                              ))}
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={assignTracesMutation.isPending || traceAssignmentForm.watch("selectedUsers").length === 0}
                      className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold text-lg py-4"
                    >
                      {assignTracesMutation.isPending ? "Asignando..." : `Asignar ${traceAssignmentForm.watch("tracesAmount") || 0} trazos a ${traceAssignmentForm.watch("selectedUsers").length} usuarios`}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="mt-8">
            <AdminCalendar />
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="mt-8">
            <SupportTicketsManagement user={user} />
          </TabsContent>
        </Tabs>

        {/* News Viewers Dialog */}
        <Dialog open={viewingNewsViewers !== null} onOpenChange={() => setViewingNewsViewers(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Usuarios que han visto esta noticia</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {newsViewers.map((viewer: any) => (
                <div key={viewer.id} className="flex items-center gap-3 p-2 bg-gray-800/30 rounded">
                  <div className="flex-1">
                    <p className="text-white font-medium">{viewer.signature}</p>
                    <p className="text-sm text-gray-400">{viewer.fullName}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(viewer.viewedAt).toLocaleString('es-ES')}
                  </div>
                </div>
              ))}
              {newsViewers.length === 0 && (
                <p className="text-gray-400 text-center py-4">Nadie ha visto esta noticia aún.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Announcement Viewers Dialog */}
        <Dialog open={viewingAnnouncementViewers !== null} onOpenChange={() => setViewingAnnouncementViewers(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Usuarios que han visto este aviso</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {announcementViewers.map((viewer: any) => (
                <div key={viewer.id} className="flex items-center gap-3 p-2 bg-gray-800/30 rounded">
                  <div className="flex-1">
                    <p className="text-white font-medium">{viewer.signature}</p>
                    <p className="text-sm text-gray-400">{viewer.fullName}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(viewer.viewedAt).toLocaleString('es-ES')}
                  </div>
                </div>
              ))}
              {announcementViewers.length === 0 && (
                <p className="text-gray-400 text-center py-4">Nadie ha visto este aviso aún.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}