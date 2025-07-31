import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const appointmentSchema = z.object({
  practitionerId: z.string().min(1, 'Please select a practitioner'),
  title: z.string().min(1, 'Please enter appointment reason'),
  description: z.string().optional(),
  appointmentDate: z.date({ required_error: 'Please select a date' }),
  appointmentTime: z.string().min(1, 'Please select a time'),
  type: z.enum(['consultation', 'follow_up', 'therapy', 'procedure', 'telehealth']),
  duration: z.number().min(15, 'Minimum 15 minutes').max(120, 'Maximum 2 hours')
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface BookAppointmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BookAppointmentForm({ onSuccess, onCancel }: BookAppointmentFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const { toast } = useToast();

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      type: 'consultation',
      duration: 30
    }
  });

  // Fetch available practitioners
  const { data: practitioners } = useQuery({
    queryKey: ['/api/practitioners'],
  });

  // Available time slots (this would ideally come from the backend)
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const bookAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const appointmentDateTime = new Date(data.appointmentDate);
      const [hours, minutes] = data.appointmentTime.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

      const response = await apiRequest('/api/patient/appointments', 'POST', {
        ...data,
        appointmentDate: appointmentDateTime.toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment Booked",
        description: "Your appointment request has been submitted successfully.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book appointment",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: AppointmentFormData) => {
    bookAppointmentMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Practitioner Selection */}
        <FormField
          control={form.control}
          name="practitionerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Healthcare Provider</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a practitioner" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {practitioners?.map((practitioner: any) => (
                    <SelectItem key={practitioner.id} value={practitioner.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Dr. {practitioner.user?.firstName} {practitioner.user?.lastName}
                        {practitioner.specialty && (
                          <span className="text-muted-foreground">- {practitioner.specialty}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Appointment Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Appointment Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="consultation">Initial Consultation</SelectItem>
                  <SelectItem value="follow_up">Follow-up Visit</SelectItem>
                  <SelectItem value="therapy">Therapy Session</SelectItem>
                  <SelectItem value="procedure">Medical Procedure</SelectItem>
                  <SelectItem value="telehealth">Video Consultation</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Reason for Visit */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Visit</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Annual checkup, Follow-up consultation..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Additional Details */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Details (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Please describe your symptoms or concerns..."
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date Selection */}
        <FormField
          control={form.control}
          name="appointmentDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Preferred Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
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
                    disabled={(date) =>
                      date < new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Time Selection */}
        <FormField
          control={form.control}
          name="appointmentTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Time</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {time}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Duration */}
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes)</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
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

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1"
            disabled={bookAppointmentMutation.isPending}
          >
            {bookAppointmentMutation.isPending ? 'Booking...' : 'Book Appointment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}