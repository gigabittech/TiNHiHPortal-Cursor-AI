import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, eachHourOfInterval, startOfDay, endOfDay, isSameDay, addHours, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { AppointmentClickHandler } from "@/components/calendar/appointment-click";
import type { CalendarView } from "@/pages/calendar";

interface CalendarGridProps {
  currentDate: Date;
  view: CalendarView;
  selectedTeamMembers: string[];
  onTimeSlotClick: (date: Date, time: string) => void;
  onEventClick: (event: any) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: "appointment" | "task" | "reminder" | "meeting" | "out-of-office";
  patientName?: string;
  practitionerName?: string;
  color: string;
}

export function CalendarGrid({ 
  currentDate, 
  view, 
  selectedTeamMembers, 
  onTimeSlotClick, 
  onEventClick 
}: CalendarGridProps) {
  // Fetch appointments and other events
  const { data: appointments } = useQuery({
    queryKey: ["/api/appointments"],
    queryFn: async () => {
      const response = await fetch("/api/appointments", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch appointments");
      return response.json();
    },
  });

  // Convert appointments to calendar events
  const events: CalendarEvent[] = (appointments || []).map((apt: any) => ({
    id: apt.id,
    title: `${apt.patient?.user?.firstName} ${apt.patient?.user?.lastName}`,
    start: new Date(apt.appointmentDate),
    end: addHours(new Date(apt.appointmentDate), 1), // Default 1 hour duration
    type: "appointment",
    patientName: `${apt.patient?.user?.firstName} ${apt.patient?.user?.lastName}`,
    practitionerName: `${apt.practitioner?.user?.firstName} ${apt.practitioner?.user?.lastName}`,
    color: "bg-blue-500",
  }));

  // Fetch calendar settings for dynamic slot generation - CRITICAL: this must refresh
  const { data: calendarSettings, refetch: refetchSettings } = useQuery({
    queryKey: ["/api/calendar-settings"],
    queryFn: async () => {
      const response = await fetch("/api/calendar-settings", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch calendar settings");
      return response.json();
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache (TanStack Query v5 syntax)
  });

  // Generate dynamic time slots based on LATEST settings
  const generateTimeSlots = () => {
    const settings = calendarSettings || {
      timeInterval: 60,
      defaultStartTime: "06:00",
      defaultEndTime: "22:00",
      bufferTime: 0
    };
    
    console.log("🔥 Calendar settings:", settings); // DEBUG: Check if settings are updating

    const [startHour, startMin] = settings.defaultStartTime.split(':').map(Number);
    const [endHour, endMin] = settings.defaultEndTime.split(':').map(Number);
    
    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const timeSlots = [];
    
    while (currentMinutes < endMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const min = currentMinutes % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const displayTime = format(new Date().setHours(hour, min), 'h:mm a');
      
      timeSlots.push({
        time: timeString,
        label: displayTime,
        isAvailable: true, // Can be enhanced with buffer time logic
      });
      
      currentMinutes += settings.timeInterval;
    }
    
    return timeSlots;
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const timeSlots = generateTimeSlots();

    return (
      <div className="flex flex-col h-full">
        {/* Header with days */}
        <div className="grid grid-cols-8 border-b bg-muted/30">
          <div className="p-3 text-sm font-medium text-muted-foreground border-r">
            GMT+0
          </div>
          {days.map((day) => (
            <div key={day.toISOString()} className="p-3 text-center border-r last:border-r-0">
              <div className="text-sm font-medium text-muted-foreground">
                {format(day, 'EEE d')}
              </div>
              <div className={`text-lg font-semibold mt-1 ${
                isSameDay(day, new Date()) ? 'text-primary' : 'text-foreground'
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="relative">
            {timeSlots.map((slot, slotIndex) => (
              <div key={slot.time} className="grid grid-cols-8 border-b border-border/50 min-h-[60px]">
                {/* Time label */}
                <div className="p-2 text-xs text-muted-foreground border-r bg-muted/20 flex items-start">
                  {slot.label}
                </div>
                
                {/* Day columns */}
                {days.map((day, dayIndex) => {
                  const dayEvents = events.filter(event => 
                    isSameDay(event.start, day) &&
                    event.start.getHours() === parseInt(slot.time.split(':')[0])
                  );

                  return (
                    <div 
                      key={`${day.toISOString()}-${slot.time}`}
                      className="border-r last:border-r-0 p-1 hover:bg-accent/50 cursor-pointer transition-colors relative"
                      onClick={() => onTimeSlotClick(day, slot.time)}
                    >
                      {dayEvents.map((event) => (
                        <AppointmentClickHandler key={event.id} appointmentId={event.id}>
                          <div
                            className="bg-primary text-primary-foreground p-1 rounded text-xs mb-1 cursor-pointer hover:opacity-80"
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            {event.patientName && (
                              <div className="opacity-80 truncate">{event.patientName}</div>
                            )}
                          </div>
                        </AppointmentClickHandler>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="flex flex-col h-full">
        {/* Header with day names */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center border-r last:border-r-0">
              <div className="text-sm font-medium text-muted-foreground">{day}</div>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 grid grid-cols-7">
          {days.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const dayEvents = events.filter(event => isSameDay(event.start, day));

            return (
              <div
                key={day.toISOString()}
                className={`border-r border-b last:border-r-0 p-2 min-h-[120px] cursor-pointer hover:bg-accent/50 ${
                  !isCurrentMonth ? 'bg-muted/20 text-muted-foreground' : ''
                }`}
                onClick={() => onTimeSlotClick(day, "09:00")}
              >
                <div className={`text-sm font-medium ${
                  isToday ? 'text-primary font-bold' : ''
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <AppointmentClickHandler key={event.id} appointmentId={event.id}>
                      <div className="bg-primary text-primary-foreground p-1 rounded text-xs cursor-pointer hover:opacity-80">
                        <div className="truncate">{event.title}</div>
                      </div>
                    </AppointmentClickHandler>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = events.filter(event => isSameDay(event.start, currentDate));
    
    // Generate time slots from 6 AM to 10 PM
    const startHour = 6;
    const endHour = 22;
    const timeSlots = [];
    
    for (let hour = startHour; hour <= endHour; hour++) {
      timeSlots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        label: format(new Date().setHours(hour, 0), 'h:mm a'),
      });
    }

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b bg-muted/30 p-4">
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground">
              {format(currentDate, 'EEEE')}
            </div>
            <div className={`text-2xl font-semibold mt-1 ${
              isSameDay(currentDate, new Date()) ? 'text-primary' : 'text-foreground'
            }`}>
              {format(currentDate, 'd')}
            </div>
          </div>
        </div>

        {/* Time slots */}
        <div className="flex-1 overflow-y-auto">
          <div className="relative">
            {timeSlots.map((slot: any) => {
              const slotEvents = dayEvents.filter(event => 
                event.start.getHours() === parseInt(slot.time.split(':')[0])
              );

              return (
                <div key={slot.time} className="flex border-b border-border/50 min-h-[80px]">
                  {/* Time label */}
                  <div className="w-20 p-3 text-xs text-muted-foreground border-r bg-muted/20 flex items-start">
                    {slot.label}
                  </div>
                  
                  {/* Event area */}
                  <div 
                    className="flex-1 p-2 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => onTimeSlotClick(currentDate, slot.time)}
                  >
                    {slotEvents.map((event) => (
                      <AppointmentClickHandler key={event.id} appointmentId={event.id}>
                        <div className="bg-primary text-primary-foreground p-2 rounded mb-2 cursor-pointer hover:opacity-80">
                          <div className="font-medium">{event.title}</div>
                          {event.patientName && (
                            <div className="text-sm opacity-80">{event.patientName}</div>
                          )}
                        </div>
                      </AppointmentClickHandler>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  switch (view) {
    case "week":
      return renderWeekView();
    case "month":
      return renderMonthView();
    case "day":
      return renderDayView();
    default:
      return renderWeekView();
  }
}