import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/context/theme-context";
import { Button } from "@/components/ui/button";
import { ThemedCard as Card, ThemedCardContent as CardContent, ThemedCardDescription as CardDescription, ThemedCardHeader as CardHeader, ThemedCardTitle as CardTitle } from "@/components/ui/themed-card";
import { ModuleHeader } from "@/components/layout/module-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, User, Globe, Palette, Clock, Shield, Bell, Eye, Monitor, Smartphone } from "lucide-react";
import { notificationService } from "@/lib/notification-service";

interface SystemSettings {
  id: string;
  organizationName: string;
  organizationLogo?: string;
  primaryColor: string;
  secondaryColor: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  language: string;
  businessHoursStart: string;
  businessHoursEnd: string;
  workingDays: string[];
  allowWeekendBookings: boolean;
  defaultAppointmentDuration: number;
  maxAdvanceBookingDays: number;
  minAdvanceBookingHours: number;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  appointmentReminderHours: number;
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  requireTwoFactor: boolean;
  defaultTelehealthPlatform: string;
  telehealthBufferMinutes: number;
  allowRecording: boolean;
}

interface UserPreferences {
  id: string;
  userId: string;
  theme: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  defaultDashboardView: string;
  showPatientPhotos: boolean;
  compactMode: boolean;
  emailNotifications: boolean;
  browserNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  messageNotifications: boolean;
  calendarView: string;
  startDayOfWeek: number;
  showWeekends: boolean;
  timeSlotDuration: number;
  fontSizeScale: string;
  highContrast: boolean;
  reduceMotion: boolean;
  screenReaderOptimized: boolean;
  shareDataForAnalytics: boolean;
  allowTelemetry: boolean;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("user");
  const {
    theme,
    compactMode,
    showPatientPhotos,
    highContrast,
    reduceMotion,
    screenReaderOptimized,
    fontSize,
    calendarView,
    showWeekends,
    setTheme,
    setCompactMode,
    setShowPatientPhotos,
    setHighContrast,
    setReduceMotion,
    setScreenReaderOptimized,
    setFontSize,
    setCalendarView,
    setShowWeekends,
  } = useTheme();

  // Check if user is admin for system settings access
  const { data: currentUser } = useQuery<{ role?: string }>({
    queryKey: ["/api/auth/me"],
  });

  // User preferences
  const { data: userPreferences, isLoading: loadingPreferences } = useQuery<UserPreferences>({
    queryKey: ["/api/user-preferences"],
  });

  // System settings (admin only)
  const { data: systemSettings, isLoading: loadingSystemSettings } = useQuery<SystemSettings>({
    queryKey: ["/api/system-settings"],
    enabled: currentUser?.role === "admin",
  });

