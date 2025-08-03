import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Settings, 
  CheckCircle,
  Users,
  Bell,
  Shield,
  Globe,
  Palette,
  Eye,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { log } from 'console';

const bookingSettingsSchema = z.object({
  // General Settings
  isPublicBookingEnabled: z.boolean(),
  requireApproval: z.boolean(),
  allowDirectBooking: z.boolean(),
  
  // Profile Settings
  showProfile: z.boolean(),
  showSpecialty: z.boolean(),
  showConsultationFee: z.boolean(),
  
  // Appointment Settings
  advanceBookingDays: z.number().min(1).max(365),
  maxBookingsPerDay: z.number().min(1).max(50),
  bufferTime: z.number().min(0).max(60),
  
  // Notifications
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  reminderHours: z.number().min(1).max(168),
  
  // Security
  requirePhoneVerification: z.boolean(),
  requireEmailVerification: z.boolean(),
  
  // Customization
  customMessage: z.string().optional(),
  cancellationPolicy: z.string(),
});

type BookingSettingsFormData = z.infer<typeof bookingSettingsSchema>;

interface BookingSettingsProps {
  onClose?: () => void;
}

export function BookingSettings({ onClose }: BookingSettingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current booking settings
  const { data: currentSettings, isLoading, error } = useQuery({
    queryKey: ['booking-settings'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/practitioner/booking-settings');
        console.log(response);
        return response;
      } catch (error) {
        console.error('Failed to fetch booking settings:', error);
        // Return default settings if API fails
        return {
          isPublicBookingEnabled: true,
          requireApproval: true,
          allowDirectBooking: false,
          showProfile: true,
          showSpecialty: true,
          showConsultationFee: true,
          advanceBookingDays: 30,
          maxBookingsPerDay: 10,
          bufferTime: 15,
          emailNotifications: true,
          smsNotifications: false,
          reminderHours: 24,
          requirePhoneVerification: false,
          requireEmailVerification: true,
          cancellationPolicy: '24 hours notice required for cancellation',
          customMessage: 'Welcome to my booking page. I\'m looking forward to helping you with your healthcare needs.',
        };
      }
    },
    enabled: !!user,
    retry: 1,
  });

  const form = useForm<BookingSettingsFormData>({
    resolver: zodResolver(bookingSettingsSchema),
    mode: 'onChange',
    defaultValues: {
      isPublicBookingEnabled: true,
      requireApproval: true,
      allowDirectBooking: false,
      showProfile: true,
      showSpecialty: true,
      showConsultationFee: true,
      advanceBookingDays: 30,
      maxBookingsPerDay: 10,
      bufferTime: 15,
      emailNotifications: true,
      smsNotifications: false,
      reminderHours: 24,
      requirePhoneVerification: false,
      requireEmailVerification: true,
      cancellationPolicy: '24 hours notice required for cancellation',
      customMessage: 'Welcome to my booking page. I\'m looking forward to helping you with your healthcare needs.',
    }
  });

  // Update form when settings are loaded
  React.useEffect(() => {
    if (currentSettings) {
      form.reset(currentSettings);
    }
  }, [currentSettings, form]);

  // Save booking settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: BookingSettingsFormData) => {
      try {
        const response = await api.post('/api/practitioner/booking-settings', data);
        return response.data;
      } catch (error: any) {
        console.error('Failed to save booking settings:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['booking-settings'] });
    
      toast({
        title: "Settings Saved",
        description: "Your booking settings have been updated successfully.",
      });
      
      // Close the dialog after successful save
      if (onClose) {
        onClose();
      }
    },
    onError: (error: any) => {
      console.error('Save settings error:', error);
      toast({
        title: "Failed to Save Settings",
        description: error.message || "Failed to save booking settings",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: BookingSettingsFormData) => {
    console.log('Form submitted with data:', data);
    
    // Ensure all numeric fields are properly converted to numbers
    const processedData = {
      ...data,
      advanceBookingDays: Number(data.advanceBookingDays) || 30,
      maxBookingsPerDay: Number(data.maxBookingsPerDay) || 10,
      bufferTime: Number(data.bufferTime) || 15,
      reminderHours: Number(data.reminderHours) || 24,
    };
    
    console.log('Processed data for save:', processedData);
    saveSettingsMutation.mutate(processedData);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading booking settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load settings. Using default configuration.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Professional Booking Settings</h1>
          <p className="text-muted-foreground">
            Configure your public booking experience for optimal patient engagement
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Professional
          </Badge>
          <Badge variant={form.watch('isPublicBookingEnabled') ? "default" : "secondary"}>
            {form.watch('isPublicBookingEnabled') ? "Active" : "Inactive"}
          </Badge>
          {form.watch('isPublicBookingEnabled') && (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
          {saveSettingsMutation.isSuccess && (
            <Badge variant="default" className="text-xs bg-green-600">
              Saved ✓
            </Badge>
          )}
          {saveSettingsMutation.isPending && (
            <Badge variant="outline" className="text-xs">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Saving...
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Public Booking Configuration
                  </CardTitle>
                  <CardDescription>
                    Control how patients can access and book appointments with you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-base font-medium">Enable Public Booking</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Allow patients to book appointments through your public link
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="isPublicBookingEnabled"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-base font-medium">Require Approval</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Review and approve appointments before confirming
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="requireApproval"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-base font-medium">Allow Direct Booking</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Automatically confirm appointments without approval
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="allowDirectBooking"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Profile Visibility
                  </CardTitle>
                  <CardDescription>
                    Choose what information to display on your public booking page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <FormLabel>Show Profile Information</FormLabel>
                        <p className="text-sm text-muted-foreground">Display your name and photo</p>
                      </div>
                      <FormField
                        control={form.control}
                        name="showProfile"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <FormLabel>Show Medical Specialty</FormLabel>
                        <p className="text-sm text-muted-foreground">Display your area of expertise</p>
                      </div>
                      <FormField
                        control={form.control}
                        name="showSpecialty"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <FormLabel>Show Consultation Fees</FormLabel>
                        <p className="text-sm text-muted-foreground">Display appointment costs</p>
                      </div>
                      <FormField
                        control={form.control}
                        name="showConsultationFee"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appointment Settings */}
            <TabsContent value="appointments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Booking Rules & Availability
                  </CardTitle>
                  <CardDescription>
                    Configure how far in advance patients can book and other restrictions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="advanceBookingDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Advance Booking (Days)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              max="365"
                              placeholder="30"
                              value={field.value?.toString() || ''}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 30;
                                field.onChange(value);
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            How many days in advance patients can book (1-365 days)
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxBookingsPerDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Bookings Per Day</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              max="50"
                              placeholder="10"
                              value={field.value?.toString() || ''}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 10;
                                field.onChange(value);
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Maximum appointments per day (1-50)
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bufferTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Buffer Time (Minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              max="60"
                              placeholder="15"
                              value={field.value?.toString() || ''}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 15;
                                field.onChange(value);
                              }}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Time between appointments (0-60 minutes)
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="cancellationPolicy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cancellation Policy</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your cancellation policy..."
                            rows={3}
                            value={field.value || ''}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          This will be displayed to patients during booking
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about new bookings and reminders
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-base font-medium">Email Notifications</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications for new bookings and updates
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-base font-medium">SMS Notifications</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Receive SMS notifications for urgent updates
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="smsNotifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="reminderHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reminder Hours Before Appointment</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            max="168"
                            placeholder="24"
                            value={field.value?.toString() || ''}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 24;
                              field.onChange(value);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Send reminder notifications this many hours before appointments (1-168 hours)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security & Verification
                  </CardTitle>
                  <CardDescription>
                    Configure security measures to protect your booking system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-base font-medium">Require Phone Verification</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Verify patient phone numbers before confirming bookings
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="requirePhoneVerification"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-base font-medium">Require Email Verification</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Verify patient email addresses before confirming bookings
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="requireEmailVerification"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Customization
                  </CardTitle>
                  <CardDescription>
                    Add custom messages and branding to your booking page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Welcome Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Welcome to my booking page. I'm looking forward to helping you with your healthcare needs..."
                            rows={4}
                            value={field.value || ''}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          This message will appear at the top of your booking page
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preview Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Booking Page Preview
                </CardTitle>
                <CardDescription>
                  How your booking page will appear to patients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Public Booking:</span>
                    <Badge variant={form.watch('isPublicBookingEnabled') ? "default" : "secondary"} className="ml-2">
                      {form.watch('isPublicBookingEnabled') ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Approval Required:</span>
                    <Badge variant={form.watch('requireApproval') ? "default" : "secondary"} className="ml-2">
                      {form.watch('requireApproval') ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Advance Booking:</span>
                    <span className="ml-2">{form.watch('advanceBookingDays')} days</span>
                  </div>
                  <div>
                    <span className="font-medium">Max Daily Bookings:</span>
                    <span className="ml-2">{form.watch('maxBookingsPerDay')}</span>
                  </div>
                  <div>
                    <span className="font-medium">Buffer Time:</span>
                    <span className="ml-2">{form.watch('bufferTime')} minutes</span>
                  </div>
                  <div>
                    <span className="font-medium">Reminder:</span>
                    <span className="ml-2">{form.watch('reminderHours')} hours before</span>
                  </div>
                </div>
                
                {form.watch('customMessage') && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Welcome Message:</p>
                    <p className="text-sm text-muted-foreground">{form.watch('customMessage')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              
              {/* Debug button to test form data */}
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  const formData = form.getValues();
                  console.log('Current form data:', formData);
                  console.log('Form is valid:', form.formState.isValid);
                  console.log('Form errors:', form.formState.errors);
                }}
              >
                Debug Form
              </Button>
              
              <Button 
                type="submit" 
                disabled={saveSettingsMutation.isPending}
                className="min-w-[120px]"
              >
                {saveSettingsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  );
} 