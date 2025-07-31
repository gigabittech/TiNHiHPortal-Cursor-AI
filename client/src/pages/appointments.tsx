import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, Clock, User, Search, Plus } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AppointmentDetail } from "@/components/appointments/appointment-detail";
import { useLocation } from "wouter";

interface Appointment {
  id: string;
  title: string;
  appointmentDate: string;
  duration: number;
  type: string;
  status: string;
  notes?: string;
  patient: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  practitioner: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function Appointments() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const filteredAppointments = appointments.filter((appointment: Appointment) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      appointment.title.toLowerCase().includes(searchLower) ||
      appointment.patient.user.firstName.toLowerCase().includes(searchLower) ||
      appointment.patient.user.lastName.toLowerCase().includes(searchLower) ||
      appointment.practitioner.user.firstName.toLowerCase().includes(searchLower) ||
      appointment.practitioner.user.lastName.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCreateNew = () => {
    setLocation("/calendar");
  };

  const handleAppointmentClick = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
  };

  const handleCloseDetail = () => {
    setSelectedAppointmentId(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Appointments" subtitle="View and manage appointments" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Appointments" 
        subtitle="View and manage appointments"
        onQuickAction={handleCreateNew}
        quickActionLabel="Create New"
      />
      
      <div className="flex-1 overflow-auto p-6">
        {/* Search and Filters */}
        <div className="mb-6 flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Button onClick={handleCreateNew} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Appointment</span>
          </Button>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "No appointments found" : "No appointments scheduled"}
              </h3>
              <p className="text-gray-500 text-center mb-4">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "Start scheduling appointments with your patients"
                }
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateNew} className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Schedule First Appointment</span>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment: Appointment) => (
              <Card 
                key={appointment.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleAppointmentClick(appointment.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{appointment.title}</CardTitle>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {format(new Date(appointment.appointmentDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {format(new Date(appointment.appointmentDate), "h:mm a")} 
                        ({appointment.duration}min)
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {appointment.patient.user.firstName} {appointment.patient.user.lastName}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Dr. {appointment.practitioner.user.firstName} {appointment.practitioner.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {appointment.type}
                      </div>
                    </div>
                    
                    {appointment.notes && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">{appointment.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Appointment Detail Sheet */}
        <Sheet open={!!selectedAppointmentId} onOpenChange={() => setSelectedAppointmentId(null)}>
          <SheetContent className="w-[600px] sm:max-w-[600px]">
            {selectedAppointmentId && (
              <AppointmentDetail
                appointmentId={selectedAppointmentId}
                onClose={handleCloseDetail}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}