  const updateUserPreferences = useMutation({
    mutationFn: (data: Partial<UserPreferences>) => 
      apiRequest("/api/user-preferences", "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-preferences"] });
      toast({
        title: "Success",
        description: "Your preferences have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences.",
        variant: "destructive",
      });
    },
  });

  const updateSystemSettings = useMutation({
    mutationFn: (data: Partial<SystemSettings>) => 
      apiRequest("/api/system-settings", "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
      toast({
        title: "Success",
        description: "System settings have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update system settings.",
        variant: "destructive",
      });
    },
  });

  const handleUserPreferenceChange = (field: keyof UserPreferences, value: any) => {
    updateUserPreferences.mutate({ [field]: value });
  };

  const handleSystemSettingChange = (field: keyof SystemSettings, value: any) => {
    updateSystemSettings.mutate({ [field]: value });
  };

  const timezones = [
    "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "America/Toronto", "America/Phoenix", "America/Anchorage", "Pacific/Honolulu",
    "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Rome", "Europe/Madrid",
    "Asia/Tokyo", "Asia/Shanghai", "Asia/Seoul", "Asia/Kolkata", "Asia/Dubai",
    "Australia/Sydney", "Australia/Melbourne", "Pacific/Auckland"
  ];

  const languages = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "zh", label: "Chinese" },
  ];

  const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];

  if (loadingPreferences && activeTab === "user") {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (loadingSystemSettings && activeTab === "system" && currentUser?.role === "admin") {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: `hsl(var(--background))` }}
    >
      <ModuleHeader
        title="Settings"
        description="Manage your personal preferences and system configuration"
      />
      
      <div className="container mx-auto p-6 max-w-6xl">

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="user" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            User Preferences
          </TabsTrigger>
          {currentUser?.role === "admin" && (
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System Settings
              <Badge variant="secondary" className="ml-1">Admin</Badge>
            </TabsTrigger>
          )}
        </TabsList>

        {/* User Preferences Tab */}
        <TabsContent value="user" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Display Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Display Preferences
                </CardTitle>
                <CardDescription>
                  Customize how the interface looks and behaves
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={theme}
                      onValueChange={(value: 'light' | 'dark' | 'auto') => setTheme(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="auto">Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Select
                      value={fontSize}
                      onValueChange={(value: 'small' | 'medium' | 'large') => setFontSize(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use smaller spacing and components
                    </p>
                  </div>
                  <Switch
                    checked={compactMode}
                    onCheckedChange={setCompactMode}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Patient Photos</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Display patient photos in lists and cards
                    </p>
                  </div>
                  <Switch
                    checked={showPatientPhotos}
                    onCheckedChange={setShowPatientPhotos}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences?.emailNotifications !== false}
                    onCheckedChange={(checked) => handleUserPreferenceChange("emailNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Browser Notifications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Show desktop notifications
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences?.browserNotifications !== false}
                    onCheckedChange={async (checked) => {
                      if (checked) {
                        const permission = await notificationService.requestPermission();
                        if (permission === 'granted') {
                          handleUserPreferenceChange("browserNotifications", checked);
                          notificationService.showSystemNotification(
                            'Notifications Enabled',
                            'You will now receive browser notifications for important updates.',
                            'low'
                          );
                        } else {
                          toast({
                            title: "Permission Required",
                            description: "Please allow notifications in your browser settings to enable this feature.",
                            variant: "destructive",
                          });
                        }
                      } else {
                        handleUserPreferenceChange("browserNotifications", checked);
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Appointment Reminders</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get reminded about upcoming appointments
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences?.appointmentReminders !== false}
                    onCheckedChange={(checked) => {
                      handleUserPreferenceChange("appointmentReminders", checked);
                      if (checked) {
                        notificationService.showSystemNotification(
                          'Appointment Reminders Enabled',
                          'You will receive notifications 15 minutes before your appointments.',
                          'low'
                        );
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Message Notifications</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get notified about new messages
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences?.messageNotifications !== false}
                    onCheckedChange={(checked) => {
                      handleUserPreferenceChange("messageNotifications", checked);
                      if (checked) {
                        notificationService.showSystemNotification(
                          'Test Message Notification',
                          'This is how message notifications will appear.',
                          'low'
                        );
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Calendar Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Calendar & Time
                </CardTitle>
                <CardDescription>
                  Set your time zone and calendar preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Time Zone</Label>
                    <Select
                      value={userPreferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                      onValueChange={(value) => {
                        handleUserPreferenceChange("timezone", value);
                        toast({
                          title: "Timezone Updated",
                          description: `All dates and times will now be displayed in ${value.replace("_", " ")} timezone.`,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz.replace("_", " ")} ({new Date().toLocaleTimeString('en-US', { timeZone: tz, timeZoneName: 'short' }).split(' ').pop()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="calendarView">Default Calendar View</Label>
                    <Select
                      value={calendarView}
                      onValueChange={(value: 'day' | 'week' | 'month') => setCalendarView(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Weekends</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Display weekends in calendar views
                    </p>
                  </div>
                  <Switch
                    checked={showWeekends}
                    onCheckedChange={setShowWeekends}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Accessibility */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Accessibility
                </CardTitle>
                <CardDescription>
                  Options to improve accessibility and usability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>High Contrast</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use higher contrast colors
                    </p>
                  </div>
                  <Switch
                    checked={highContrast}
                    onCheckedChange={setHighContrast}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Reduce Motion</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Minimize animations and transitions
                    </p>
                  </div>
                  <Switch
                    checked={reduceMotion}
                    onCheckedChange={setReduceMotion}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Screen Reader Optimized</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enhanced support for screen readers
                    </p>
                  </div>
                  <Switch
                    checked={screenReaderOptimized}
                    onCheckedChange={setScreenReaderOptimized}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Settings Tab (Admin Only) */}
        {currentUser?.role === "admin" && (
          <TabsContent value="system" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Organization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Organization
                  </CardTitle>
                  <CardDescription>
                    Basic organization information and branding
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={systemSettings?.organizationName || ""}
                      onChange={(e) => handleSystemSettingChange("organizationName", e.target.value)}
                      placeholder="TiNHiH Foundation"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <Input
                        id="primaryColor"
                        type="color"
                        value={systemSettings?.primaryColor || "#ffdd00"}
                        onChange={(e) => handleSystemSettingChange("primaryColor", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={systemSettings?.currency || "USD"}
                        onValueChange={(value) => handleSystemSettingChange("currency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Business Hours
                  </CardTitle>
                  <CardDescription>
                    Set default operating hours for your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={systemSettings?.businessHoursStart || "09:00"}
                        onChange={(e) => handleSystemSettingChange("businessHoursStart", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={systemSettings?.businessHoursEnd || "17:00"}
                        onChange={(e) => handleSystemSettingChange("businessHoursEnd", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Weekend Bookings</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enable appointments on weekends
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings?.allowWeekendBookings || false}
                      onCheckedChange={(checked) => handleSystemSettingChange("allowWeekendBookings", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Appointments
                  </CardTitle>
                  <CardDescription>
                    Configure appointment booking settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultDuration">Default Duration (minutes)</Label>
                      <Input
                        id="defaultDuration"
                        type="number"
                        min="15"
                        max="480"
                        step="15"
                        value={systemSettings?.defaultAppointmentDuration || 60}
                        onChange={(e) => handleSystemSettingChange("defaultAppointmentDuration", parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxAdvanceDays">Max Advance Booking (days)</Label>
                      <Input
                        id="maxAdvanceDays"
                        type="number"
                        min="1"
                        max="365"
                        value={systemSettings?.maxAdvanceBookingDays || 90}
                        onChange={(e) => handleSystemSettingChange("maxAdvanceBookingDays", parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minAdvanceHours">Minimum Advance Notice (hours)</Label>
                    <Input
                      id="minAdvanceHours"
                      type="number"
                      min="1"
                      max="168"
                      value={systemSettings?.minAdvanceBookingHours || 24}
                      onChange={(e) => handleSystemSettingChange("minAdvanceBookingHours", parseInt(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security
                  </CardTitle>
                  <CardDescription>
                    Configure security and authentication settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="30"
                        max="1440"
                        value={systemSettings?.sessionTimeoutMinutes || 480}
                        onChange={(e) => handleSystemSettingChange("sessionTimeoutMinutes", parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passwordLength">Minimum Password Length</Label>
                      <Input
                        id="passwordLength"
                        type="number"
                        min="6"
                        max="50"
                        value={systemSettings?.passwordMinLength || 8}
                        onChange={(e) => handleSystemSettingChange("passwordMinLength", parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Mandate 2FA for all users
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings?.requireTwoFactor || false}
                      onCheckedChange={(checked) => handleSystemSettingChange("requireTwoFactor", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
      </div>
    </div>
  );
}