
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, Lightbulb, MessageSquare, Eye, Edit, CheckCircle } from "lucide-react";
import type { User } from "@shared/schema";

interface SupportTicketsManagementProps {
  user: User | null;
}

export default function SupportTicketsManagement({ user }: SupportTicketsManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const { data: tickets = [] } = useQuery({
    queryKey: [`/api/admin/support/tickets?adminId=${user?.id}`],
    enabled: !!user && (user.role === "admin" || user.signature === "#INELUDIBLE"),
    refetchInterval: 30000,
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, status, response }: { ticketId: number; status: string; response?: string }) => {
      const apiResponse = await apiRequest("PUT", `/api/admin/support/tickets/${ticketId}`, {
        adminId: user?.id,
        status,
        adminResponse: response,
      });
      return apiResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/support/tickets?adminId=${user?.id}`] });
      toast({
        title: "Ticket actualizado",
        description: "El ticket ha sido actualizado exitosamente",
      });
      setSelectedTicket(null);
      setAdminResponse("");
      setNewStatus("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reclamo':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'sugerencia':
        return <Lightbulb className="w-4 h-4 text-yellow-400" />;
      case 'problema':
        return <AlertCircle className="w-4 h-4 text-orange-400" />;
      case 'contacto':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return "bg-yellow-500/20 text-yellow-400";
      case 'in_progress':
        return "bg-blue-500/20 text-blue-400";
      case 'resolved':
        return "bg-green-500/20 text-green-400";
      case 'closed':
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return "Pendiente";
      case 'in_progress':
        return "En Proceso";
      case 'resolved':
        return "Resuelto";
      case 'closed':
        return "Cerrado";
      default:
        return "Desconocido";
    }
  };

  const pendingTickets = tickets.filter((t: any) => t.status === 'pending');
  const inProgressTickets = tickets.filter((t: any) => t.status === 'in_progress');
  const resolvedTickets = tickets.filter((t: any) => t.status === 'resolved');

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-yellow-900/20 border-yellow-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{pendingTickets.length}</div>
            <div className="text-sm text-yellow-300">Pendientes</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-900/20 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{inProgressTickets.length}</div>
            <div className="text-sm text-blue-300">En Proceso</div>
          </CardContent>
        </Card>
        <Card className="bg-green-900/20 border-green-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{resolvedTickets.length}</div>
            <div className="text-sm text-green-300">Resueltos</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/20 border-gray-500/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-400">{tickets.length}</div>
            <div className="text-sm text-gray-300">Total</div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
        <CardHeader>
          <CardTitle className="font-playfair text-2xl">Tickets de Soporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <Accordion type="single" collapsible className="w-full">
              {tickets.map((ticket: any) => (
                <AccordionItem key={ticket.id} value={`ticket-${ticket.id}`} className="border-medium-gray/20">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between items-center w-full mr-4">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(ticket.type)}
                        <div className="text-left">
                          <h4 className="font-semibold text-white">{ticket.subject}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getStatusColor(ticket.status)}>
                              {getStatusLabel(ticket.status)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {ticket.type}
                            </Badge>
                            {ticket.isAnonymous && (
                              <Badge variant="outline" className="text-xs text-purple-400">
                                Anónimo
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-light-gray">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4 space-y-4">
                      <div>
                        <h5 className="font-medium text-white mb-2">Descripción:</h5>
                        <p className="text-light-gray text-sm">{ticket.description}</p>
                      </div>

                      {ticket.email && (
                        <div>
                          <h5 className="font-medium text-white mb-2">Email de contacto:</h5>
                          <p className="text-light-gray text-sm">{ticket.email}</p>
                        </div>
                      )}

                      {ticket.adminResponse && (
                        <div className="bg-green-900/20 p-3 rounded border border-green-500/30">
                          <h5 className="font-medium text-green-300 mb-2">Respuesta del administrador:</h5>
                          <p className="text-light-gray text-sm">{ticket.adminResponse}</p>
                        </div>
                      )}

                      <div className="flex space-x-2 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setAdminResponse(ticket.adminResponse || "");
                                setNewStatus(ticket.status);
                              }}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Gestionar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-black/95 border-medium-gray/20 text-white max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-purple-300">Gestionar Ticket</DialogTitle>
                            </DialogHeader>
                            {selectedTicket && (
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">Asunto: {selectedTicket.subject}</h4>
                                  <p className="text-sm text-light-gray">{selectedTicket.description}</p>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-light-gray mb-2">
                                    Estado
                                  </label>
                                  <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger className="bg-dark-graphite border-medium-gray/30 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pendiente</SelectItem>
                                      <SelectItem value="in_progress">En Proceso</SelectItem>
                                      <SelectItem value="resolved">Resuelto</SelectItem>
                                      <SelectItem value="closed">Cerrado</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-light-gray mb-2">
                                    Respuesta del administrador
                                  </label>
                                  <Textarea
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                    placeholder="Escribe tu respuesta..."
                                    rows={4}
                                    className="bg-dark-graphite border-medium-gray/30 text-white resize-none"
                                  />
                                </div>

                                <div className="flex space-x-2">
                                  <Button
                                    onClick={() => updateTicketMutation.mutate({
                                      ticketId: selectedTicket.id,
                                      status: newStatus,
                                      response: adminResponse
                                    })}
                                    disabled={updateTicketMutation.isPending}
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                  >
                                    {updateTicketMutation.isPending ? "Guardando..." : "Actualizar Ticket"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {ticket.status !== 'resolved' && (
                          <Button
                            onClick={() => updateTicketMutation.mutate({
                              ticketId: ticket.id,
                              status: 'resolved'
                            })}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar Resuelto
                          </Button>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {tickets.length === 0 && (
              <p className="text-center text-medium-gray py-8">No hay tickets de soporte</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
