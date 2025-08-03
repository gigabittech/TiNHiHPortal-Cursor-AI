import { useQuery } from "@tanstack/react-query";
import { format, addHours, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, startOfMonth, endOfMonth, isSameMonth, addMinutes, isBefore, isAfter } from "date-fns";
import { api } from "@/lib/api";
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
  duration?: number;
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
      const response = await api.get("/api/appointments");
      console.log("Fetched appointments:", response);
      return response;
    },
  });

  // Convert appointments to calendar events
  const events: CalendarEvent[] = (appointments || []).map((apt: any) => {
    const event = {
      id: apt.id,
      title: apt.title || `${apt.patient?.user?.firstName || 'Unknown'} ${apt.patient?.user?.lastName || 'Patient'}`,
      start: new Date(apt.appointmentDate),
      end: addMinutes(new Date(apt.appointmentDate), apt.duration || 60),
      duration: apt.duration || 60,
      type: "appointment",
      patientName: `${apt.patient?.user?.firstName || 'Unknown'} ${apt.patient?.user?.lastName || 'Patient'}`,
      practitionerName: `${apt.practitioner?.user?.firstName || 'Dr.'} ${apt.practitioner?.user?.lastName || 'Unknown'}`,
      color: "bg-blue-500",
    };
    console.log("Calendar event created:", event);
    console.log("Event start time:", event.start.toISOString());
    console.log("Event start hour:", event.start.getHours());
    console.log("Event start minute:", event.start.getMinutes());
    return event;
  });

  // Fetch calendar settings for dynamic slot generation
  const { data: calendarSettings, isLoading: settingsLoading, error: settingsError } = useQuery({
    queryKey: ["/api/calendar-settings", "practitioner-specific"],
    queryFn: async () => {
      const response = await api.get("/api/calendar-settings");
      console.log("Fetched calendar settings:", response);
      return response;
    },
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  console.log("Calendar settings state:", { calendarSettings, settingsLoading, settingsError });

  // Generate dynamic time slots based on calendar settings
  const generateTimeSlots = (targetDate?: Date) => {
    const dateToUse = targetDate || currentDate;
    const settings = calendarSettings || {
      timeInterval: 60,
      defaultStartTime: "09:00",
      defaultEndTime: "17:00",
      bufferTime: 0,
      workingDays: [1, 2, 3, 4, 5] // Monday to Friday
    };
    
    console.log("Calendar settings being used:", settings);
    console.log("Target date:", dateToUse.toISOString());
    console.log("Target day of week:", dateToUse.getDay());
    
    // Check if target date is a working day
    const targetDayOfWeek = dateToUse.getDay(); // 0 = Sunday, 1 = Monday, etc.
    // Convert workingDays from strings to numbers for comparison
    const workingDaysNumbers = settings.workingDays?.map((day: string | number): number => {
      if (typeof day === 'string') {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return dayNames.indexOf(day.toLowerCase());
      }
      return day as number;
    }).filter((day: number): boolean => day !== -1) || [1, 2, 3, 4, 5];
    const isWorkingDay = workingDaysNumbers.includes(targetDayOfWeek);
    
    console.log("Working days (numbers):", workingDaysNumbers);
    console.log("Is working day:", isWorkingDay);
    
    if (!isWorkingDay) {
      console.log("Not a working day, but showing slots as unavailable");
      // Show time slots but mark them as unavailable
    }
    
    const [startHour, startMin] = settings.defaultStartTime.split(':').map(Number);
    const [endHour, endMin] = settings.defaultEndTime.split(':').map(Number);
    
    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const timeSlots = [];
    
    console.log(`Generating time slots: ${settings.defaultStartTime} to ${settings.defaultEndTime} (${startHour}:${startMin} to ${endHour}:${endMin})`);
    console.log(`Time interval: ${settings.timeInterval} minutes`);
    console.log(`Working days: ${settings.workingDays}`);
    
    while (currentMinutes < endMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const min = currentMinutes % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const displayTime = format(new Date().setHours(hour, min), 'h:mm a');
      
      // Check if this time slot is available (not blocked by buffer time)
      const slotDateTime = new Date(dateToUse);
      slotDateTime.setHours(hour, min, 0, 0);
      
      // Check if there are any appointments that would block this slot due to buffer time
      const conflictingAppointments = events.filter(event => {
        if (!isSameDay(event.start, dateToUse)) return false;
        
        const eventStart = event.start;
        const eventEnd = addMinutes(eventStart, event.duration || 60);
        const bufferStart = addMinutes(slotDateTime, -settings.bufferTime);
        const bufferEnd = addMinutes(slotDateTime, settings.timeInterval + settings.bufferTime);
        
        // Check if appointments overlap with buffer time
        return (
          (eventStart < bufferEnd && eventEnd > bufferStart) ||
          (slotDateTime < eventEnd && addMinutes(slotDateTime, settings.timeInterval) > eventStart)
        );
      });
      
      if (conflictingAppointments.length > 0) {
        console.log(`Time slot ${timeString}: ${conflictingAppointments.length} conflicting appointments`);
      }
      
      timeSlots.push({
        time: timeString,
        label: displayTime,
        isAvailable: isWorkingDay && conflictingAppointments.length === 0,
        conflictingAppointments: conflictingAppointments.length > 0 ? conflictingAppointments : undefined
      });
      
      console.log(`Created time slot: ${timeString} (${displayTime})`);
      
      currentMinutes += settings.timeInterval;
    }
    
    console.log(`Total time slots generated: ${timeSlots.length}`);
    console.log(`Time slots:`, timeSlots.map(slot => `${slot.time} (${slot.label}) - Available: ${slot.isAvailable}`));
    
    return timeSlots;
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    // Generate time slots based on the first working day of the week
    const firstWorkingDay = days.find(day => {
      const settings = calendarSettings || {
        workingDays: [1, 2, 3, 4, 5]
      };
      const workingDaysNumbers = settings.workingDays?.map((day: string | number): number => {
        if (typeof day === 'string') {
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          return dayNames.indexOf(day.toLowerCase());
        }
        return day as number;
      }).filter((day: number): boolean => day !== -1) || [1, 2, 3, 4, 5];
      return workingDaysNumbers.includes(day.getDay());
    }) || currentDate;
    
    const timeSlots = generateTimeSlots(firstWorkingDay);

    return (
      <div className="flex-1 grid grid-cols-8 gap-px bg-muted">
        {/* Time column header */}
        <div className="p-2 text-center text-sm font-medium bg-background border-r">
          Time
        </div>

        {/* Day headers */}
        {days.map((day) => (
          <div key={day.toISOString()} className="p-2 text-center text-sm font-medium bg-background">
            <div className="text-xs text-muted-foreground">
              {format(day, 'EEE')}
            </div>
            <div className={`text-lg font-semibold ${
              isToday(day) ? 'text-primary' : 'text-foreground'
            }`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}

        {/* Time slots */}
        {timeSlots.map((slot) => (
          <div key={slot.time} className="contents">
            {/* Time label */}
            <div className="p-2 text-xs text-muted-foreground bg-background border-r border-t">
              {slot.label}
            </div>

            {/* Day columns */}
            {days.map((day) => {
              const dayEvents = events.filter(event => {
                const isSameDayResult = isSameDay(event.start, day);
                
                if (!isSameDayResult) return false;
                
                const eventHour = event.start.getHours();
                const eventMinute = event.start.getMinutes();
                const slotHour = parseInt(slot.time.split(':')[0]);
                const slotMinute = parseInt(slot.time.split(':')[1]);
                
                // Check if event starts within this time slot (within the hour)
                const matches = eventHour === slotHour && eventMinute >= slotMinute && eventMinute < slotMinute + 60;
                if (matches) {
                  console.log(`Week view - FOUND MATCH: Slot ${slot.time}: Event ${event.title} at ${eventHour}:${eventMinute} on ${day.toDateString()}`);
                }
                return matches;
              });
              
              // Check if this day and time slot is available based on calendar settings
              const settings = calendarSettings || {
                workingDays: [1, 2, 3, 4, 5],
                defaultStartTime: "09:00",
                defaultEndTime: "17:00"
              };
              
              const workingDaysNumbers = settings.workingDays?.map((day: string | number): number => {
                if (typeof day === 'string') {
                  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                  return dayNames.indexOf(day.toLowerCase());
                }
                return day as number;
              }).filter((day: number): boolean => day !== -1) || [1, 2, 3, 4, 5];
              const isWorkingDay = workingDaysNumbers.includes(day.getDay());
              const [startHour] = settings.defaultStartTime.split(':').map(Number);
              const [endHour] = settings.defaultEndTime.split(':').map(Number);
              const slotHour = parseInt(slot.time.split(':')[0]);
              const isWithinWorkingHours = slotHour >= startHour && slotHour < endHour;
              const isAvailable = isWorkingDay && isWithinWorkingHours;

              return (
                <div
                  key={`${day.toISOString()}-${slot.time}`}
                  className={`p-1 border-r border-t min-h-[60px] ${
                    isAvailable 
                      ? 'bg-background hover:bg-accent/50 cursor-pointer' 
                      : 'bg-muted/30 cursor-not-allowed opacity-60'
                  }`}
                  onClick={() => isAvailable && onTimeSlotClick(day, slot.time)}
                >
                  {dayEvents.map((event) => (
                    <AppointmentClickHandler key={event.id} appointmentId={event.id}>
                      <div className="bg-primary text-primary-foreground p-1 rounded text-xs cursor-pointer hover:opacity-80 mb-1">
                        <div className="truncate font-medium">{event.title}</div>
                        {event.patientName && (
                          <div className="text-xs opacity-80">{event.patientName}</div>
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
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="flex-1 grid grid-cols-7 gap-px bg-muted">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium bg-background">
            {day}
          </div>
        ))}

        {/* Calendar days */}
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
                      {event.patientName && (
                        <div className="text-xs opacity-80">{event.patientName}</div>
                      )}
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
    );
  };

  const renderDayView = () => {
    console.log("Current date for calendar:", currentDate);
    console.log("All events:", events);
    const dayEvents = events.filter(event => {
      const isSame = isSameDay(event.start, currentDate);
      console.log(`Event ${event.title} on ${event.start.toISOString()} - isSameDay with ${currentDate.toISOString()}: ${isSame}`);
      return isSame;
    });
    console.log("Day events for current date:", dayEvents);
    const timeSlots = generateTimeSlots(currentDate);
    
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
            {timeSlots.map((slot) => {
              const slotEvents = dayEvents.filter(event => {
                const eventHour = event.start.getHours();
                const eventMinute = event.start.getMinutes();
                const slotHour = parseInt(slot.time.split(':')[0]);
                const slotMinute = parseInt(slot.time.split(':')[1]);
                
                // Check if event starts within this time slot
                const matches = eventHour === slotHour && eventMinute >= slotMinute && eventMinute < slotMinute + 60;
                console.log(`Slot ${slot.time}: Event ${event.title} at ${eventHour}:${eventMinute} - matches: ${matches}`);
                return matches;
              });

              return (
                <div key={slot.time} className="flex border-b border-border/50 min-h-[80px]">
                  {/* Time label */}
                  <div className="w-20 p-3 text-xs text-muted-foreground border-r bg-muted/20 flex items-start">
                    {slot.label}
                  </div>
                  
                  {/* Event area */}
                  <div 
                    className={`flex-1 p-2 transition-colors ${
                      slot.isAvailable 
                        ? 'hover:bg-accent/50 cursor-pointer' 
                        : 'bg-muted/30 cursor-not-allowed opacity-60'
                    }`}
                    onClick={() => slot.isAvailable && onTimeSlotClick(currentDate, slot.time)}
                  >
                    {slotEvents.map((event) => (
                      <AppointmentClickHandler key={event.id} appointmentId={event.id}>
                        <div className="bg-primary text-primary-foreground p-2 rounded mb-2 cursor-pointer hover:opacity-80">
                          <div className="font-medium">{event.title}</div>
                          {event.patientName && (
                            <div className="text-sm opacity-80">{event.patientName}</div>
                          )}
                          {event.practitionerName && (
                            <div className="text-xs opacity-60">with {event.practitionerName}</div>
                          )}
                        </div>
                      </AppointmentClickHandler>
                    ))}
                    
                    {/* Show unavailable message if slot is blocked */}
                    {!slot.isAvailable && slotEvents.length === 0 && (
                      <div className="text-xs text-muted-foreground italic">
                        {slot.conflictingAppointments ? 'Blocked by existing appointment' : 'Unavailable'}
                      </div>
                    )}
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