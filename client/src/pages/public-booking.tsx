import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { CalendarIcon, Clock, User, Mail, Phone, MapPin, Star, CheckCircle, AlertCircle, Loader2, ChevronRight, ChevronLeft, Calendar as CalendarIcon2, Clock4, CreditCard, Shield, Check, Clock3, ArrowRight, ArrowLeft, CalendarDays, Users, MessageSquare, Zap, Award, Clock1, UserPlus, UserCheck, Video, MapPinIcon } from 'lucide-react';
import { format, addDays, isBefore, isAfter, startOfDay, parseISO, isToday, isTomorrow, addMinutes, differenceInMinutes } from 'date-fns';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

const bookingSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  appointmentDate: z.date({ required_error: 'Please select a date' }),
  appointmentTime: z.string().min(1, 'Please select a time'),
  reason: z.string().min(1, 'Please describe your reason for visit'),
  additionalNotes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface PublicBookingProps {
  bookingLink: string;
}

export default function PublicBooking({ bookingLink }: PublicBookingProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isReturningClient, setIsReturningClient] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Validate booking link format
  useEffect(() => {
    if (!bookingLink || bookingLink.length < 3) {
      toast({
        title: "Invalid Booking Link",
        description: "The booking link appears to be invalid.",
        variant: "destructive",
      });
    }
  }, [bookingLink, toast]);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {},
    mode: 'onChange'
  });

  // Fetch practitioner details by booking link
  const { data: practitioner, isLoading: practitionerLoading, error: practitionerError } = useQuery({
    queryKey: ['/api/public/practitioner', bookingLink],
    queryFn: async () => {
      try {
        const response = await api.get(`/api/public/practitioner/${bookingLink}`);
        return response;
      } catch (error: any) {
        console.error('Error fetching practitioner:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch practitioner details');
      }
    },
    enabled: !!bookingLink,
    retry: 1,
  });

  // Fetch booking settings for the practitioner
  const { data: bookingSettings, isLoading: settingsLoading, error: settingsError } = useQuery({
    queryKey: ['/api/public/booking-settings', bookingLink],
    queryFn: async () => {
      try {
        const response = await api.get(`/api/public/booking-settings/${bookingLink}`);
        return response;
      } catch (error: any) {
        console.error('Error fetching booking settings:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch booking settings');
      }
    },
    enabled: !!bookingLink && !!practitioner,
    retry: 1,
  });

  // Fetch calendar settings for time interval
  const { data: calendarSettings } = useQuery({
    queryKey: ['/api/public/calendar-settings', bookingLink],
    queryFn: async () => {
      try {
        const response = await api.get(`/api/public/calendar-settings/${bookingLink}`);
        return response;
      } catch (error: any) {
        console.error('Error fetching calendar settings:', error);
        return null;
      }
    },
    enabled: !!bookingLink && !!practitioner,
    retry: 1,
  });

  // Fetch available time slots for the practitioner
  const { data: availableSlots, isLoading: slotsLoading, error: slotsError } = useQuery({
    queryKey: ['/api/public/available-slots', bookingLink, selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      try {
        const response = await api.get(`/api/public/available-slots/${bookingLink}?date=${selectedDate.toISOString().split('T')[0]}`);
        return response;
      } catch (error: any) {
        console.error('Error fetching available slots:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch available time slots');
      }
    },
    enabled: !!bookingLink && !!selectedDate && !!practitioner,
    retry: 1,
  });

  const bookAppointmentMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      console.log('Starting appointment booking with data:', data);
      
      if (!practitioner?.id) {
        console.error('Practitioner ID not available:', practitioner);
        throw new Error('Practitioner information not available');
      }

      if (!bookingSettings) {
        console.error('Booking settings not available');
        throw new Error('Booking settings not available');
      }

      console.log('Practitioner ID:', practitioner.id);
      console.log('Booking settings:', bookingSettings);

      const bookingData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        appointmentDate: data.appointmentDate.toISOString().split('T')[0],
        appointmentTime: data.appointmentTime,
        reason: data.reason,
        additionalNotes: data.additionalNotes,
        practitionerId: practitioner.id,
        bookingLink: bookingLink,
        type: 'consultation',
        duration: bookingSettings?.bufferTime || 30,
      };

      console.log('Sending booking data:', bookingData);

      try {
        const response = await api.post('/api/public/book-appointment', bookingData);
        console.log('Booking response:', response);
        return response;
      } catch (error: any) {
        console.error('Error booking appointment:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          response: error.response
        });
        throw new Error(error.message || 'Failed to book appointment');
      }
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast({
        title: "Booking Confirmed!",
        description: "Your appointment has been successfully booked. Check your email for confirmation details.",
      });
    },
    onError: (error: any) => {
      console.error('Booking mutation error:', error);
      
      // Handle specific conflict error
      if (error.message?.includes('conflict') || error.message?.includes('overlap') || error.message?.includes('no longer available')) {
        toast({
          title: "Time Slot Unavailable",
          description: "This time slot is no longer available. Please select a different time.",
          variant: "destructive",
        });
        // Reset to step 2 (date/time selection) to allow user to choose a different time
        setCurrentStep(2);
        // Refresh available slots to get updated availability
        if (selectedDate) {
          // Trigger a refetch of available slots
          const queryClient = useQueryClient();
          queryClient.invalidateQueries({
            queryKey: ['/api/public/available-slots', bookingLink, selectedDate]
          });
        }
      } else {
        toast({
          title: "Booking Failed",
          description: error.message || "Failed to book appointment. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  const onSubmit = (data: BookingFormData) => {
    bookAppointmentMutation.mutate(data);
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Show error states
  if (practitionerError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl">Practitioner Not Found</CardTitle>
            <CardDescription>
              {practitionerError.message || "The booking link you're looking for doesn't exist or is invalid."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl">Booking Settings Error</CardTitle>
            <CardDescription>
              {settingsError.message || "Unable to load booking settings. Please try again later."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Check if public booking is enabled
  if (bookingSettings && !bookingSettings.isPublicBookingEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl">Booking Unavailable</CardTitle>
            <CardDescription>
              Public booking is currently disabled for this practitioner.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Loading state
  if (practitionerLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading booking page...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!practitioner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl">Practitioner Not Found</CardTitle>
            <CardDescription>
              The booking link you're looking for doesn't exist or is invalid.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-left mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Booking Confirmation
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Section - Confirmation */}
              <div className="space-y-6">
                {/* Success Icon and Message */}
                <div className="text-center sm:text-left">
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full mb-4 animate-pulse">
                    <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Booking confirmed! See you soon, {form.watch('firstName')}
                  </h2>
                  <p className="text-gray-600 text-lg mb-6">
                    Thanks for booking with us
                  </p>
                  
                  {/* Email Confirmation Box */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
                    <p className="text-green-800 text-sm sm:text-base">
                      We have sent an online booking confirmation email to{' '}
                      <a 
                        href={`mailto:${form.watch('email')}`}
                        className="text-green-900 font-medium underline hover:text-green-700"
                      >
                        {form.watch('email')}
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Section - Summary Card */}
              <div>
                <Card className="shadow-lg border-0 transform transition-all duration-300 hover:scale-105">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Appointment Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        Final appointment (45 minutes)
                      </h3>
                      
                      {/* Appointment ID */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">
                          Appointment ID: <span className="font-mono font-medium text-gray-900">#{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Date and Time */}
                        <div className="flex items-center space-x-3">
                          <CalendarIcon className="h-5 w-5 text-gray-500" />
                          <span className="text-gray-700">
                            {form.watch('appointmentDate') && form.watch('appointmentTime') ? (
                              `${format(form.watch('appointmentDate'), 'EEEE, MMMM d')} | ${new Date(`2000-01-01T${form.watch('appointmentTime')}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${addMinutes(new Date(`2000-01-01T${form.watch('appointmentTime')}`), calendarSettings?.timeInterval || 30).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                            ) : (
                              'Date and time to be confirmed'
                            )}
                          </span>
                        </div>

                        {/* Location */}
                        <div className="flex items-center space-x-3">
                          <Video className="h-5 w-5 text-gray-500" />
                          <span className="text-gray-700">Video conference</span>
                        </div>

                        {/* Practitioner */}
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-gray-500" />
                          <span className="text-gray-700">
                            {practitioner?.user?.firstName} {practitioner?.user?.lastName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Contact Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        Contact details
                      </h3>
                      
                      <div className="space-y-3">
                        {/* Patient Name */}
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-gray-500" />
                          <span className="text-gray-700">
                            {form.watch('firstName')} {form.watch('lastName')}
                          </span>
                        </div>

                        {/* Phone and Email */}
                        <div className="flex items-center space-x-3">
                          <Phone className="h-5 w-5 text-gray-500" />
                          <span className="text-gray-700">
                            {form.watch('phone')} | {form.watch('email')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Notes */}
                    {form.watch('reason') && (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">Reason for visit</h4>
                          <p className="text-gray-700 text-sm bg-gray-50 rounded-lg p-3">
                            {form.watch('reason')}
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-sm text-gray-500">
                Powered by TiNHiH Portal
              </p>
              
              <div className="flex space-x-4">
                <Button 
                  variant="outline"
                  onClick={() => setIsSuccess(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 h-12"
                >
                  Make another appointment
                </Button>
                <Button 
                  onClick={() => window.close()}
                  className="bg-[#ffdd00] hover:bg-[#d1bd3a] text-black px-6 h-12"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-left mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Online booking appointment
            </h1>
          </div>

          {/* Progress Steps - Responsive Carepatron Style */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between overflow-x-auto">
              <div className="flex items-center space-x-2 sm:space-x-8 min-w-max">
                {/* Step 1: Staff */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className={cn(
                    "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium",
                    currentStep >= 1 ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"
                  )}>
                    {currentStep > 1 ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : "1"}
                  </div>
                  <span className={cn(
                    "text-xs sm:text-sm font-medium hidden sm:block",
                    currentStep >= 1 ? "text-gray-900" : "text-gray-500"
                  )}>
                    Staff
                  </span>
                </div>

                {/* Step 2: Date and time */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className={cn(
                    "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium",
                    currentStep >= 2 ? "bg-green-500 text-white" : currentStep === 2 ? "bg-purple-500 text-white" : "bg-gray-300 text-gray-600"
                  )}>
                    {currentStep > 2 ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : "2"}
                  </div>
                  <span className={cn(
                    "text-xs sm:text-sm font-medium hidden sm:block",
                    currentStep >= 2 ? "text-gray-900" : "text-gray-500"
                  )}>
                    Date and time
                  </span>
                </div>

                {/* Step 3: Contact details */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className={cn(
                    "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium",
                    currentStep === 3 ? "bg-[#ffdd00] text-black" : "bg-gray-300 text-gray-600"
                  )}>
                    3
                  </div>
                  <span className={cn(
                    "text-xs sm:text-sm font-medium hidden sm:block",
                    currentStep === 3 ? "text-gray-900" : "text-gray-500"
                  )}>
                    Contact details
                  </span>
                </div>
              </div>

              {/* User Avatar */}
              <div className="flex items-center space-x-1 sm:space-x-2 ml-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium">
                  {practitioner.user?.firstName?.charAt(0)}{practitioner.user?.lastName?.charAt(0)}
                </div>
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Step Content */}
          <Form {...form}>
            <div className="bg-white rounded-lg">
              {/* Step 1: Client Type Selection */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Select Client Type</h2>
                    <p className="text-sm sm:text-base text-gray-600">Choose how you'd like to proceed with your booking</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card 
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md border-2",
                        isReturningClient === true ? "border-[#ffdd00] bg-yellow-50" : "border-gray-200"
                      )}
                      onClick={() => setIsReturningClient(true)}
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Returning client</h3>
                              <p className="text-xs sm:text-sm text-gray-600">I've booked before</p>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card 
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md border-2",
                        isReturningClient === false ? "border-[#ffdd00] bg-yellow-50" : "border-gray-200"
                      )}
                      onClick={() => setIsReturningClient(false)}
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">New client</h3>
                              <p className="text-xs sm:text-sm text-gray-600">First time booking</p>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={nextStep}
                      disabled={isReturningClient === null}
                      className="bg-[#ffdd00] hover:bg-[#ffdd00] text-black px-4 sm:px-6 h-10 sm:h-12"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Date and Time Selection */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Select Date and Time</h2>
                    <p className="text-sm sm:text-base text-gray-600">Choose a convenient time for your appointment</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    {/* Calendar */}
                    <div>
                      <FormField
                        control={form.control}
                        name="appointmentDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base font-medium text-gray-900">Select Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className="w-full h-10 sm:h-12 text-left font-normal border-2 hover:border-[#ffdd00] focus:border-[#ffdd00] text-sm sm:text-base"
                                  >
                                    {field.value ? (
                                      format(field.value, "EEEE, MMMM d, yyyy")
                                    ) : (
                                      "Pick a date"
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => {
                                    field.onChange(date);
                                    setSelectedDate(date);
                                  }}
                                  disabled={(date) => {
                                    const today = startOfDay(new Date());
                                    const maxDate = addDays(today, bookingSettings?.advanceBookingDays || 30);
                                    return isBefore(date, today) || isAfter(date, maxDate);
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Time Slots */}
                    <div>
                      <FormField
                        control={form.control}
                        name="appointmentTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base font-medium text-gray-900">Select Time</FormLabel>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {slotsLoading ? (
                                <div className="col-span-full text-center py-4">
                                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                  <p className="text-sm text-gray-500 mt-1">Loading available times...</p>
                                </div>
                              ) : slotsError ? (
                                <div className="col-span-full text-center py-4">
                                  <p className="text-sm text-red-500">Failed to load time slots</p>
                                </div>
                              ) : availableSlots && availableSlots.length > 0 ? (
                                availableSlots.map((slot: any) => (
                                  <Button
                                    key={slot.time}
                                    type="button"
                                    variant={field.value === slot.time ? "default" : "outline"}
                                    className={cn(
                                      "h-10 sm:h-12 text-sm sm:text-base",
                                      field.value === slot.time 
                                        ? "bg-[#ffdd00] border-[#ffdd00] text-black hover:bg-[#d1bd3a]" 
                                        : "border-gray-300 hover:border-[#ffdd00]"
                                    )}
                                    onClick={() => field.onChange(slot.time)}
                                  >
                                    {slot.time}
                                  </Button>
                                ))
                              ) : (
                                <div className="col-span-full text-center py-4">
                                  <p className="text-sm text-gray-500">No available times for this date</p>
                                </div>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={prevStep}
                      className="border-gray-300 h-10 sm:h-12"
                    >
                      ← Back
                    </Button>
                    <Button 
                      onClick={nextStep}
                      disabled={!form.watch('appointmentDate') || !form.watch('appointmentTime')}
                      className="bg-[#ffdd00] hover:bg-[#ffdd00] text-black px-4 sm:px-6 h-10 sm:h-12 disabled:opacity-50"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Contact Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Contact Details</h2>
                    <p className="text-sm sm:text-base text-gray-600">Please provide your information to complete the booking</p>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base font-medium text-gray-900">First Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="h-10 sm:h-12 border-2 hover:border-[#ffdd00] focus:border-[#ffdd00] text-sm sm:text-base"
                                  placeholder="Enter your first name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm sm:text-base font-medium text-gray-900">Last Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="h-10 sm:h-12 border-2 hover:border-[#ffdd00] focus:border-[#ffdd00] text-sm sm:text-base"
                                  placeholder="Enter your last name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base font-medium text-gray-900">Email</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="email"
                                className="h-10 sm:h-12 border-2 hover:border-[#ffdd00] focus:border-[#ffdd00] text-sm sm:text-base"
                                placeholder="Enter your email address"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base font-medium text-gray-900">Phone Number</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="h-10 sm:h-12 border-2 hover:border-[#ffdd00] focus:border-[#ffdd00] text-sm sm:text-base"
                                placeholder="Enter your phone number"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base font-medium text-gray-900">Reason for Visit</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="min-h-[80px] sm:min-h-[100px] border-2 hover:border-[#ffdd00] focus:border-[#ffdd00] text-sm sm:text-base"
                                placeholder="Please describe the reason for your appointment"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="additionalNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm sm:text-base font-medium text-gray-900">Additional Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="min-h-[80px] sm:min-h-[100px] border-2 hover:border-[#ffdd00] focus:border-[#ffdd00] text-sm sm:text-base"
                                placeholder="Any additional information you'd like to share"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-between pt-4">
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                          className="border-gray-300 h-10 sm:h-12"
                        >
                          ← Back
                        </Button>
                        <Button 
                          type="submit"
                          disabled={bookAppointmentMutation.isPending}
                          className="bg-[#ffdd00] hover:bg-[#ffdd00] text-black px-4 sm:px-6 h-10 sm:h-12 disabled:opacity-50"
                        >
                          {bookAppointmentMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Booking...
                            </>
                          ) : (
                            'Book Appointment'
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              )}


            </div>
          </Form>

          {/* Footer */}
          <div className="text-center mt-6 sm:mt-8">
            <p className="text-xs sm:text-sm text-gray-500">Powered by TiNHiH Portal</p>
          </div>
        </div>
      </div>
    </div>
  );
} 