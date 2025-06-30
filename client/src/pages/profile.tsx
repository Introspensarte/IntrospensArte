import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RANKS, MEDALS, ARISTAS, ACTIVITY_TYPES } from "@/lib/constants";
import { Plus, Edit, Trash2, ExternalLink, Edit3, RefreshCw } from "lucide-react";
import type { Activity } from "@shared/schema";

const profileSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  age: z.number().min(13, "Debes ser mayor de 13 años").max(120, "Edad inválida"),
  birthday: z.string().regex(/^\d{2}\/\d{2}$/, "Formato debe ser DD/MM"),
  facebookLink: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  signature: z.string().min(2, "La firma debe tener al menos 2 caracteres").startsWith("#", "La firma debe comenzar con #"),
  role: z.string(),
  rank: z.string(),
  medal: z.string().optional(),
});

const activityEditSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  date: z.string().min(1, "La fecha es requerida"),
  wordCount: z.number().min(1, "Debe tener al menos 1 palabra"),
  type: z.string().min(1, "El tipo es requerido"),
  responses: z.number().optional().nullable(),
  link: z.string().url("Debe ser una URL válida").optional().or(z.literal("")).or(z.undefined()),
  imageUrl: z.string().min(1, "La URL de la imagen es requerida"),
  description: z.string().min(1, "La descripción es requerida"),
  arista: z.string().min(1, "La arista es requerida"),
  album: z.string().min(1, "El álbum es requerido"),
});

type ProfileForm = z.infer<typeof profileSchema>;
type ActivityEditForm = z.infer<typeof activityEditSchema>;

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

