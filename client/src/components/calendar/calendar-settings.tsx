import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings, Clock, CalendarDays, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const calendarSettingsSchema = z.object({
  timeInterval: z.number().min(15).max(120),
  bufferTime: z.number().min(0).max(60),
  defaultStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  defaultEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  workingDays: z.array(z.number().min(0).max(6)),
  isGlobal: z.boolean().optional(),
});

type CalendarSettingsData = z.infer<typeof calendarSettingsSchema>;

// API data type for sending to server (workingDays as strings)
type CalendarSettingsAPIData = Omit<CalendarSettingsData, 'workingDays'> & {
  workingDays: string[];
};

interface CalendarSettingsProps {
  onClose?: () => void;
}

const TIME_INTERVALS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
];

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

export function CalendarSettings({ onClose }: CalendarSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/calendar-settings", "practitioner-specific"],
    queryFn: async () => {
      const response = await api.get("/api/calendar-settings");
      console.log("Fetched calendar settings:", response);
      return response;
    },
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  const form = useForm<CalendarSettingsData>({
    resolver: zodResolver(calendarSettingsSchema),
    defaultValues: {
      timeInterval: 60,
      bufferTime: 0,
      defaultStartTime: "09:00",
      defaultEndTime: "17:00",
      workingDays: [1, 2, 3, 4, 5],
      isGlobal: false,
    },
  });

  // Update form when settings load
  React.useEffect(() => {
    if (settings) {
      // Convert working days from strings to numbers for form compatibility
      const workingDaysNumbers = settings.workingDays?.map(day => {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return dayNames.indexOf(day.toLowerCase());
      }).filter(day => day !== -1) || [1, 2, 3, 4, 5];

      form.reset({
        timeInterval: settings.timeInterval || 60,
        bufferTime: settings.bufferTime || 0,
        defaultStartTime: settings.defaultStartTime || "09:00",
        defaultEndTime: settings.defaultEndTime || "17:00",
        workingDays: workingDaysNumbers,
        isGlobal: settings.isGlobal || false,
      });
    }
  }, [settings, form]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: CalendarSettingsAPIData) => {
      console.log("Saving calendar settings:", data);
      console.log("Current settings ID:", settings?.id);
      
      if (settings?.id) {
        console.log("Updating existing settings with ID:", settings.id);
        return await api.put(`/api/calendar-settings/${settings.id}`, data);
      } else {
        console.log("Creating new settings");
        return await api.post("/api/calendar-settings", data);
      }
    },
    onSuccess: () => {
      // CRITICAL: Force immediate calendar refresh
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-settings", "practitioner-specific"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      
      // Force refetch to ensure data is fresh
      queryClient.refetchQueries({ queryKey: ["/api/calendar-settings", "practitioner-specific"] });
      
      toast({
        title: "Success",
        description: "Calendar settings saved successfully",
      });
      
      // Delay close to allow refresh
      setTimeout(() => {
        onClose?.();
      }, 200);
    },
    onError: (error: any) => {
      console.error("Save settings error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save calendar settings",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CalendarSettingsData) => {
    console.log("Form submitted with data:", data);
    
    // Validate that end time is after start time
    const [startHour, startMin] = data.defaultStartTime.split(':').map(Number);
    const [endHour, endMin] = data.defaultEndTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    console.log("Time validation:", { startMinutes, endMinutes, isValid: endMinutes > startMinutes });
    
    if (endMinutes <= startMinutes) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    // Convert working days from numbers to strings for database compatibility
    const processedData: CalendarSettingsAPIData = {
      ...data,
      workingDays: data.workingDays.map(day => {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return dayNames[day];
      })
    };

    console.log("Processed data for API:", processedData);
    console.log("Calling saveSettingsMutation.mutate");
    saveSettingsMutation.mutate(processedData);
  };

  const generateTimeSlots = (startTime: string, endTime: string, interval: number) => {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    while (currentMinutes < endMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const min = currentMinutes % 60;
      slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
      currentMinutes += interval;
    }
    
    return slots;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Calendar Settings</h2>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const currentValues = form.watch();
  const previewSlots = generateTimeSlots(
    currentValues.defaultStartTime,
    currentValues.defaultEndTime,
    currentValues.timeInterval
  );

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar Settings</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure your working hours, time slots, and availability preferences
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Time Interval Settings */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-lg">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <span className="font-semibold">Time Interval</span>
                  <p className="text-sm font-normal text-gray-600 dark:text-gray-400 mt-1">
                    Configure appointment duration and buffer times
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="timeInterval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Appointment Duration</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select interval" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIME_INTERVALS.map((interval) => (
                          <SelectItem key={interval.value} value={interval.value.toString()}>
                            {interval.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This determines how time slots are generated in the calendar
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bufferTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buffer Time (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="60" 
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Prevent appointments from being booked within this time before the slot
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-lg">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <span className="font-semibold">Working Hours</span>
                  <p className="text-sm font-normal text-gray-600 dark:text-gray-400 mt-1">
                    Set your daily schedule and working days
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="defaultStartTime"
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
                  name="defaultEndTime"
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

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Working Days</Label>
                <div className="grid grid-cols-2 gap-3">
                  {DAYS_OF_WEEK.map((day) => (
                    <FormField
                      key={day.value}
                      control={form.control}
                      name="workingDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <Switch
                                checked={field.value?.includes(day.value)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, day.value]);
                                  } else {
                                    field.onChange(current.filter(d => d !== day.value));
                                  }
                                }}
                              />
                              <Label className="text-sm font-medium cursor-pointer">{day.label}</Label>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="border-0 shadow-sm bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-lg">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <span className="font-semibold">Time Slots Preview</span>
                  <p className="text-sm font-normal text-gray-600 dark:text-gray-400 mt-1">
                    Preview of available time slots based on your settings
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Available time slots ({previewSlots.length} total):
                  </p>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                  {previewSlots.slice(0, 24).map((slot, index) => (
                    <span key={index} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-2 rounded-lg font-medium text-center">
                      {slot}
                    </span>
                  ))}
                  {previewSlots.length > 24 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 text-center">
                      +{previewSlots.length - 24} more
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="px-6 py-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={saveSettingsMutation.isPending}
              className="px-6 py-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
            >
              {saveSettingsMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}