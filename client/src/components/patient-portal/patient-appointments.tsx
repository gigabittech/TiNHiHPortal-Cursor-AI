import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, Video, Phone, MapPin, User, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import BookAppointmentForm from './book-appointment-form';

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-red-100 text-red-800'
};

const typeIcons = {
  consultation: Calendar,
  follow_up: Clock,
  therapy: User,
  procedure: MapPin,
  emergency: Phone,
  telehealth: Video
};

export default function PatientAppointments() {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['/api/patient/appointments'],
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const response = await apiRequest(`/api/appointments/${appointmentId}`, 'PATCH', {
        status: 'cancelled'
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patient/appointments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel appointment",
        variant: "destructive",
      });
    }
  });

  const rescheduleAppointmentMutation = useMutation({
    mutationFn: async ({ appointmentId, newDate }: { appointmentId: string; newDate: string }) => {
      const response = await apiRequest(`/api/appointments/${appointmentId}`, 'PATCH', {
        appointmentDate: newDate
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment Rescheduled",
        description: "Your appointment has been rescheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patient/appointments'] });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const upcomingAppointments = appointments?.filter((apt: any) => 
    new Date(apt.appointmentDate) >= new Date() && apt.status !== 'cancelled'
  ) || [];
  
  const pastAppointments = appointments?.filter((apt: any) => 
    new Date(apt.appointmentDate) < new Date() || apt.status === 'completed'
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Appointments</h2>
          <p className="text-muted-foreground">Schedule and manage your healthcare appointments</p>
        </div>
        <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
              <DialogDescription>
                Schedule an appointment with your healthcare provider
              </DialogDescription>
            </DialogHeader>
            <BookAppointmentForm 
              onSuccess={() => {
                setShowBookingForm(false);
                queryClient.invalidateQueries({ queryKey: ['/api/patient/appointments'] });
              }}
              onCancel={() => setShowBookingForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Appointments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Upcoming Appointments</h3>
        {upcomingAppointments.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No upcoming appointments</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowBookingForm(true)}
              >
                Book Your First Appointment
              </Button>
            </CardContent>
          </Card>
        ) : (
          upcomingAppointments.map((appointment: any) => {
            const TypeIcon = typeIcons[appointment.type as keyof typeof typeIcons] || Calendar;
            return (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <TypeIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{appointment.title}</h4>
                          <Badge className={statusColors[appointment.status as keyof typeof statusColors]}>
                            {appointment.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(appointment.appointmentDate), 'EEEE, MMMM dd, yyyy')}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {format(new Date(appointment.appointmentDate), 'hh:mm a')} 
                            ({appointment.duration} minutes)
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Dr. {appointment.practitioner?.user?.firstName} {appointment.practitioner?.user?.lastName}
                          </div>
                          {appointment.description && (
                            <p className="mt-2">{appointment.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {appointment.type === 'telehealth' && (
                        <Button size="sm">
                          <Video className="w-4 h-4 mr-2" />
                          Join Video Call
                        </Button>
                      )}
                      {appointment.status === 'scheduled' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              // TODO: Implement reschedule functionality
                              toast({
                                title: "Reschedule",
                                description: "Reschedule functionality coming soon!",
                              });
                            }}
                          >
                            Reschedule
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => cancelAppointmentMutation.mutate(appointment.id)}
                            disabled={cancelAppointmentMutation.isPending}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Past Appointments</h3>
          {pastAppointments.slice(0, 5).map((appointment: any) => {
            const TypeIcon = typeIcons[appointment.type as keyof typeof typeIcons] || Calendar;
            return (
              <Card key={appointment.id} className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <TypeIcon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{appointment.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')} with 
                          Dr. {appointment.practitioner?.user?.firstName} {appointment.practitioner?.user?.lastName}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusColors[appointment.status as keyof typeof statusColors]}>
                      {appointment.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {pastAppointments.length > 5 && (
            <Button variant="outline" className="w-full">
              View All Past Appointments ({pastAppointments.length - 5} more)
            </Button>
          )}
        </div>
      )}
    </div>
  );
}