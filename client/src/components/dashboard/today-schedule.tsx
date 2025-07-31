import { ThemedCard, ThemedCardContent, ThemedCardHeader, ThemedCardTitle } from "@/components/ui/themed-card";
import { ThemedButton } from "@/components/ui/themed-button";
import { Badge } from "@/components/ui/badge";
import { Video, Edit, Clock, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface TodayScheduleProps {
  className?: string;
}

export function TodaySchedule({ className }: TodayScheduleProps) {
  const [, setLocation] = useLocation();
  const { data: appointments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/dashboard/today-appointments"],
  });

  if (isLoading) {
    return (
      <ThemedCard className={`rounded-xl ${className}`}>
        <ThemedCardHeader>
          <ThemedCardTitle>Today's Schedule</ThemedCardTitle>
        </ThemedCardHeader>
        <ThemedCardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div 
                  className="flex items-center space-x-4 p-4 rounded-lg transition-colors duration-300"
                  style={{ backgroundColor: `hsl(var(--muted) / 0.3)` }}
                >
                  <div 
                    className="w-12 h-12 rounded-full"
                    style={{ backgroundColor: `hsl(var(--muted))` }}
                  ></div>
                  <div className="flex-1 space-y-2">
                    <div 
                      className="h-4 rounded w-3/4"
                      style={{ backgroundColor: `hsl(var(--muted))` }}
                    ></div>
                    <div 
                      className="h-3 rounded w-1/2"
                      style={{ backgroundColor: `hsl(var(--muted))` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ThemedCardContent>
      </ThemedCard>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPatientInitials = (patient: any) => {
    const firstName = patient?.user?.firstName || "";
    const lastName = patient?.user?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <ThemedCard className={`rounded-xl ${className}`}>
      <ThemedCardHeader>
        <div className="flex items-center justify-between">
          <ThemedCardTitle>Today's Schedule</ThemedCardTitle>
          <ThemedButton variant="ghost" size="sm" onClick={() => setLocation("/calendar")}>
            View All
          </ThemedButton>
        </div>
      </ThemedCardHeader>
      <ThemedCardContent>
        {appointments && appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appointment: any) => (
              <div 
                key={appointment.id} 
                className="flex items-center space-x-4 p-4 rounded-lg transition-colors duration-300"
                style={{ backgroundColor: `hsl(var(--muted) / 0.3)` }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300"
                  style={{ 
                    backgroundColor: `hsl(var(--primary))`,
                    color: `hsl(var(--primary-foreground))`
                  }}
                >
                  <span className="font-medium text-sm">
                    {getPatientInitials(appointment.patient)}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 
                    className="font-medium transition-colors duration-300"
                    style={{ color: `hsl(var(--foreground))` }}
                  >
                    {appointment.patient?.user?.firstName} {appointment.patient?.user?.lastName}
                  </h4>
                  <p 
                    className="text-sm transition-colors duration-300"
                    style={{ color: `hsl(var(--muted-foreground))` }}
                  >
                    {appointment.title}
                  </p>
                  <p 
                    className="text-sm transition-colors duration-300"
                    style={{ color: `hsl(var(--muted-foreground))` }}
                  >
                    {appointment.description || "No notes"}
                  </p>
                </div>
                <div className="text-right">
                  <div 
                    className="flex items-center text-sm font-medium mb-1 transition-colors duration-300"
                    style={{ color: `hsl(var(--foreground))` }}
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {format(new Date(appointment.appointmentDate), "h:mm a")}
                  </div>
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <ThemedButton variant="ghost" size="sm">
                    <Video className="w-4 h-4" />
                  </ThemedButton>
                  <ThemedButton variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </ThemedButton>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar 
              className="w-12 h-12 mx-auto mb-4 transition-colors duration-300"
              style={{ color: `hsl(var(--muted-foreground))` }}
            />
            <p 
              className="transition-colors duration-300"
              style={{ color: `hsl(var(--muted-foreground))` }}
            >
              No appointments scheduled for today
            </p>
          </div>
        )}
      </ThemedCardContent>
    </ThemedCard>
  );
}
