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
import { apiRequest } from "@/lib/queryClient";

const calendarSettingsSchema = z.object({
  timeInterval: z.number().min(15).max(120),
  bufferTime: z.number().min(0).max(60),
  defaultStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  defaultEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  workingDays: z.array(z.number().min(0).max(6)),
  isGlobal: z.boolean().optional(),
});

type CalendarSettingsData = z.infer<typeof calendarSettingsSchema>;

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
      form.reset({
        timeInterval: settings.timeInterval || 60,
        bufferTime: settings.bufferTime || 0,
        defaultStartTime: settings.defaultStartTime || "09:00",
        defaultEndTime: settings.defaultEndTime || "17:00",
        workingDays: settings.workingDays || [1, 2, 3, 4, 5],
        isGlobal: settings.isGlobal || false,
      });
    }
  }, [settings, form]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: CalendarSettingsData) => {
      const method = settings?.id ? "PUT" : "POST";
      const url = settings?.id 
        ? `/api/calendar-settings/${settings.id}` 
        : "/api/calendar-settings";
      
      return await apiRequest(method, url, data);
    },
    onSuccess: () => {
      // CRITICAL: Force immediate calendar refresh
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      
      // Force refetch to ensure data is fresh
      queryClient.refetchQueries({ queryKey: ["/api/calendar-settings"] });
      
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
      toast({
        title: "Error",
        description: error.message || "Failed to save calendar settings",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CalendarSettingsData) => {
    // Validate that end time is after start time
    const [startHour, startMin] = data.defaultStartTime.split(':').map(Number);
    const [endHour, endMin] = data.defaultEndTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (endMinutes <= startMinutes) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    saveSettingsMutation.mutate(data);
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
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Calendar Settings</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Time Interval Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Time Interval</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarDays className="h-4 w-4" />
                <span>Working Hours</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div>
                <Label className="text-sm font-medium">Working Days</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <FormField
                      key={day.value}
                      control={form.control}
                      name="workingDays"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
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
                          </FormControl>
                          <Label className="text-sm">{day.label}</Label>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <span>Time Slots Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 mb-2">
                  Based on your settings, these time slots will be available:
                </p>
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {previewSlots.slice(0, 20).map((slot, index) => (
                    <span key={index} className="text-xs bg-white px-2 py-1 rounded border">
                      {slot}
                    </span>
                  ))}
                  {previewSlots.length > 20 && (
                    <span className="text-xs text-slate-500 px-2 py-1">
                      +{previewSlots.length - 20} more
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={saveSettingsMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}