export default function Profile() {
  const { user, updateUser, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingActivities, setIsEditingActivities] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: [`/api/users/${user?.id}/activities`],
    enabled: !!user,
  });

  const { data: recentActivities = [] } = useQuery<Activity[]>({
    queryKey: [`/api/users/${user?.id}/activities?limit=3`],
    enabled: !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const { data: bonusHistory = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${user?.id}/bonus-history`],
    enabled: !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Only refresh user data when explicitly requested
  const { data: currentUser } = useQuery({
    queryKey: [`/api/users/${user?.id}`],
    enabled: !!user?.id,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  const refreshStatsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/users/${user?.id}/refresh-stats`, {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data.user && updateUser) {
        updateUser(data.user);
      }
      toast({
        title: "Estadísticas actualizadas",
        description: data.message || "Las estadísticas han sido recalculadas",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar estadísticas",
        description: error.message || "Ha ocurrido un error",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<ProfileForm>) => {
      const response = await apiRequest("PUT", `/api/users/${user?.id}`, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });
      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido guardados exitosamente",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar",
        description: error.message || "Ha ocurrido un error",
        variant: "destructive",
      });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId: number) => {
      const response = await apiRequest("DELETE", `/api/activities/${activityId}`, { userId: user?.id });
      return response.json();
    },
    onSuccess: (data) => {
      // Update user stats if returned from API
      if (data.user && updateUser) {
        updateUser(data.user);
      }

      toast({
        title: "Actividad eliminada",
        description: "La actividad ha sido eliminada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/activities`] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rankings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar",
        description: error.message || "Ha ocurrido un error",
        variant: "destructive",
      });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async ({ activityId, data }: { activityId: number; data: ActivityEditForm }) => {
      if (!user?.id) {
        throw new Error("Usuario no autenticado");
      }

      const updateData = {
        userId: user.id,
        name: data.name,
        date: data.date,
        wordCount: data.wordCount,
        type: data.type,
        responses: data.responses || undefined,
        link: data.link?.trim() || undefined,
        imageUrl: data.imageUrl || "",
        description: data.description,
        arista: data.arista,
        album: data.album,
      };

      const response = await apiRequest("PUT", `/api/activities/${activityId}`, updateData);
      return response.json();
    },
    onSuccess: (data) => {
      // Update user stats if returned from API
      if (data.user && updateUser) {
        updateUser(data.user);
      }

      toast({
        title: "Actividad actualizada",
        description: "La actividad ha sido actualizada exitosamente",
      });

      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/activities`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/activities?limit=3`] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rankings"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });

      setIsEditDialogOpen(false);
      setEditingActivity(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar",
        description: error.message || "Ha ocurrido un error",
        variant: "destructive",
      });
    },
  });

  const activityEditForm = useForm<ActivityEditForm>({
    resolver: zodResolver(activityEditSchema),
    defaultValues: {
      name: "",
      date: "",
      wordCount: 1,
      type: "",
      responses: undefined,
      link: "",
      imageUrl: "",
      description: "",
      arista: "",
      album: "",
    },
  });

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      age: user?.age || 18,
      birthday: user?.birthday || "",
      facebookLink: user?.facebookLink || "",
      signature: user?.signature || "",
      role: user?.role || "user",
      rank: user?.rank || "Alma en tránsito",
      medal: user?.medal || "",
    },
  });

  

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-light-gray">Debes iniciar sesión para ver tu perfil</p>
      </div>
    );
  }

  const onSubmit = (data: ProfileForm) => {
    // Only allow admin to edit certain fields
    const updateData = user.role === "admin" 
      ? data 
      : {
          fullName: data.fullName,
          age: data.age,
          birthday: data.birthday,
          facebookLink: data.facebookLink,
          // Exclude rank from non-admin updates
        };

    updateMutation.mutate(updateData);
  };

  const userMedal = MEDALS.find(m => m.rank === user.rank)?.medal;

  const handleDeleteActivity = (activityId: number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta actividad?")) {
      deleteActivityMutation.mutate(activityId);
    }
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    activityEditForm.reset({
      name: activity.name,
      date: activity.date ? new Date(activity.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      wordCount: activity.word_count || activity.wordCount || 1,
      type: activity.type,
      responses: activity.responses || undefined,
      link: activity.link || "",
      imageUrl: activity.image_url || (activity.image_path ? `/api/images/${activity.image_path}` : ""),
      description: activity.description,
      arista: activity.arista,
      album: activity.album,
    });
    setIsEditDialogOpen(true);
  };

  const onActivityEditSubmit = (data: ActivityEditForm) => {
    if (editingActivity) {
      console.log("Submitting activity edit:", data);
      updateActivityMutation.mutate({
        activityId: editingActivity.id!,
        data: {
          name: data.name,
          date: data.date,
          wordCount: data.wordCount,
          type: data.type,
          responses: data.responses || undefined,
          link: data.link?.trim() || undefined,
          imageUrl: data.imageUrl,
          description: data.description,
          arista: data.arista,
          album: data.album,
        },
      });
    }
  };

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
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {/* Profile Information */}
          <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="font-playfair text-2xl">Mi Perfil</CardTitle>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  size="sm"
                  className="border-soft-lavender/30 text-soft-lavender hover:bg-soft-lavender/10"
                >
                  {isEditing ? "Cancelar" : "Editar"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-light-gray">Nombre y Apellido</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-dark-graphite border-medium-gray/30 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-light-gray">Edad</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                className="bg-dark-graphite border-medium-gray/30 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="birthday"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-light-gray">Cumpleaños</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="DD/MM"
                                className="bg-dark-graphite border-medium-gray/30 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="facebookLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-light-gray">Facebook</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="url"
                              className="bg-dark-graphite border-medium-gray/30 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Admin-only fields */}
                    {user.role === "admin" && (
                      <FormField
                        control={form.control}
                        name="signature"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-light-gray">Firma</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-dark-graphite border-medium-gray/30 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Rank field - only editable by admins */}
                  <FormField
                    control={form.control}
                    name="rank"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-light-gray">Rango</FormLabel>
                        {user.role === "admin" ? (
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-dark-graphite border-medium-gray/30 text-white">
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
                        ) : (
                          <Input
                            value={field.value}
                            disabled
                            className="bg-medium-gray/20 border-medium-gray/30 text-medium-gray cursor-not-allowed"
                          />
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="w-full glow-button"
                  >
                    {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </form>
              </Form>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="font-playfair text-2xl">Estadísticas</CardTitle>
              <Button
                onClick={() => refreshStatsMutation.mutate()}
                disabled={refreshStatsMutation.isPending}
                variant="outline"
                size="sm"
                className="border-soft-lavender/30 text-soft-lavender hover:bg-soft-lavender/10"
              >
                {refreshStatsMutation.isPending ? "..." : "↻"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-soft-lavender">{user.totalTraces || 0}</div>
                <div className="text-sm text-light-gray">Trazos totales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-soft-lavender">{user.totalWords || 0}</div>
                <div className="text-sm text-light-gray">Palabras</div>
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="text-2xl font-bold text-soft-lavender">{user.totalActivities || 0}</div>
              <div className="text-sm text-light-gray">Actividades realizadas</div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-3">Últimas actividades</h4>
              <div className="space-y-2">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="p-3 bg-medium-gray/10 rounded-lg">
                      <div className="font-medium text-white">{activity.name}</div>
                      <div className="text-sm text-light-gray">
                        {activity.type} • {activity.wordCount} palabras • {activity.traces} trazos
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-medium-gray text-sm">No hay actividades aún</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Activities */}
        <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20 lg:col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="font-playfair text-2xl">Mis Actividades</CardTitle>
              <Button
                onClick={() => setIsEditingActivities(!isEditingActivities)}
                variant="outline"
                size="sm"
                className="border-soft-lavender/30 text-soft-lavender hover:bg-soft-lavender/10"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
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
                      {isEditingActivities && (
                        <div className="flex flex-col gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditActivity(activity)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-1 h-auto"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteActivity(activity.id!)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 h-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
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
                <p className="text-medium-gray text-sm">No tienes actividades aún</p>
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
                <p className="text-medium-gray text-sm">No tienes bonificaciones registradas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black/95 border-medium-gray/30">
          <DialogHeader>
            <DialogTitle className="font-playfair text-2xl text-white">
              Editar Actividad
            </DialogTitle>
          </DialogHeader>

          <Form {...activityEditForm}>
            <form onSubmit={activityEditForm.handleSubmit(onActivityEditSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={activityEditForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-gray">Nombre de la actividad</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Título de tu obra"
                          className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={activityEditForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-gray">Fecha</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="bg-dark-graphite border-medium-gray/30 text-white focus:border-soft-lavender"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={activityEditForm.control}
                  name="wordCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-gray">Número de palabras</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="Ej: 500"
                            value={field.value === undefined ? "" : field.value}
                            onChange={(e) => {
                              const value = e.target.value;
                                                            if (value === "") {
                                field.onChange(undefined);
                              } else {
                                const numValue = parseInt(value);
                                field.onChange(isNaN(numValue) ? undefined : numValue);
                              }
                            }}
                            className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={activityEditForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-light-gray">Tipo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-dark-graphite border-medium-gray/30 text-white focus:border-soft-lavender">
                              <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ACTIVITY_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {(activityEditForm.watch("type") === "hilo" || activityEditForm.watch("type") === "rol") && (
                  <FormField
                    control={activityEditForm.control}
                    name="responses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-light-gray">Respuestas (si aplica)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="Número de respuestas"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                            className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={activityEditForm.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-gray">Link (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://enlace-a-tu-obra.com"
                          className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={activityEditForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-gray">URL de imagen *</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            {...field}
                            type="url"
                            placeholder="https://ejemplo.com/imagen.jpg"
                            className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender"
                          />
                          {field.value && (
                            <div className="mt-2">
                              <img 
                                src={field.value} 
                                alt="Vista previa" 
                                className="w-32 h-32 object-cover rounded border border-medium-gray/30"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://via.placeholder.com/150x150/808080/FFFFFF?text=Error";
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                      <div className="text-xs text-medium-gray mt-1">
                        <p>Pega aquí la URL de tu imagen desde Facebook, Pinterest, Instagram, etc.</p>
                        <p>Ejemplo: https://i.pinimg.com/564x/...</p>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={activityEditForm.control}
                    name="arista"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-light-gray">Arista</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          activityEditForm.setValue("album", "");
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-dark-graphite border-medium-gray/30 text-white focus:border-soft-lavender">
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

                  <FormField
                    control={activityEditForm.control}
                    name="album"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-light-gray">Álbum</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          // Auto-assign 100 traces for "Actividad Tardía"
                          if (value === "actividad-tardia") {
                            console.log("Actividad Tardía selected - will assign 100 traces on submit");
                          }
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-dark-graphite border-medium-gray/30 text-white focus:border-soft-lavender">
                              <SelectValue placeholder="Selecciona un álbum" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(activityEditForm.watch("arista") ? ARISTAS[activityEditForm.watch("arista") as keyof typeof ARISTAS]?.albums || [] : []).map((album) => (
                              <SelectItem key={album.id} value={album.id}>
                                {album.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {activityEditForm.watch("album") === "actividad-tardia" && (
                          <div className="text-xs text-gold mt-1 p-2 bg-gold/10 rounded border border-gold/20">
                            ⚠️ Actividad Tardía: Se asignarán automáticamente 100 trazos sin importar el número de palabras o tipo de actividad.
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={activityEditForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-gray">Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe tu creación..."
                          rows={3}
                          className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={updateActivityMutation.isPending}
                    className="flex-1 glow-button"
                  >
                    {updateActivityMutation.isPending ? "Guardando..." : "Guardar cambios"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="border-medium-gray/30 text-medium-gray hover:bg-medium-gray/10"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}