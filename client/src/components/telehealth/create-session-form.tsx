import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Video, Users, Monitor, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AppointmentWithDetails, InsertTelehealthSession } from "@shared/schema";

const createSessionSchema = z.object({
  appointmentId: z.string().min(1, "Please select an appointment"),
  patientId: z.string().min(1, "Patient ID is required"),
  practitionerId: z.string().min(1, "Practitioner ID is required"),
  platform: z.enum(["zoom", "teams", "google_meet"], {
    required_error: "Please select a platform",
  }),
  sessionNotes: z.string().optional(),
});

type CreateSessionFormData = z.infer<typeof createSessionSchema>;

interface CreateTelehealthSessionFormProps {
  appointments: AppointmentWithDetails[];
  onSubmit: (data: InsertTelehealthSession) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CreateTelehealthSessionForm({
  appointments,
  onSubmit,
  onCancel,
  isLoading = false,
}: CreateTelehealthSessionFormProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);

  const form = useForm<CreateSessionFormData>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      sessionNotes: "",
    },
  });

  const handleAppointmentSelect = (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
      setSelectedAppointment(appointment);
      form.setValue("appointmentId", appointmentId);
      form.setValue("patientId", appointment.patientId);
      form.setValue("practitionerId", appointment.practitionerId);
    }
  };

  const handleSubmit = (data: CreateSessionFormData) => {
    onSubmit({
      ...data,
      status: "scheduled" as const,
    });
  };

  const getPlatformInfo = (platform: string) => {
    switch (platform) {
      case "zoom":
        return {
          name: "Zoom",
          icon: <Video className="w-5 h-5" />,
          description: "High-quality video conferencing with screen sharing",
          features: ["HD Video", "Screen Share", "Recording", "Waiting Room"],
        };
      case "teams":
        return {
          name: "Microsoft Teams",
          icon: <Users className="w-5 h-5" />,
          description: "Enterprise-grade meetings with collaboration tools",
          features: ["Video & Audio", "Chat", "File Sharing", "Transcription"],
        };
      case "google_meet":
        return {
          name: "Google Meet",
          icon: <Monitor className="w-5 h-5" />,
          description: "Simple and secure video meetings",
          features: ["Easy Join", "Mobile Support", "Live Captions", "Recording"],
        };
      default:
        return null;
    }
  };

  // Filter appointments that are today or future and not yet completed
  const availableAppointments = appointments.filter(apt => {
    const appointmentDate = new Date(apt.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointmentDate >= today && apt.status !== "completed" && apt.status !== "cancelled";
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-6">
        {/* Appointment Selection */}
        <FormField
          control={form.control}
          name="appointmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Appointment</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  handleAppointmentSelect(value);
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an appointment for telehealth" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableAppointments.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No upcoming appointments available</p>
                    </div>
                  ) : (
                    availableAppointments.map((appointment) => (
                      <SelectItem key={appointment.id} value={appointment.id}>
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium">
                              {appointment.patient.user.firstName} {appointment.patient.user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(appointment.appointmentDate).toLocaleDateString()} at{" "}
                              {new Date(appointment.appointmentDate).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Selected Appointment Details */}
        {selectedAppointment && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appointment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Patient:</span>
                  <span className="text-sm">
                    {selectedAppointment.patient.user.firstName} {selectedAppointment.patient.user.lastName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Practitioner:</span>
                  <span className="text-sm">
                    Dr. {selectedAppointment.practitioner.user.firstName} {selectedAppointment.practitioner.user.lastName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Date & Time:</span>
                  <span className="text-sm">
                    {new Date(selectedAppointment.appointmentDate).toLocaleDateString()} at{" "}
                    {new Date(selectedAppointment.appointmentDate).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Duration:</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedAppointment.duration} minutes</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Type:</span>
                  <Badge variant="outline" className="capitalize">
                    {selectedAppointment.type}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform Selection */}
        <FormField
          control={form.control}
          name="platform"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Video Platform</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a video platform" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {["zoom", "teams", "google_meet"].map((platform) => {
                    const platformInfo = getPlatformInfo(platform);
                    return (
                      <SelectItem key={platform} value={platform}>
                        <div className="flex items-center space-x-3">
                          {platformInfo?.icon}
                          <div>
                            <p className="font-medium">{platformInfo?.name}</p>
                            <p className="text-xs text-gray-500">{platformInfo?.description}</p>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Platform Features Preview */}
        {form.watch("platform") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                {getPlatformInfo(form.watch("platform"))?.icon}
                <span>{getPlatformInfo(form.watch("platform"))?.name} Features</span>
              </CardTitle>
              <CardDescription>
                {getPlatformInfo(form.watch("platform"))?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {getPlatformInfo(form.watch("platform"))?.features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Session Notes */}
        <FormField
          control={form.control}
          name="sessionNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Session Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Add any preparation notes or special instructions for this telehealth session..."
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Schedule Session"}
          </Button>
        </div>
      </form>
    </Form>
  );
}