import { useState } from "react";
import { Header } from "@/components/layout/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TodaySchedule } from "@/components/dashboard/today-schedule";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { InsightsCards } from "@/components/dashboard/insights-cards";
import { AppointmentForm } from "@/components/calendar/forms/appointment-form";
import { useAuth } from "@/context/auth-context";
import { Plus } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function Dashboard() {
  const { user } = useAuth();
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleQuickAction = () => {
    setSelectedDate(new Date()); // Default to today
    setShowAppointmentForm(true);
  };

  const handleCloseForm = () => {
    setShowAppointmentForm(false);
    setSelectedDate(null);
  };

  const handleFormSubmit = () => {
    // Handle form submission - could add success toast here
    handleCloseForm();
  };

  return (
    <div 
      className="flex flex-col h-full transition-colors duration-300"
      style={{ backgroundColor: `hsl(var(--background))` }}
    >
      <Header 
        title="Dashboard" 
        subtitle="Welcome back, {name}"
        onQuickAction={handleQuickAction}
        quickActionLabel="New"
      />
      
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        {/* Stats Cards */}
        <StatsCards className="mb-4 lg:mb-6" />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Today's Schedule */}
          <TodaySchedule className="lg:col-span-2" />

          {/* Quick Actions, Insights & Recent Activity */}
          <div className="space-y-4 lg:space-y-6">
            <QuickActions />
            <div>
              <h3 
                className="text-lg font-semibold mb-4 transition-colors duration-300"
                style={{ color: `hsl(var(--foreground))` }}
              >
                Insights
              </h3>
              <InsightsCards />
            </div>
            <RecentActivity />
          </div>
        </div>
      </div>

      {/* Floating Action Button - Mobile only */}
      <button 
        onClick={handleQuickAction}
        className="fixed bottom-4 right-4 w-12 h-12 lg:w-14 lg:h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center lg:hidden"
        style={{
          backgroundColor: `hsl(var(--primary))`,
          color: `hsl(var(--primary-foreground))`
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = `hsl(var(--primary) / 0.9)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = `hsl(var(--primary))`;
        }}
      >
        <Plus className="w-5 h-5 lg:w-6 lg:h-6" />
      </button>

      {/* Appointment Creation Form */}
      <Sheet open={showAppointmentForm} onOpenChange={setShowAppointmentForm}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <AppointmentForm
            selectedDate={selectedDate}
            selectedTime={null}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseForm}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
