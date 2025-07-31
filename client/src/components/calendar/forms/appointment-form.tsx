import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addMinutes } from "date-fns";
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
import { apiRequest } from "@/lib/queryClient";

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

const TIME_SLOTS = [
  "06:00", "06:15", "06:30", "06:45",
  "07:00", "07:15", "07:30", "07:45",
  "08:00", "08:15", "08:30", "08:45",
  "09:00", "09:15", "09:30", "09:45",
  "10:00", "10:15", "10:30", "10:45",
  "11:00", "11:15", "11:30", "11:45",
  "12:00", "12:15", "12:30", "12:45",
  "13:00", "13:15", "13:30", "13:45",
  "14:00", "14:15", "14:30", "14:45",
  "15:00", "15:15", "15:30", "15:45",
  "16:00", "16:15", "16:30", "16:45",
  "17:00", "17:15", "17:30", "17:45",
  "18:00", "18:15", "18:30", "18:45",
  "19:00", "19:15", "19:30", "19:45",
  "20:00", "20:15", "20:30", "20:45",
  "21:00", "21:15", "21:30", "21:45",
];

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
  const { data: patients } = useQuery({
    queryKey: ["/api/patients"],
    queryFn: async () => {
      const response = await fetch("/api/patients", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch patients");
      return response.json();
    },
  });

  // Fetch practitioners
  const { data: practitioners } = useQuery({
    queryKey: ["/api/practitioners"],
    queryFn: async () => {
      const response = await fetch("/api/practitioners", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch practitioners");
      return response.json();
    },
  });

  // Fetch existing appointments for conflict checking
  const { data: existingAppointments } = useQuery({
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

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      // Combine date and time
      const [hours, minutes] = data.appointmentTime.split(':');
      const appointmentDateTime = new Date(data.appointmentDate);
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const response = await apiRequest("POST", "/api/appointments", {
        ...data,
        appointmentDate: appointmentDateTime.toISOString(),
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Success",
        description: "Appointment created successfully",
      });
      onSubmit();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create appointment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: AppointmentFormData) => {
    // Check for appointment conflicts
    const [hours, minutes] = data.appointmentTime.split(':');
    const appointmentDateTime = new Date(data.appointmentDate);
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Check if there's already an appointment at the same time with the same practitioner
    const hasConflict = existingAppointments?.some((apt: any) => {
      const existingDateTime = new Date(apt.appointmentDate);
      return (
        apt.practitionerId === data.practitionerId &&
        existingDateTime.getTime() === appointmentDateTime.getTime()
      );
    });

    if (hasConflict) {
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
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patients?.map((patient: any) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.user?.firstName} {patient.user?.lastName}
                      </SelectItem>
                    ))}
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
                    <SelectTrigger>
                      <SelectValue placeholder="Select a practitioner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {practitioners?.map((practitioner: any) => (
                      <SelectItem key={practitioner.id} value={practitioner.id}>
                        {practitioner.user?.firstName} {practitioner.user?.lastName}
                      </SelectItem>
                    ))}
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
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
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