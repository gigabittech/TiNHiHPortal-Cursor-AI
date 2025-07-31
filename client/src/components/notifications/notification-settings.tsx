import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Monitor, 
  Moon,
  Save,
  Calendar,
  Users,
  FileText,
  CreditCard,
  MessageSquare,
  Video,
  Settings,
  Shield
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const notificationPreferencesSchema = z.object({
  // Email notifications
  emailAppointments: z.boolean(),
  emailPatientUpdates: z.boolean(),
  emailClinicalNotes: z.boolean(),
  emailBilling: z.boolean(),
  emailMessages: z.boolean(),
  emailTelehealth: z.boolean(),
  emailSystem: z.boolean(),
  emailSecurity: z.boolean(),
  
  // Browser notifications
  browserAppointments: z.boolean(),
  browserPatientUpdates: z.boolean(),
  browserClinicalNotes: z.boolean(),
  browserBilling: z.boolean(),
  browserMessages: z.boolean(),
  browserTelehealth: z.boolean(),
  browserSystem: z.boolean(),
  browserSecurity: z.boolean(),
  
  // SMS notifications
  smsAppointments: z.boolean(),
  smsUrgentOnly: z.boolean(),
  
  // Quiet hours
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.string(),
  quietHoursEnd: z.string(),
});

interface NotificationCategory {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const notificationCategories: NotificationCategory[] = [
  {
    key: 'Appointments',
    icon: Calendar,
    title: 'Appointments',
    description: 'Appointment scheduling, updates, and reminders'
  },
  {
    key: 'PatientUpdates', 
    icon: Users,
    title: 'Patient Updates',
    description: 'New patient registrations and profile changes'
  },
  {
    key: 'ClinicalNotes',
    icon: FileText,
    title: 'Clinical Notes',
    description: 'New clinical documentation and updates'
  },
  {
    key: 'Billing',
    icon: CreditCard,
    title: 'Billing & Payments',
    description: 'Invoice generation, payments, and overdue notices'
  },
  {
    key: 'Messages',
    icon: MessageSquare,
    title: 'Messages',
    description: 'New messages and communication updates'
  },
  {
    key: 'Telehealth',
    icon: Video,
    title: 'Telehealth',
    description: 'Video session notifications and updates'
  },
  {
    key: 'System',
    icon: Settings,
    title: 'System Updates',
    description: 'Platform updates and maintenance notifications'
  },
  {
    key: 'Security',
    icon: Shield,
    title: 'Security Alerts',
    description: 'Security-related notifications and alerts'
  }
];

export function NotificationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current notification preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['/api/notifications/preferences'],
  });

  const form = useForm({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: preferences || {
      // Email defaults
      emailAppointments: true,
      emailPatientUpdates: true,
      emailClinicalNotes: false,
      emailBilling: true,
      emailMessages: true,
      emailTelehealth: true,
      emailSystem: true,
      emailSecurity: true,
      
      // Browser defaults
      browserAppointments: true,
      browserPatientUpdates: false,
      browserClinicalNotes: false,
      browserBilling: true,
      browserMessages: true,
      browserTelehealth: true,
      browserSystem: false,
      browserSecurity: true,
      
      // SMS defaults
      smsAppointments: false,
      smsUrgentOnly: true,
      
      // Quiet hours defaults
      quietHoursEnabled: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "08:00",
    },
  });

  // Update preferences when data loads
  React.useEffect(() => {
    if (preferences) {
      form.reset(preferences);
    }
  }, [preferences, form]);

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('/api/notifications/preferences', {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/preferences'] });
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notification preferences.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: any) => {
    updatePreferencesMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="animate-pulse flex items-center space-x-2">
                    <div className="h-4 w-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Notification Categories */}
        <div className="grid gap-6">
          {notificationCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    {category.title}
                  </CardTitle>
                  <CardDescription>
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Email Notifications */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="w-4 h-4" />
                        Email
                      </div>
                      <FormField
                        control={form.control}
                        name={`email${category.key}` as any}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm">
                                Enable email notifications
                              </FormLabel>
                            </div>
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

                    {/* Browser Notifications */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Monitor className="w-4 h-4" />
                        Browser
                      </div>
                      <FormField
                        control={form.control}
                        name={`browser${category.key}` as any}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm">
                                Enable browser notifications
                              </FormLabel>
                            </div>
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

                    {/* SMS Notifications (only for appointments) */}
                    {category.key === 'Appointments' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Smartphone className="w-4 h-4" />
                          SMS
                        </div>
                        <FormField
                          control={form.control}
                          name="smsAppointments"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-sm">
                                  Enable SMS notifications
                                </FormLabel>
                              </div>
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
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator />

        {/* Additional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Additional Settings
            </CardTitle>
            <CardDescription>
              Configure additional notification preferences and quiet hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* SMS Urgent Only */}
            <FormField
              control={form.control}
              name="smsUrgentOnly"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>SMS for Urgent Notifications Only</FormLabel>
                    <FormDescription>
                      Only receive SMS for high priority and urgent notifications.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Quiet Hours */}
            <FormField
              control={form.control}
              name="quietHoursEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="flex items-center gap-2">
                      <Moon className="w-4 h-4" />
                      Enable Quiet Hours
                    </FormLabel>
                    <FormDescription>
                      Pause non-urgent notifications during specified hours.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Quiet Hours Time Selection */}
            {form.watch('quietHoursEnabled') && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <FormField
                  control={form.control}
                  name="quietHoursStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="quietHoursEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={updatePreferencesMutation.isPending}
            className="min-w-[120px]"
          >
            {updatePreferencesMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}