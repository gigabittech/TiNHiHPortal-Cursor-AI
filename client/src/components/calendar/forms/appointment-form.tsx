import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addMinutes, isBefore, addHours, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const appointmentFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  patientId: z.string().min(1, "Patient is required"),
  practitionerId: z.string().min(1, "Practitioner is required"),
  appointmentDate: z.date({ required_error: "Date is required" }),
  appointmentTime: z.string().min(1, "Time is required"),
  duration: z.number().min(15, "Duration must be at least 15 minutes"),
  type: z.string().min(1, "Type is required"),
  notes: z.string().optional(),
  status: z.enum(["scheduled", "confirmed", "cancelled", "completed"]).default("scheduled"),
});

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

interface AppointmentFormProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const APPOINTMENT_TYPES = [
  { value: "consultation", label: "Consultation" },
  { value: "follow-up", label: "Follow-up" },
  { value: "procedure", label: "Procedure" },
  { value: "check-up", label: "Check-up" },
  { value: "emergency", label: "Emergency" },
];

export function AppointmentForm({ selectedDate, selectedTime, onSubmit, onCancel }: AppointmentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      title: "",
      appointmentDate: selectedDate || new Date(),
      appointmentTime: selectedTime || "09:00",
      duration: 60,
      type: "consultation",
      status: "scheduled",
      notes: "",
      patientId: "",
      practitionerId: "",
    },
  });

  // Fetch patients
  const { data: patients, isLoading: patientsLoading, error: patientsError } = useQuery({
    queryKey: ["/api/patients"],
    queryFn: async () => {
      const response = await api.get("/api/patients");
      return response;
    },
  });

  // Fetch practitioners
  const { data: practitioners, isLoading: practitionersLoading, error: practitionersError } = useQuery({
    queryKey: ["/api/practitioners"],
    queryFn: async () => {
      const response = await api.get("/api/practitioners");
      return response;
    },
  });

  // Fetch calendar settings for dynamic time slot generation
  const { data: calendarSettings } = useQuery({
    queryKey: ["/api/calendar-settings", "practitioner-specific"],
    queryFn: async () => {
      const response = await api.get("/api/calendar-settings");
      console.log("Fetched calendar settings:", response);
      return response;
    },
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  // Fetch existing appointments for conflict checking
  const { data: existingAppointments } = useQuery({
    queryKey: ["/api/appointments"],
    queryFn: async () => {
      const response = await api.get("/api/appointments");
      return response;
    },
  });

  // Check for time slot conflicts including buffer time
  const hasTimeSlotConflict = (date: Date, time: string, practitionerId: string, bufferTime: number) => {
    if (!date || !practitionerId || !existingAppointments) return false;

    const [hours, minutes] = time.split(':').map(Number);
    const appointmentDateTime = new Date(date);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    const appointmentEndTime = addMinutes(appointmentDateTime, form.watch("duration") || 60);
    const bufferStartTime = addMinutes(appointmentDateTime, -bufferTime);
    const bufferEndTime = addMinutes(appointmentEndTime, bufferTime);

    return existingAppointments.some((apt: any) => {
      if (apt.practitionerId !== practitionerId) return false;
      
      const existingDateTime = new Date(apt.appointmentDate);
      const existingEndTime = addMinutes(existingDateTime, apt.duration || 60);
      
      // Check if appointments overlap (including buffer time)
      return (
        (appointmentDateTime < existingEndTime && appointmentEndTime > existingDateTime) ||
        (existingDateTime < bufferEndTime && existingEndTime > bufferStartTime)
      );
    });
  };

  // Validate that appointment is not in the past
  const isAppointmentInPast = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const appointmentDateTime = new Date(date);
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    
    return isBefore(appointmentDateTime, new Date());
  };

  // Validate that appointment is on a working day
  const isWorkingDay = (date: Date) => {
    const settings = calendarSettings || {
      workingDays: [1, 2, 3, 4, 5] // Monday to Friday
    };
    
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    return settings.workingDays?.includes(dayOfWeek) ?? true;
  };

  // Validate that appointment is within working hours
  const isWithinWorkingHours = (time: string) => {
    const settings = calendarSettings || {
      defaultStartTime: "09:00",
      defaultEndTime: "17:00"
    };
    
    const [hours, minutes] = time.split(':').map(Number);
    const appointmentMinutes = hours * 60 + minutes;
    
    const [startHour, startMin] = settings.defaultStartTime.split(':').map(Number);
    const [endHour, endMin] = settings.defaultEndTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return appointmentMinutes >= startMinutes && appointmentMinutes < endMinutes;
  };

  // Generate dynamic time slots based on calendar settings
  const availableTimeSlots = useMemo(() => {
    const settings = calendarSettings || {
      timeInterval: 60,
      defaultStartTime: "09:00",
      defaultEndTime: "17:00",
      bufferTime: 0
    };

    const [startHour, startMin] = settings.defaultStartTime.split(':').map(Number);
    const [endHour, endMin] = settings.defaultEndTime.split(':').map(Number);
    
    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const timeSlots = [];
    const selectedDate = form.watch("appointmentDate");
    const selectedPractitionerId = form.watch("practitionerId");
    
    while (currentMinutes < endMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const min = currentMinutes % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      
      // Check if this time slot is available (no conflicts with existing appointments)
      const isAvailable = !hasTimeSlotConflict(selectedDate, timeString, selectedPractitionerId, settings.bufferTime);
      
      timeSlots.push({
        time: timeString,
        label: format(new Date().setHours(hour, min), 'h:mm a'),
        isAvailable
      });
      
      currentMinutes += settings.timeInterval;
    }
    
    return timeSlots;
  }, [calendarSettings, form.watch("appointmentDate"), form.watch("practitionerId"), existingAppointments]);

  // Get form values for API calls
  const formSelectedDate = form.watch("appointmentDate");
  const selectedPractitionerId = form.watch("practitionerId");

  // Fetch available time slots from API
  const { data: availableSlots } = useQuery({
    queryKey: ["/api/appointments/available-slots", formSelectedDate?.toISOString(), selectedPractitionerId],
    queryFn: async () => {
      if (!formSelectedDate || !selectedPractitionerId) return [];
      
      const response = await api.get(`/api/appointments/available-slots?date=${formSelectedDate.toISOString()}&practitionerId=${selectedPractitionerId}`);
      return response;
    },
    enabled: !!formSelectedDate && !!selectedPractitionerId,
  });

  // Use available slots from API if available, otherwise fall back to client-side generation
  const timeSlots = availableSlots || availableTimeSlots;

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      console.log("Submitting appointment data:", data);
      
      // Final validation before submission
      if (isAppointmentInPast(data.appointmentDate, data.appointmentTime)) {
        throw new Error("Cannot create appointments in the past");
      }

      // Combine date and time
      const [hours, minutes] = data.appointmentTime.split(':');
      const appointmentDateTime = new Date(data.appointmentDate);
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      console.log("Combined appointment date/time:", appointmentDateTime);

      const response = await api.post("/appointments", {
        ...data,
        appointmentDate: appointmentDateTime.toISOString(),
      });
      
      console.log("Appointment creation response:", response);
      return response;
    },
    onSuccess: (data) => {
      console.log("Appointment created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Success",
        description: "Appointment created successfully",
      });
      onSubmit();
    },
    onError: (error: any) => {
      console.error("Appointment creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create appointment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AppointmentFormData) => {
    // Validate appointment is not in the past
    if (isAppointmentInPast(data.appointmentDate, data.appointmentTime)) {
      toast({
        title: "Invalid Time",
        description: "Cannot create appointments in the past",
        variant: "destructive",
      });
      return;
    }

    // Validate appointment is on a working day
    if (!isWorkingDay(data.appointmentDate)) {
      toast({
        title: "Invalid Day",
        description: "Cannot create appointments on non-working days",
        variant: "destructive",
      });
      return;
    }

    // Validate appointment is within working hours
    if (!isWithinWorkingHours(data.appointmentTime)) {
      toast({
        title: "Invalid Time",
        description: "Cannot create appointments outside working hours",
        variant: "destructive",
      });
      return;
    }

    // Check for appointment conflicts with buffer time
    const settings = calendarSettings || { bufferTime: 0 };
    if (hasTimeSlotConflict(data.appointmentDate, data.appointmentTime, data.practitionerId, settings.bufferTime)) {
      toast({
        title: "Scheduling Conflict",
        description: "There is already an appointment scheduled at this time for this practitioner.",
        variant: "destructive",
      });
      return;
    }

    createAppointmentMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">New Appointment</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Title Field */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Appointment title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Patient Selection */}
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger disabled={patientsLoading}>
                      <SelectValue placeholder={patientsLoading ? "Loading patients..." : "Select a patient"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patientsLoading ? (
                      <div className="px-2 py-1.5 text-sm text-slate-500">Loading patients...</div>
                    ) : patientsError ? (
                      <div className="px-2 py-1.5 text-sm text-red-500">Error loading patients</div>
                    ) : patients?.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-slate-500">No patients found</div>
                    ) : (
                      patients?.map((patient: any) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.user?.firstName && patient.user?.lastName 
                            ? `${patient.user.firstName} ${patient.user.lastName}`
                            : patient.user?.email 
                            ? patient.user.email
                            : `Patient ${patient.id.slice(0, 8)}...`
                          }
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Practitioner Selection */}
          <FormField
            control={form.control}
            name="practitionerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Practitioner</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger disabled={practitionersLoading}>
                      <SelectValue placeholder={practitionersLoading ? "Loading practitioners..." : "Select a practitioner"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {practitionersLoading ? (
                      <div className="px-2 py-1.5 text-sm text-slate-500">Loading practitioners...</div>
                    ) : practitionersError ? (
                      <div className="px-2 py-1.5 text-sm text-red-500">Error loading practitioners</div>
                    ) : practitioners?.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-slate-500">No practitioners found</div>
                    ) : (
                      practitioners?.map((practitioner: any) => (
                        <SelectItem key={practitioner.id} value={practitioner.id}>
                          {practitioner.user?.firstName && practitioner.user?.lastName 
                            ? `Dr. ${practitioner.user.firstName} ${practitioner.user.lastName}`
                            : practitioner.user?.email 
                            ? `Dr. ${practitioner.user.email}`
                            : `Practitioner ${practitioner.id.slice(0, 8)}...`
                          }
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="appointmentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today || date < new Date("1900-01-01");
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="appointmentTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60">
                      {timeSlots.map((slot: { time: string; label: string; isAvailable?: boolean }) => (
                        <SelectItem 
                          key={slot.time} 
                          value={slot.time}
                          disabled={!slot.isAvailable}
                          className={!slot.isAvailable ? "text-muted-foreground" : ""}
                        >
                          {slot.label} {!slot.isAvailable && "(Unavailable)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Duration and Type */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {APPOINTMENT_TYPES.map((type) => (
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

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Additional notes..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createAppointmentMutation.isPending}
            >
              {createAppointmentMutation.isPending ? "Creating..." : "Create Appointment"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}