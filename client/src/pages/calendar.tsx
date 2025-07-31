import { useState, useEffect } from "react";
import { useTheme } from "@/context/theme-context";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { CalendarSidebar } from "@/components/calendar/calendar-sidebar";
import { AppointmentForm } from "@/components/calendar/forms/appointment-form";

import { TaskForm } from "@/components/calendar/forms/task-form";
import { ReminderForm } from "@/components/calendar/forms/reminder-form";
import { MeetingForm } from "@/components/calendar/forms/meeting-form";
import { OutOfOfficeForm } from "@/components/calendar/forms/out-of-office-form";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export type CalendarView = "month" | "week" | "day";
export type EventType = "appointment" | "task" | "reminder" | "meeting" | "out-of-office";

export default function Calendar() {
  const { calendarView, showWeekends } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  // Use user preference for calendar view, with responsive override on mobile
  const [view, setView] = useState<CalendarView>(calendarView);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<EventType | null>(null);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);

  // Update view when user preference changes
  useEffect(() => {
    setView(calendarView);
  }, [calendarView]);

  // Force day view on mobile devices
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setView("day");
      } else {
        setView(calendarView);
      }
    };
    
    // Check initial screen size
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calendarView]);

  const handleNewEvent = (type: EventType, date?: Date, time?: string) => {
    const selectedDateTime = date || new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Only allow appointments for today or future dates
    if (type === "appointment" && selectedDateTime < today) {
      return; // Don't open form for past dates
    }
    
    setFormType(type);
    setSelectedDate(selectedDateTime);
    setSelectedTime(time || null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormType(null);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleFormSubmit = () => {
    // Handle form submission
    handleCloseForm();
  };

  const renderForm = () => {
    if (!formType) return null;

    const commonProps = {
      selectedDate,
      selectedTime,
      onSubmit: handleFormSubmit,
      onCancel: handleCloseForm,
    };

    switch (formType) {
      case "appointment":
        return <AppointmentForm {...commonProps} />;
      case "task":
        return <TaskForm {...commonProps} />;
      case "reminder":
        return <ReminderForm {...commonProps} />;
      case "meeting":
        return <MeetingForm {...commonProps} />;
      case "out-of-office":
        return <OutOfOfficeForm {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <CalendarSidebar
          currentDate={currentDate}
          onDateSelect={(date) => {
            setCurrentDate(date);
            setView("day"); // Switch to day view when mini-calendar date is clicked
          }}
          selectedTeamMembers={selectedTeamMembers}
          onTeamMemberToggle={(memberId) => {
            setSelectedTeamMembers(prev =>
              prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
            );
          }}
        />
      </div>

      {/* Main calendar area */}
      <div className="flex-1 flex flex-col">
        <div className="px-2 sm:px-0 relative">
          {/* Mobile: Add margin for hamburger menu */}
          <div className="lg:hidden ml-16">
            <CalendarHeader
              currentDate={currentDate}
              view={view}
              onDateChange={setCurrentDate}
              onViewChange={setView}
              onNewEvent={handleNewEvent}
            />
          </div>
          {/* Desktop: Full width header */}
          <div className="hidden lg:block">
            <CalendarHeader
              currentDate={currentDate}
              view={view}
              onDateChange={setCurrentDate}
              onViewChange={setView}
              onNewEvent={handleNewEvent}
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Always show calendar grid - mobile will get day view */}
          <CalendarGrid
            currentDate={currentDate}
            view={view}
            selectedTeamMembers={selectedTeamMembers}
            onTimeSlotClick={(date, time) => handleNewEvent("appointment", date, time)}
            onEventClick={(event) => {
              // Handle event editing - this should NOT trigger create appointment form
              console.log("Edit event:", event);
            }}
            showWeekends={showWeekends}
          />
        </div>
      </div>

      {/* Off-canvas forms - Fully scrollable and responsive */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent 
          side="right" 
          className="w-[90vw] sm:w-[450px] lg:w-[600px] max-w-[600px] overflow-y-auto h-full p-4 sm:p-6"
        >
          <div className="space-y-4">
            {renderForm()}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}